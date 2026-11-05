import type { Knex } from "knex";
import {
  TRANSITIONS,
  type AppointmentStatus,
  type TransitionAction,
} from "../lib/appointmentStatus";
import type { ListAppointmentsQuery } from "../validation/appointments";
import { db } from "./knex";

export interface Appointment {
  id: number;
  client_id: number;
  provider_id: number;
  service_id: number;
  start_at: Date;
  end_at: Date;
  status: AppointmentStatus;
  price: string;
  location_type: string;
  location_details: string | null;
  client_notes: string | null;
  is_paid: boolean;
  created_at: Date;
}

export type NewAppointment = Pick<
  Appointment,
  | "client_id"
  | "provider_id"
  | "service_id"
  | "start_at"
  | "end_at"
  | "price"
  | "location_type"
  | "location_details"
  | "client_notes"
>;

// What a booking list shows. `provider` appears in the client's list
// (/mine), `client` in the provider's list (/incoming). No emails.
export interface AppointmentListItem {
  id: number;
  status: AppointmentStatus;
  start_at: Date;
  end_at: Date;
  price: string;
  location_type: string;
  location_details: string | null;
  client_notes: string | null;
  created_at: Date;
  service: { id: number; title: string; category: string };
  provider?: { id: number; full_name: string; business_name: string | null };
  client?: { full_name: string };
}

// The service someone wants to book, with what we need to check it.
// Only active services from providers who aren't rejected.
export function findBookableService(serviceId: number): Promise<
  | {
      id: number;
      provider_id: number;
      duration_min: number;
      price: string;
      provider_user_id: number;
      is_accepting_bookings: boolean;
    }
  | undefined
> {
  return db("services")
    .join("provider_profiles", "provider_profiles.id", "services.provider_id")
    .where("services.id", serviceId)
    .where("services.is_active", true)
    .whereNot("provider_profiles.verification_status", "rejected")
    .first(
      "services.id",
      "services.provider_id",
      "services.duration_min",
      "services.price",
      "provider_profiles.user_id as provider_user_id",
      "provider_profiles.is_accepting_bookings",
    );
}

export async function insertAppointment(
  fields: NewAppointment,
): Promise<Appointment> {
  const [appointment] = await db<Appointment>("appointments")
    .insert(fields)
    .returning("*");
  return appointment;
}

function applyListFilters(
  query: Knex.QueryBuilder,
  { status, when, limit, offset }: ListAppointmentsQuery,
) {
  if (status) {
    query.where("appointments.status", status);
  }
  if (when === "upcoming") {
    query
      .where("appointments.start_at", ">=", db.fn.now())
      .orderBy("appointments.start_at", "asc");
  } else if (when === "past") {
    query
      .where("appointments.start_at", "<", db.fn.now())
      .orderBy("appointments.start_at", "desc");
  } else {
    query.orderBy("appointments.start_at", "desc");
  }
  query.orderBy("appointments.id", "desc").limit(limit).offset(offset);
}

const LIST_COLUMNS = [
  "appointments.id",
  "appointments.status",
  "appointments.start_at",
  "appointments.end_at",
  "appointments.price",
  "appointments.location_type",
  "appointments.location_details",
  "appointments.client_notes",
  "appointments.created_at",
  "services.id as service_id",
  "services.title as service_title",
  "services.category as service_category",
];

type ListRow = Record<string, unknown> & {
  id: number;
  status: AppointmentStatus;
  start_at: Date;
  end_at: Date;
  price: string;
  location_type: string;
  location_details: string | null;
  client_notes: string | null;
  created_at: Date;
  service_id: number;
  service_title: string;
  service_category: string;
};

function baseItem(row: ListRow): AppointmentListItem {
  return {
    id: row.id,
    status: row.status,
    start_at: row.start_at,
    end_at: row.end_at,
    price: row.price,
    location_type: row.location_type,
    location_details: row.location_details,
    client_notes: row.client_notes,
    created_at: row.created_at,
    service: {
      id: row.service_id,
      title: row.service_title,
      category: row.service_category,
    },
  };
}

// The user's bookings as a client.
export async function listClientAppointments(
  userId: number,
  filters: ListAppointmentsQuery,
): Promise<AppointmentListItem[]> {
  const query = db("appointments")
    .join("services", "services.id", "appointments.service_id")
    .join(
      "provider_profiles",
      "provider_profiles.id",
      "appointments.provider_id",
    )
    .join(
      "users as provider_users",
      "provider_users.id",
      "provider_profiles.user_id",
    )
    .where("appointments.client_id", userId)
    .select(
      ...LIST_COLUMNS,
      "provider_profiles.id as provider_id",
      "provider_users.full_name as provider_full_name",
      "provider_profiles.business_name as provider_business_name",
    );
  applyListFilters(query, filters);

  const rows: ListRow[] = await query;
  return rows.map((row) => ({
    ...baseItem(row),
    provider: {
      id: row.provider_id as number,
      full_name: row.provider_full_name as string,
      business_name: row.provider_business_name as string | null,
    },
  }));
}

// A provider's incoming appointments.
export async function listProviderAppointments(
  providerId: number,
  filters: ListAppointmentsQuery,
): Promise<AppointmentListItem[]> {
  const query = db("appointments")
    .join("services", "services.id", "appointments.service_id")
    .join("users as clients", "clients.id", "appointments.client_id")
    .where("appointments.provider_id", providerId)
    .select(...LIST_COLUMNS, "clients.full_name as client_full_name");
  applyListFilters(query, filters);

  const rows: ListRow[] = await query;
  return rows.map((row) => ({
    ...baseItem(row),
    client: { full_name: row.client_full_name as string },
  }));
}

// Who may act on an appointment: its client, its provider, or either one
// (cancel). Rows owned by anyone else never match.
export interface AppointmentOwner {
  clientId?: number;
  providerId?: number;
}

function whereOwnedBy(query: Knex.QueryBuilder, owner: AppointmentOwner) {
  query.where((q) => {
    if (owner.clientId !== undefined) {
      q.orWhere("client_id", owner.clientId);
    }
    if (owner.providerId !== undefined) {
      q.orWhere("provider_id", owner.providerId);
    }
  });
}

// One status change as ONE conditional UPDATE:
//   UPDATE appointments SET status = <to>
//   WHERE id = ? AND <owner> AND status IN (<from>) AND <time rule>
// Every rule is checked by Postgres in the same statement that changes the
// row, so nothing can change in between. Returns undefined if no row
// matched (not yours, wrong status, or wrong time).
export async function transitionAppointment(
  appointmentId: number,
  owner: AppointmentOwner,
  action: TransitionAction,
): Promise<Appointment | undefined> {
  const rule = TRANSITIONS[action];
  const query = db<Appointment>("appointments")
    .where("id", appointmentId)
    .whereIn("status", [...rule.from]);
  whereOwnedBy(query, owner);
  if (rule.time === "before_start") {
    query.where("start_at", ">", db.fn.now());
  } else if (rule.time === "after_end") {
    query.where("end_at", "<=", db.fn.now());
  }

  const [appointment] = await query.update({ status: rule.to }).returning("*");
  return appointment;
}

// The appointment if this owner may see it. Used after a refused status
// change to choose between 404 (not yours) and 409 (wrong status/time).
export function findOwnedAppointment(
  appointmentId: number,
  owner: AppointmentOwner,
): Promise<Appointment | undefined> {
  const query = db<Appointment>("appointments").where("id", appointmentId);
  whereOwnedBy(query, owner);
  return query.first();
}
