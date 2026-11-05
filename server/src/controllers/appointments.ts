import type { NextFunction, Request, Response } from "express";
import { DateTime } from "luxon";
import {
  findBookableService,
  findOwnedAppointment,
  insertAppointment,
  listClientAppointments,
  listProviderAppointments,
  transitionAppointment,
  type AppointmentOwner,
} from "../db/appointments";
import { findBusyIntervals, listAvailability } from "../db/availability";
import { findProviderByUserId } from "../db/providers";
import {
  explainRefusedTransition,
  type TransitionAction,
} from "../lib/appointmentStatus";
import {
  bookingWindow,
  computeSlots,
  dayOfWeek,
  TIME_ZONE,
  toNewYorkISO,
} from "../lib/slots";
import {
  appointmentIdSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
} from "../validation/appointments";
import { sendValidationError } from "../validation/respond";

const APPOINTMENT_NOT_FOUND = "Appointment not found.";

// Every appointment the API returns shows its times in New York time with
// the offset ("2026-11-16T10:00:00-05:00"), matching the slots endpoint.
// Postgres hands us Date objects, which would otherwise print as UTC ("Z").
function withNewYorkTimes<T extends { start_at: Date; end_at: Date }>(
  appointment: T,
): Omit<T, "start_at" | "end_at"> & { start_at: string; end_at: string } {
  return {
    ...appointment,
    start_at: toNewYorkISO(appointment.start_at),
    end_at: toNewYorkISO(appointment.end_at),
  };
}
const TIME_NOT_AVAILABLE = "That time isn't available.";

// Postgres error 23P01 = an exclusion constraint refused the row. Ours
// stop two requested/confirmed appointments overlapping for the same
// provider or the same client. The constraint name says which.
function overlapMessage(err: unknown): string | null {
  if (
    typeof err !== "object" ||
    err === null ||
    !("code" in err) ||
    err.code !== "23P01"
  ) {
    return null;
  }
  const constraint = "constraint" in err ? err.constraint : undefined;
  if (constraint === "appointments_no_client_overlap") {
    return "You already have a booking that overlaps this time.";
  }
  return "That time was just taken. Please pick another slot.";
}

// POST /api/appointments
// A client requests a booking. Everything except the client's own choices
// (service, time, location, notes) is decided here, not taken from the body.
export async function createAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const body = parsed.data;
    const clientId = req.user!.id;

    const service = await findBookableService(body.service_id);
    if (!service) {
      res.status(404).json({ error: "Service not found." });
      return;
    }
    if (service.provider_user_id === clientId) {
      res.status(400).json({ error: "You can't book your own service." });
      return;
    }
    if (!service.is_accepting_bookings) {
      res
        .status(409)
        .json({ error: "This provider isn't accepting bookings right now." });
      return;
    }

    // The requested start must be exactly one of the slots the slots
    // endpoint would offer right now, computed the same way (New York time).
    const now = DateTime.now();
    const startAt = DateTime.fromISO(body.start_at).setZone(TIME_ZONE);
    const day = startAt.startOf("day");
    if (!bookingWindow(now).contains(day)) {
      res.status(400).json({ error: TIME_NOT_AVAILABLE });
      return;
    }
    const [blocks, busy] = await Promise.all([
      listAvailability(service.provider_id, dayOfWeek(day)),
      findBusyIntervals(
        service.provider_id,
        day.toJSDate(),
        day.plus({ days: 1 }).toJSDate(),
      ),
    ]);
    const slots = computeSlots({
      day,
      blocks,
      durationMin: service.duration_min,
      busy,
      now,
    });
    const isOpenSlot = slots.some(
      (slot) =>
        DateTime.fromISO(slot.start_at).toMillis() === startAt.toMillis(),
    );
    if (!isOpenSlot) {
      res.status(400).json({ error: TIME_NOT_AVAILABLE });
      return;
    }

    try {
      const appointment = await insertAppointment({
        client_id: clientId,
        provider_id: service.provider_id,
        service_id: service.id,
        start_at: startAt.toJSDate(),
        end_at: startAt.plus({ minutes: service.duration_min }).toJSDate(),
        // Copied now, so later price changes don't rewrite this booking.
        price: service.price,
        location_type: body.location_type,
        location_details: body.location_details ?? null,
        client_notes: body.client_notes ?? null,
      });
      res.status(201).json(withNewYorkTimes(appointment));
    } catch (err) {
      // Someone else booked an overlapping time between our slot check
      // and this insert. The database is the final judge.
      const message = overlapMessage(err);
      if (message) {
        res.status(409).json({ error: message });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments/mine
export async function listMyAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = listAppointmentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const appointments = await listClientAppointments(
      req.user!.id,
      parsed.data,
    );
    res.json({
      appointments: appointments.map(withNewYorkTimes),
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments/incoming
export async function listIncomingAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = listAppointmentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const appointments = await listProviderAppointments(
      req.provider!.id,
      parsed.data,
    );
    res.json({
      appointments: appointments.map(withNewYorkTimes),
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  } catch (err) {
    next(err);
  }
}

// Shared by accept/decline/complete/cancel: try the conditional UPDATE;
// if it matched nothing, look the appointment up only to pick 404 vs 409.
async function changeStatus(
  req: Request,
  res: Response,
  action: TransitionAction,
  owner: AppointmentOwner,
) {
  const parsedId = appointmentIdSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    sendValidationError(res, parsedId.error);
    return;
  }

  const updated = await transitionAppointment(parsedId.data, owner, action);
  if (updated) {
    res.json(withNewYorkTimes(updated));
    return;
  }

  const current = await findOwnedAppointment(parsedId.data, owner);
  if (!current) {
    res.status(404).json({ error: APPOINTMENT_NOT_FOUND });
    return;
  }
  res.status(409).json({ error: explainRefusedTransition(action, current) });
}

// Provider-only actions: the appointment must be for req.provider.
function providerAction(action: TransitionAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await changeStatus(req, res, action, { providerId: req.provider!.id });
    } catch (err) {
      next(err);
    }
  };
}

// POST /api/appointments/:id/accept   requested -> confirmed
export const acceptAppointment = providerAction("accept");
// POST /api/appointments/:id/decline  requested -> declined
export const declineAppointment = providerAction("decline");
// POST /api/appointments/:id/complete confirmed -> completed (after end)
export const completeAppointment = providerAction("complete");

// POST /api/appointments/:id/cancel
// The client or the provider of the appointment may cancel.
export async function cancelAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const provider = await findProviderByUserId(req.user!.id);
    await changeStatus(req, res, "cancel", {
      clientId: req.user!.id,
      providerId: provider?.id,
    });
  } catch (err) {
    next(err);
  }
}
