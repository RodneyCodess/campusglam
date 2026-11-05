import type {
  CreateProviderInput,
  UpdateProviderInput,
} from "../validation/providers";
import { db } from "./knex";
import { providerRatingsSubquery, toRatingAvg } from "./reviews";
import type { User } from "./users";

export interface ProviderProfile {
  id: number;
  user_id: number;
  business_name: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram_handle: string | null;
  verification_status: "pending" | "verified" | "rejected";
  is_accepting_bookings: boolean;
  created_at: Date;
}

// What anyone signed in may see about a provider: no email, no
// clerk_user_id, no internal user_id.
export interface PublicProvider extends ProviderRating {
  id: number;
  full_name: string;
  business_name: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram_handle: string | null;
  verification_status: "pending" | "verified";
  is_accepting_bookings: boolean;
  created_at: Date;
}

// Computed from reviews on every read, never stored.
export interface ProviderRating {
  rating_avg: number | null; // 1 decimal; null when there are no reviews
  review_count: number; // 0 when there are no reviews
}

export type ProviderProfileWithRating = ProviderProfile & ProviderRating;

export interface PublicService {
  id: number;
  category: string;
  title: string;
  description: string | null;
  // Postgres decimals arrive as strings (e.g. "40.00") to avoid rounding.
  price: string;
  duration_min: number;
}

const PUBLIC_PROVIDER_COLUMNS = [
  "provider_profiles.id",
  "users.full_name",
  "provider_profiles.business_name",
  "provider_profiles.bio",
  "provider_profiles.photo_url",
  "provider_profiles.instagram_handle",
  "provider_profiles.verification_status",
  "provider_profiles.is_accepting_bookings",
  "provider_profiles.created_at",
];

// LEFT JOIN keeps every provider, even ones with no row in the ratings
// subquery (no reviews). For those, ratings.* is NULL: rating_avg stays
// null and COALESCE turns review_count into 0. A plain JOIN would drop
// providers without reviews entirely.
const RATING_COLUMNS = [
  "ratings.rating_avg",
  db.raw("COALESCE(ratings.review_count, 0)::int AS review_count"),
];

function withRatings(query: ReturnType<typeof db>) {
  return query.leftJoin(
    providerRatingsSubquery(),
    "ratings.provider_id",
    "provider_profiles.id",
  );
}

// rating_avg comes back as text ("4.5"); turn it into a number.
function toPublicProvider<T extends { rating_avg: string | number | null }>(
  row: T,
): T & { rating_avg: number | null } {
  return { ...row, rating_avg: toRatingAvg(row.rating_avg) };
}

// Public endpoints show pending and verified providers, never rejected ones.
// Ratings for every row come from the same single query.
function publicProvidersQuery() {
  return withRatings(db("provider_profiles"))
    .join("users", "users.id", "provider_profiles.user_id")
    .whereNot("provider_profiles.verification_status", "rejected")
    .select([...PUBLIC_PROVIDER_COLUMNS, ...RATING_COLUMNS]);
}

export function findProviderByUserId(userId: number) {
  return db<ProviderProfile>("provider_profiles")
    .where({ user_id: userId })
    .first();
}

// Creates the profile AND marks the user as a provider. Both writes run in
// one transaction: if either fails, neither is saved, so users.is_provider
// can never disagree with whether a profile exists.
export function createProviderProfile(
  userId: number,
  fields: CreateProviderInput,
): Promise<ProviderProfile> {
  return db.transaction(async (trx) => {
    const [profile] = await trx<ProviderProfile>("provider_profiles")
      .insert({ ...fields, user_id: userId })
      .returning("*");

    await trx<User>("users")
      .where({ id: userId })
      .update({ is_provider: true });

    return profile;
  });
}

// The signed-in user's own profile plus ratings (GET /api/providers/me).
// Works even for rejected providers, unlike the public queries.
export async function findOwnProviderWithRatings(
  userId: number,
): Promise<ProviderProfileWithRating | undefined> {
  const row = await withRatings(db("provider_profiles"))
    .where("provider_profiles.user_id", userId)
    .first(["provider_profiles.*", ...RATING_COLUMNS]);
  return row ? toPublicProvider(row) : undefined;
}

export async function updateProviderByUserId(
  userId: number,
  fields: UpdateProviderInput,
): Promise<ProviderProfile | undefined> {
  const [profile] = await db<ProviderProfile>("provider_profiles")
    .where({ user_id: userId })
    .update(fields)
    .returning("*");
  return profile;
}

export async function findPublicProviderById(
  id: number,
): Promise<PublicProvider | undefined> {
  const row = await publicProvidersQuery()
    .where("provider_profiles.id", id)
    .first();
  return row ? toPublicProvider(row) : undefined;
}

// Active services only; hidden ones (is_active = false) stay private.
export function findActiveServicesByProviderId(
  providerId: number,
): Promise<PublicService[]> {
  return db("services")
    .where({ provider_id: providerId, is_active: true })
    .orderBy("created_at", "asc")
    .select("id", "category", "title", "description", "price", "duration_min");
}

export async function listPublicProviders(
  limit: number,
  offset: number,
): Promise<PublicProvider[]> {
  const rows = await publicProvidersQuery()
    .orderBy([
      { column: "provider_profiles.created_at", order: "desc" },
      { column: "provider_profiles.id", order: "desc" },
    ])
    .limit(limit)
    .offset(offset);
  return rows.map(toPublicProvider);
}
