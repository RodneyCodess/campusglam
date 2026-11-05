// Allowed values, matching the CHECK constraints in the appointments
// migration.
export const APPOINTMENT_STATUSES = [
  "requested",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
  "no_show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const LOCATION_TYPES = [
  "provider_place",
  "client_place",
  "campus_spot",
] as const;

// Statuses that hold a time slot. Must match the WHERE clause of the
// exclusion constraints (appointments_no_provider_overlap / _client_overlap).
export const SLOT_HOLDING_STATUSES: AppointmentStatus[] = [
  "requested",
  "confirmed",
];

// Every status change the API allows. Anything not listed here is rejected.
//
//   requested --accept--> confirmed --complete (after end)--> completed
//       |                     |
//       |--decline--> declined |
//       |                     |
//       +------cancel (before start)------> cancelled
export const TRANSITIONS = {
  accept: { from: ["requested"], to: "confirmed", time: "before_start" },
  decline: { from: ["requested"], to: "declined", time: null },
  cancel: {
    from: ["requested", "confirmed"],
    to: "cancelled",
    time: "before_start",
  },
  complete: { from: ["confirmed"], to: "completed", time: "after_end" },
} as const satisfies Record<
  string,
  {
    from: readonly AppointmentStatus[];
    to: AppointmentStatus;
    time: "before_start" | "after_end" | null;
  }
>;
export type TransitionAction = keyof typeof TRANSITIONS;

const VERBS: Record<TransitionAction, string> = {
  accept: "accepted",
  decline: "declined",
  cancel: "cancelled",
  complete: "completed",
};

// Why a status change was refused, for the 409 message. `appointment` is
// the current row (the change already failed; this only picks the words).
export function explainRefusedTransition(
  action: TransitionAction,
  appointment: { status: string; start_at: Date; end_at: Date },
  now: Date = new Date(),
): string {
  const rule = TRANSITIONS[action];
  const from = rule.from as readonly string[];
  if (!from.includes(appointment.status)) {
    return `Only ${from.join(" or ")} appointments can be ${VERBS[action]} (this one is ${appointment.status}).`;
  }
  if (rule.time === "before_start" && appointment.start_at <= now) {
    return `This appointment has already started, so it can't be ${VERBS[action]}.`;
  }
  if (rule.time === "after_end" && appointment.end_at > now) {
    return "This appointment can only be completed after it ends.";
  }
  return "That status change isn't allowed right now.";
}
