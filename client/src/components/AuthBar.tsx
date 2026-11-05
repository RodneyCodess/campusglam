import {
  Show,
  SignInButton,
  SignOutButton,
  SignUpButton,
  useAuth,
  useClerk,
} from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { ApiError, syncUser } from "../api/users";
import type { User } from "../types/user";

const NOT_BUFFALO_MESSAGE = "CampusGlam is only for @buffalo.edu emails.";

export default function AuthBar() {
  const { isSignedIn, sessionId, getToken } = useAuth();
  const { signOut } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Remembers which sign-in we already synced, so re-renders (and StrictMode
  // running effects twice in dev) don't call the server again.
  const syncedSessionId = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !sessionId) {
      syncedSessionId.current = null;
      setUser(null);
      return;
    }
    if (syncedSessionId.current === sessionId) {
      return;
    }
    syncedSessionId.current = sessionId;

    async function sync() {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No Clerk session token");
        }
        setUser(await syncUser(token));
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          await signOut();
          setError(NOT_BUFFALO_MESSAGE);
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not finish signing you in. Please try again.");
        }
      }
    }

    void sync();
  }, [isSignedIn, sessionId, getToken, signOut]);

  return (
    <div>
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton />
      </Show>
      <Show when="signed-in">
        {user ? (
          <p>
            Signed in as <strong>{user.full_name || user.email}</strong>
          </p>
        ) : (
          !error && <p>Signing you in...</p>
        )}
        <SignOutButton />
      </Show>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
