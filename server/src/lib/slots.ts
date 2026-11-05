import { DateTime } from "luxon";

// All CampusGlam dates and times are New York time. Never rely on the
// server's own time zone (UTC when deployed).
export const TIME_ZONE = "America/New_York";
// Slots start every 30 minutes from the beginning of a block.
export const SLOT_STEP_MINUTES = 30;
// How far ahead clients can look for slots (today + this many days).
export const BOOKING_WINDOW_DAYS = 60;
// Slots starting sooner than this from now are not offered.
export const MIN_NOTICE_MINUTES = 120;

export interface TimeBlock {
  start_time: string; // "HH:MM", wall-clock New York time
  end_time: string; // "HH:MM", may be "24:00" (midnight)
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface Slot {
  start_time: string; // "10:30" (24-hour, New York)
  label: string; // "10:30 AM"
  start_at: string; // "2026-11-12T10:30:00-05:00"
  end_at: string;
}

// An exact moment as an ISO string in New York time with its offset, e.g.
// "2026-11-16T10:00:00-05:00" (EST) or "2027-07-01T10:00:00-04:00" (EDT).
// Used for every start_at/end_at the API returns.
export function toNewYorkISO(moment: Date | DateTime): string {
  const dateTime =
    moment instanceof Date ? DateTime.fromJSDate(moment) : moment;
  return dateTime.setZone(TIME_ZONE).toISO({ suppressMilliseconds: true })!;
}

// "14:30" -> 870 (minutes after midnight). "24:00" -> 1440.
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Today's date in New York, e.g. at 11pm New York on Nov 5 it's already
// Nov 6 in UTC, but this still returns Nov 5.
export function todayInNewYork(now: DateTime = DateTime.now()): DateTime {
  return now.setZone(TIME_ZONE).startOf("day");
}

// Whether a New York date (midnight) is between today and today +
// BOOKING_WINDOW_DAYS. Shared by the slots endpoint and booking.
export function bookingWindow(now: DateTime = DateTime.now()) {
  const firstDay = todayInNewYork(now);
  const lastDay = firstDay.plus({ days: BOOKING_WINDOW_DAYS });
  return {
    firstDay,
    lastDay,
    contains: (day: DateTime) => day >= firstDay && day <= lastDay,
  };
}

// Luxon weekday is 1 = Monday ... 7 = Sunday; ours is 0 = Sunday ... 6.
export function dayOfWeek(day: DateTime): number {
  return day.weekday % 7;
}

// Turns "minutes after midnight on `day`" (New York wall clock) into an
// exact moment, handling daylight saving time:
// - Spring forward: 2:00-2:59 AM doesn't exist that day -> null.
// - Fall back: 1:00-1:59 AM happens twice -> use the first (EDT) one.
function wallClockToInstant(day: DateTime, minutes: number): DateTime | null {
  if (minutes === 24 * 60) {
    return day.plus({ days: 1 }).startOf("day");
  }
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const instant = day.set({ hour, minute, second: 0, millisecond: 0 });
  if (instant.hour !== hour || instant.minute !== minute) {
    return null;
  }
  const hourEarlier = instant.minus({ hours: 1 });
  if (hourEarlier.hour === hour && hourEarlier.minute === minute) {
    return hourEarlier;
  }
  return instant;
}

// Joins blocks that touch or overlap into one continuous range, so a
// 3-hour service fits across 10:00-12:00 + 12:00-14:00.
function mergeBlocks(blocks: TimeBlock[]): Array<[number, number]> {
  const ranges = blocks
    .map((b) => [toMinutes(b.start_time), toMinutes(b.end_time)])
    .sort((a, b) => a[0] - b[0]) as Array<[number, number]>;

  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

// Bookable start times on one date. Pure (no database, no clock) so it's
// easy to test: pass `now` in.
export function computeSlots({
  day,
  blocks,
  durationMin,
  busy,
  now,
}: {
  day: DateTime; // midnight of the date, in New York
  blocks: TimeBlock[]; // that weekday's schedule
  durationMin: number;
  busy: BusyInterval[]; // requested/confirmed appointments
  now: DateTime;
}): Slot[] {
  const earliestStart = now.plus({ minutes: MIN_NOTICE_MINUTES });
  const slots: Slot[] = [];

  for (const [rangeStart, rangeEnd] of mergeBlocks(blocks)) {
    const rangeEndAt =
      wallClockToInstant(day, rangeEnd) ??
      // An end time inside the spring-forward gap means the next real hour.
      day.set({ hour: Math.floor(rangeEnd / 60) + 1, minute: 0 });

    for (
      let minutes = rangeStart;
      minutes < rangeEnd;
      minutes += SLOT_STEP_MINUTES
    ) {
      const startAt = wallClockToInstant(day, minutes);
      if (!startAt) continue; // skipped by spring forward

      // Real elapsed minutes, so DST days are handled correctly.
      const endAt = startAt.plus({ minutes: durationMin });
      if (endAt > rangeEndAt) continue; // doesn't fit in the block
      if (startAt < earliestStart) continue; // past or too soon

      const overlapsBusy = busy.some(
        (b) =>
          b.start.getTime() < endAt.toMillis() &&
          b.end.getTime() > startAt.toMillis(),
      );
      if (overlapsBusy) continue;

      slots.push({
        start_time: startAt.toFormat("HH:mm"),
        label: startAt.toFormat("h:mm a"),
        start_at: toNewYorkISO(startAt),
        end_at: toNewYorkISO(endAt),
      });
    }
  }

  return slots;
}
