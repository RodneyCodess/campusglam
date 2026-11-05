import type { NextFunction, Request, Response } from "express";
import { DateTime } from "luxon";
import {
  findActiveServiceForProvider,
  findBusyIntervals,
  listAvailability,
  replaceAvailability,
} from "../db/availability";
import { findPublicProviderById } from "../db/providers";
import {
  BOOKING_WINDOW_DAYS,
  computeSlots,
  dayOfWeek,
  TIME_ZONE,
  todayInNewYork,
} from "../lib/slots";
import {
  replaceAvailabilitySchema,
  slotsQuerySchema,
} from "../validation/availability";
import { providerIdSchema } from "../validation/providers";
import { sendValidationError } from "../validation/respond";

const PROVIDER_NOT_FOUND = "Provider not found.";

// PUT /api/availability/mine
export async function replaceMyAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = replaceAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const blocks = await replaceAvailability(
      req.provider!.id,
      parsed.data.blocks,
    );
    res.json({ time_zone: TIME_ZONE, blocks });
  } catch (err) {
    next(err);
  }
}

// GET /api/availability/mine
export async function getMyAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const blocks = await listAvailability(req.provider!.id);
    res.json({ time_zone: TIME_ZONE, blocks });
  } catch (err) {
    next(err);
  }
}

// GET /api/providers/:id/availability
// Same visibility as GET /api/providers/:id (rejected providers are hidden).
export async function getProviderAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsedId = providerIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      sendValidationError(res, parsedId.error);
      return;
    }
    const provider = await findPublicProviderById(parsedId.data);
    if (!provider) {
      res.status(404).json({ error: PROVIDER_NOT_FOUND });
      return;
    }
    const blocks = await listAvailability(provider.id);
    res.json({ time_zone: TIME_ZONE, blocks });
  } catch (err) {
    next(err);
  }
}

// GET /api/providers/:id/slots?service_id=&date=YYYY-MM-DD
export async function getProviderSlots(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsedId = providerIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      sendValidationError(res, parsedId.error);
      return;
    }
    const parsedQuery = slotsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      sendValidationError(res, parsedQuery.error);
      return;
    }
    const { service_id: serviceId, date } = parsedQuery.data;

    // "date" is a New York calendar day: midnight in New York, not UTC.
    const now = DateTime.now();
    const today = todayInNewYork(now);
    const day = DateTime.fromISO(date, { zone: TIME_ZONE }).startOf("day");
    const lastDay = today.plus({ days: BOOKING_WINDOW_DAYS });
    if (day < today || day > lastDay) {
      res.status(400).json({
        error: "Invalid request",
        fields: {
          date: [
            `date must be between ${today.toISODate()} and ${lastDay.toISODate()}`,
          ],
        },
        other: [],
      });
      return;
    }

    const provider = await findPublicProviderById(parsedId.data);
    if (!provider) {
      res.status(404).json({ error: PROVIDER_NOT_FOUND });
      return;
    }
    if (!provider.is_accepting_bookings) {
      res
        .status(409)
        .json({ error: "This provider isn't accepting bookings right now." });
      return;
    }
    const service = await findActiveServiceForProvider(serviceId, provider.id);
    if (!service) {
      res.status(404).json({ error: "Service not found for this provider." });
      return;
    }

    const nextDay = day.plus({ days: 1 });
    const [blocks, busy] = await Promise.all([
      listAvailability(provider.id, dayOfWeek(day)),
      findBusyIntervals(provider.id, day.toJSDate(), nextDay.toJSDate()),
    ]);

    const slots = computeSlots({
      day,
      blocks,
      durationMin: service.duration_min,
      busy,
      now,
    });

    res.json({
      date,
      time_zone: TIME_ZONE,
      service_id: service.id,
      duration_min: service.duration_min,
      slots,
    });
  } catch (err) {
    next(err);
  }
}
