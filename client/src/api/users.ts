import type { User } from "../types/user";
import { apiFetch } from "./client";

// Creates (or fetches) the users row for the signed-in Clerk user.
export function syncUser(token: string): Promise<User> {
  return apiFetch<User>("/api/users/sync", { method: "POST", token });
}

// Returns the signed-in user's row. Only works after syncUser has succeeded.
export function getMe(token: string): Promise<User> {
  return apiFetch<User>("/api/users/me", { token });
}
