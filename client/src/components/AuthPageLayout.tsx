import { useAuth } from "@clerk/react-router";
import type { ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import LoadingScreen from "./LoadingScreen";
import Wordmark from "./Wordmark";

// Shared frame for /sign-in and /sign-up: wordmark, UB-only note, the Clerk
// form (children), and the terms line.
export default function AuthPageLayout({
  notice,
  children,
}: {
  notice?: ReactNode;
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [searchParams] = useSearchParams();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // Already signed in: go where RequireAuth was sending them, else /browse.
  // Only same-site paths ("/..." but not "//...") are allowed.
  if (isSignedIn) {
    const redirect = searchParams.get("redirect_url");
    const safe =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//");
    return <Navigate to={safe ? redirect : "/browse"} replace />;
  }

  return (
    <main className="auth-page">
      <Wordmark />
      <p className="auth-tagline">
        UB students only — use your @buffalo.edu email.
      </p>
      {notice}
      {children}
      <p className="auth-legal">
        By continuing you agree to the <Link to="/terms">Terms</Link> and{" "}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  );
}
