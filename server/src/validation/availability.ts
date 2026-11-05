import { DateTime } from "luxon";
import { z } from "zod";
import { TIME_ZONE, toMinutes } from "../lib/slots";
import { idParamSchema } from "./common";

const MAX_BLOCKS_PER_DAY = 10;
const MAX_BLOCKS = 70;

// Schedule times are on the hour or half hour, so 30-minute slots line up.
const startTime = z
  .string('Start time must be text like "10:00"')
  .regex(
    /^([01]\d|2[0-3]):(00|30)$/,
    'Start time must look like "10:00" or "10:30" (24-hour clock)',
  );
const endTime = z
  .string('End time must be text like "14:00"')
  .regex(
    /^(([01]\d|2[0-3]):(00|30)|24:00)$/,
    'End time must look like "14:00" or "14:30" (24-hour clock, "24:00" = midnight)',
  );

const block = z
  .strictObject({
    day_of_week: z
      .number("day_of_week must be a number")
      .int("day_of_week must be a whole number")
      .min(0, "day_of_week must be 0 (Sunday) to 6 (Saturday)")
      .max(6, "day_of_week must be 0 (Sunday) to 6 (Saturday)"),
    start_time: startTime,
    end_time: endTime,
  })
  .refine((b) => toMinutes(b.start_time) < toMinutes(b.end_time), {
    message: "Start time must be before end time",
    path: ["end_time"],
  });

// PUT /api/availability/mine: { blocks: [...] }. [] = no availability.
export const replaceAvailabilitySchema = z
  .strictObject({
    blocks: z
      .array(block, "blocks must be a list")
      .max(MAX_BLOCKS, `At most ${MAX_BLOCKS} blocks per week`),
  })
  .superRefine(({ blocks }, ctx) => {
    for (let day = 0; day <= 6; day++) {
      const sameDay = blocks
        .map((b, index) => ({ ...b, index }))
        .filter((b) => b.day_of_week === day)
        .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

      if (sameDay.length > MAX_BLOCKS_PER_DAY) {
        ctx.addIssue({
          code: "custom",
          message: `At most ${MAX_BLOCKS_PER_DAY} blocks per day`,
          path: ["blocks"],
        });
      }
      // Touching is fine (10:00-12:00 then 12:00-14:00); overlapping isn't.
      for (let i = 1; i < sameDay.length; i++) {
        const previous = sameDay[i - 1];
        const current = sameDay[i];
        if (toMinutes(current.start_time) < toMinutes(previous.end_time)) {
          ctx.addIssue({
            code: "custom",
            message: `Overlaps ${previous.start_time}-${previous.end_time} on the same day`,
            path: ["blocks", current.index],
          });
        }
      }
    }
  });

// GET /api/providers/:id/slots?service_id=&date=YYYY-MM-DD
export const slotsQuerySchema = z.object({
  service_id: idParamSchema("Service"),
  date: z
    .string("date is required (YYYY-MM-DD)")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must look like 2026-11-20")
    .refine(
      (value) => DateTime.fromISO(value, { zone: TIME_ZONE }).isValid,
      "date is not a real calendar date",
    ),
});

export type AvailabilityBlockInput = z.infer<typeof block>;
