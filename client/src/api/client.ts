const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

// Thrown when the server answers with a non-2xx status.
// `status` is the HTTP status code (401, 403, 404, ...).
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  // Sent as JSON. Leave out for requests with no body.
  body?: unknown;
  // Clerk session token from `await getToken()` (useAuth). Leave out for
  // public routes.
  token?: string | null;
}

// The one helper for calling our server. Example:
//   const token = await getToken();
//   const me = await apiFetch<User>("/api/users/me", { token });
export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: ApiFetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Our server sends errors as { error: "..." }; fall back to null when the
  // body is empty or not JSON.
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const serverMessage =
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : null;
    throw new ApiError(
      response.status,
      serverMessage ??
        `${method} ${path} failed with status ${response.status}`,
    );
  }

  return data as T;
}
