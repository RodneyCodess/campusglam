import { db } from "./knex";

export interface User {
  id: number;
  clerk_user_id: string;
  full_name: string;
  email: string;
  campus: string;
  is_provider: boolean;
  created_at: Date;
}

export interface NewUser {
  clerk_user_id: string;
  full_name: string;
  email: string;
}

export function findUserByClerkId(clerkUserId: string) {
  return db<User>("users").where({ clerk_user_id: clerkUserId }).first();
}

// Two sync requests can arrive at once (React StrictMode runs effects twice
// in dev). ON CONFLICT DO NOTHING lets the second insert quietly skip, and
// both requests then read back the same row.
export async function insertUserIfMissing(user: NewUser): Promise<User> {
  await db<User>("users").insert(user).onConflict("clerk_user_id").ignore();

  const saved = await findUserByClerkId(user.clerk_user_id);
  if (!saved) {
    throw new Error(`User ${user.clerk_user_id} missing right after insert`);
  }
  return saved;
}

// Postgres error code 23505 means a unique constraint was violated.
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "23505"
  );
}
