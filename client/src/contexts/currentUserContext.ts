import { createContext } from "react";
import type { User } from "../types/user";

export interface CurrentUserValue {
  // Our users row, or null when signed out / not set up yet.
  user: User | null;
  // True while Clerk is loading or the first sync is still running.
  loading: boolean;
  // Message to show if signing in failed (e.g. not a @buffalo.edu email).
  error: string | null;
  // Re-fetches the row from GET /api/users/me (e.g. after editing a profile).
  refresh: () => Promise<void>;
}

export const CurrentUserContext = createContext<CurrentUserValue | null>(null);
