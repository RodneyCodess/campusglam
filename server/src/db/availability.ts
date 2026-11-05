import type { AvailabilityBlockInput } from "../validation/availability";
import { db } from "./knex";

export interface AvailabilityBlock {
  id: number;
  day_of_week: number;
  start_time: string; // "10:00"
  end_time: string; // "14:00" ("24:00" = midnight)
}

// Postgres returns "10:00:00"; the API uses "10:00".
function toBlock(row: {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}): AvailabilityBlock {
  return {
    id: row.id,
    day_of_week: row.day_of_week,
    start_time: row.start_time.slice(0, 5),
    end_time: row.end_time.slice(0, 5),
  };
}

// The weekly schedule, sorted by day then start time. Pass dayOfWeek to get
// only one day.
export async function listAvailability(
  providerId: number,
  dayOfWeek?: number,
): Promise<AvailabilityBlock[]> {
  const query = db("availability")
    .where({ provider_id: providerId })
    .orderBy([
      { column: "day_of_week", order: "asc" },
      { column: "start_time", order: "asc" },
    ])
    .select("id", "day_of_week", "start_time", "end_time");
  if (dayOfWeek !== undefined) {
    query.where({ day_of_week: dayOfWeek });
  }
  return (await query).map(toBlock);
}

// Replaces the whole weekly schedule. Delete + insert run in one
// transaction: if the insert fails, the delete is undone too, so a
// provider never ends up with half a schedule (or none by accident).
export async function replaceAvailability(
  providerId: number,
  blocks: AvailabilityBlockInput[],
): Promise<AvailabilityBlock[]> {
  await db.transaction(async (trx) => {
    await trx("availability").where({ provider_id: providerId }).del();
    if (blocks.length > 0) {
      await trx("availability").insert(
        blocks.map((b) => ({ ...b, provider_id: providerId })),
      );
    }
  });
  return listAvailability(providerId);
}

// Requested or confirmed appointments for this provider that overlap
// [from, to). Declined/cancelled/completed/no_show don't block time.
export function findBusyIntervals(
  providerId: number,
  from: Date,
  to: Date,
): Promise<Array<{ start: Date; end: Date }>> {
  return db("appointments")
    .where({ provider_id: providerId })
    .whereIn("status", ["requested", "confirmed"])
    .where("start_at", "<", to)
    .where("end_at", ">", from)
    .select("start_at as start", "end_at as end");
}

// The service if it belongs to this provider and is active.
export function findActiveServiceForProvider(
  serviceId: number,
  providerId: number,
): Promise<{ id: number; duration_min: number } | undefined> {
  return db("services")
    .where({ id: serviceId, provider_id: providerId, is_active: true })
    .first("id", "duration_min");
}
