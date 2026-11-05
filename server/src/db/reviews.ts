import { reviewerDisplayName } from "../lib/names";
import { db } from "./knex";

export interface Review {
  id: number;
  appointment_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
}

// A review as shown on a provider's page. No ids or emails.
export interface PublicReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
  reviewer_name: string;
}

// A review the signed-in user wrote, with what it was for.
export interface MyReview {
  id: number;
  appointment_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
  service: { id: number; title: string };
  provider: { id: number; full_name: string; business_name: string | null };
}

// One row per provider that has reviews:
//   provider_id | rating_avg | review_count
// A review has no provider_id of its own, so we reach the provider through
// the appointment. GROUP BY makes AVG and COUNT run once per provider.
// Providers with no reviews don't appear here at all; the LEFT JOIN in
// db/providers.ts turns that into rating_avg = null, review_count = 0.
export function providerRatingsSubquery() {
  return db("reviews")
    .join("appointments", "appointments.id", "reviews.appointment_id")
    .groupBy("appointments.provider_id")
    .select(
      "appointments.provider_id",
      db.raw("ROUND(AVG(reviews.rating), 1) AS rating_avg"),
      db.raw("COUNT(*)::int AS review_count"),
    )
    .as("ratings");
}

// Postgres returns ROUND(...) as text ("4.5") to keep it exact; the API
// sends a number. NULL (no reviews) stays null.
export function toRatingAvg(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

// The appointment if this user is its client.
export function findClientAppointment(
  appointmentId: number,
  clientId: number,
): Promise<{ id: number; status: string } | undefined> {
  return db("appointments")
    .where({ id: appointmentId, client_id: clientId })
    .first("id", "status");
}

// The `comments` column is exposed as `comment` in the API.
export async function insertReview(fields: {
  appointment_id: number;
  rating: number;
  comment: string | null;
}): Promise<Review> {
  const [row] = await db("reviews")
    .insert({
      appointment_id: fields.appointment_id,
      rating: fields.rating,
      comments: fields.comment,
    })
    .returning(["id", "appointment_id", "rating", "comments", "created_at"]);
  return {
    id: row.id,
    appointment_id: row.appointment_id,
    rating: row.rating,
    comment: row.comments,
    created_at: row.created_at,
  };
}

// Reviews of one provider, newest first.
export async function listProviderReviews(
  providerId: number,
  limit: number,
  offset: number,
): Promise<PublicReview[]> {
  const rows = await db("reviews")
    .join("appointments", "appointments.id", "reviews.appointment_id")
    .join("users as clients", "clients.id", "appointments.client_id")
    .where("appointments.provider_id", providerId)
    .orderBy([
      { column: "reviews.created_at", order: "desc" },
      { column: "reviews.id", order: "desc" },
    ])
    .limit(limit)
    .offset(offset)
    .select(
      "reviews.id",
      "reviews.rating",
      "reviews.comments",
      "reviews.created_at",
      "clients.full_name as client_full_name",
    );

  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comments,
    created_at: row.created_at,
    reviewer_name: reviewerDisplayName(row.client_full_name),
  }));
}

// Reviews the user wrote as a client, newest first.
export async function listClientReviews(
  clientId: number,
  limit: number,
  offset: number,
): Promise<MyReview[]> {
  const rows = await db("reviews")
    .join("appointments", "appointments.id", "reviews.appointment_id")
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
    .where("appointments.client_id", clientId)
    .orderBy([
      { column: "reviews.created_at", order: "desc" },
      { column: "reviews.id", order: "desc" },
    ])
    .limit(limit)
    .offset(offset)
    .select(
      "reviews.id",
      "reviews.appointment_id",
      "reviews.rating",
      "reviews.comments",
      "reviews.created_at",
      "services.id as service_id",
      "services.title as service_title",
      "provider_profiles.id as provider_id",
      "provider_users.full_name as provider_full_name",
      "provider_profiles.business_name as provider_business_name",
    );

  return rows.map((row) => ({
    id: row.id,
    appointment_id: row.appointment_id,
    rating: row.rating,
    comment: row.comments,
    created_at: row.created_at,
    service: { id: row.service_id, title: row.service_title },
    provider: {
      id: row.provider_id,
      full_name: row.provider_full_name,
      business_name: row.provider_business_name,
    },
  }));
}
