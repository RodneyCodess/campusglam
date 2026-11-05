import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from "../validation/services";
import { db } from "./knex";

export interface Service {
  id: number;
  provider_id: number;
  category: string;
  title: string;
  description: string | null;
  // Postgres decimals arrive as strings (e.g. "40.00") to avoid rounding.
  price: string;
  duration_min: number;
  is_active: boolean;
  created_at: Date;
}

// A service on the browse page, with just enough about who offers it.
export interface PublicServiceListing {
  id: number;
  category: string;
  title: string;
  description: string | null;
  price: string;
  duration_min: number;
  created_at: Date;
  provider: {
    id: number;
    full_name: string;
    business_name: string | null;
  };
}

export async function createService(
  providerId: number,
  fields: CreateServiceInput,
): Promise<Service> {
  const [service] = await db<Service>("services")
    .insert({ ...fields, provider_id: providerId })
    .returning("*");
  return service;
}

// All of a provider's services, including inactive (deleted) ones.
export function listServicesByProvider(providerId: number): Promise<Service[]> {
  return db<Service>("services")
    .where({ provider_id: providerId })
    .orderBy([
      { column: "created_at", order: "desc" },
      { column: "id", order: "desc" },
    ]);
}

// Updates a service only if it belongs to this provider. The ownership check
// is part of the same query (WHERE id = ? AND provider_id = ?), so there's no
// gap between checking and updating. Returns undefined if no row matched:
// either the service doesn't exist or someone else owns it.
export async function updateOwnedService(
  serviceId: number,
  providerId: number,
  fields: UpdateServiceInput,
): Promise<Service | undefined> {
  const [service] = await db<Service>("services")
    .where({ id: serviceId, provider_id: providerId })
    .update(fields)
    .returning("*");
  return service;
}

// Active services from providers who are bookable right now: not rejected
// and accepting bookings. Newest first.
export async function listPublicServices({
  category,
  max_price,
  limit,
  offset,
}: ListServicesQuery): Promise<PublicServiceListing[]> {
  const query = db("services")
    .join("provider_profiles", "provider_profiles.id", "services.provider_id")
    .join("users", "users.id", "provider_profiles.user_id")
    .where("services.is_active", true)
    .whereNot("provider_profiles.verification_status", "rejected")
    .where("provider_profiles.is_accepting_bookings", true)
    .select(
      "services.id",
      "services.category",
      "services.title",
      "services.description",
      "services.price",
      "services.duration_min",
      "services.created_at",
      "provider_profiles.id as provider_id",
      "users.full_name as provider_full_name",
      "provider_profiles.business_name as provider_business_name",
    )
    .orderBy([
      { column: "services.created_at", order: "desc" },
      { column: "services.id", order: "desc" },
    ])
    .limit(limit)
    .offset(offset);

  if (category) {
    query.where("services.category", category);
  }
  if (max_price !== undefined) {
    query.where("services.price", "<=", max_price);
  }

  const rows = await query;
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    price: row.price,
    duration_min: row.duration_min,
    created_at: row.created_at,
    provider: {
      id: row.provider_id,
      full_name: row.provider_full_name,
      business_name: row.provider_business_name,
    },
  }));
}
