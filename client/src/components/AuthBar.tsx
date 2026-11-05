import { Show, SignInButton, SignOutButton, SignUpButton } from "@clerk/react";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function AuthBar() {
  const { user, error } = useCurrentUser();

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
