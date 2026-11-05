import { useAuth, useClerk } from "@clerk/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ApiError } from "../api/client";
import { getMe, syncUser } from "../api/users";
import { CurrentUserContext } from "../contexts/currentUserContext";
import type { User } from "../types/user";

const NOT_BUFFALO_MESSAGE = "CampusGlam is only for @buffalo.edu emails.";

// Syncs the Clerk user to our users table once per sign-in and shares the
// resulting row with the whole app through useCurrentUser().
export default function CurrentUserProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn, sessionId, getToken } = useAuth();
  const { signOut } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Which sign-in we already synced, so re-renders (and StrictMode running
  // effects twice in dev) don't call the server again.
  const syncedSessionId = useRef<string | null>(null);
  // The running/finished sync for this sign-in. Resolves to true if the
  // users row exists. refresh() waits on it so /me is never called first.
  const syncDone = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    if (!isSignedIn || !sessionId) {
      syncedSessionId.current = null;
      syncDone.current = null;
      setUser(null);
      return;
    }
    if (syncedSessionId.current === sessionId) {
      return;
    }
    syncedSessionId.current = sessionId;

    async function sync(): Promise<boolean> {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No Clerk session token");
        }
        const synced = await syncUser(token);
        // Ignore the result if the user signed out while we waited.
        if (syncedSessionId.current !== sessionId) {
          return false;
        }
        setUser(synced);
        setError(null);
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          await signOut();
          setError(NOT_BUFFALO_MESSAGE);
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not finish signing you in. Please try again.");
        }
        return false;
      }
    }

    syncDone.current = sync();
  }, [isSignedIn, sessionId, getToken, signOut]);

  const refresh = useCallback(async () => {
    const synced = await syncDone.current;
    if (!synced) {
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      setUser(await getMe(token));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load your account. Please try again.",
      );
    }
  }, [getToken]);

  // Still loading until Clerk is ready and, if signed in, the first sync
  // has either produced a user or failed with an error.
  const loading = !isLoaded || (!!isSignedIn && user === null && !error);

  const value = useMemo(
    () => ({ user, loading, error, refresh }),
    [user, loading, error, refresh],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}
