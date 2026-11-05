import { z } from "zod";
import { APPOINTMENT_STATUSES, LOCATION_TYPES } from "../lib/appointmentStatus";
import { idParamSchema, optionalText, paginationFields } from "./common";

// POST /api/appointments. client_id, provider_id, end_at, price and status
// are set by the server, so sending them is a 400.
export const createAppointmentSchema = z.strictObject({
  service_id: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "service_id is required"
          : "service_id must be a number",
    })
    .int("service_id must be a whole number")
    .positive("service_id must be a whole number"),
  start_at: z.iso.datetime({
    offset: true,
    error: 'start_at must be a timestamp like "2026-11-16T10:30:00-05:00"',
  }),
  location_type: z.enum(LOCATION_TYPES, {
    error: `location_type must be one of: ${LOCATION_TYPES.join(", ")}`,
  }),
  location_details: optionalText(200, "Location details"),
  client_notes: optionalText(500, "Notes"),
});

// ?status=&when=upcoming|past&limit=&offset= for /mine and /incoming.
export const listAppointmentsQuerySchema = z.object({
  status: z
    .enum(APPOINTMENT_STATUSES, {
      error: `status must be one of: ${APPOINTMENT_STATUSES.join(", ")}`,
    })
    .optional(),
  when: z
    .enum(["upcoming", "past"], { error: "when must be upcoming or past" })
    .optional(),
  ...paginationFields,
});

export const appointmentIdSchema = idParamSchema("Appointment");

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
