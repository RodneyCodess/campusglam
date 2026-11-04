import type { User } from "../types/user";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Creates (or fetches) the users row for the signed-in Clerk user.
// `token` is the Clerk session token; the server checks it.
export async function syncUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(
      response.status,
      body?.error ?? `User sync failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<User>;
}
