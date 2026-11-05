import { useAuth } from "@clerk/react-router";
import { Navigate, Outlet, useLocation } from "react-router";
import LoadingScreen from "./LoadingScreen";

// Wraps every signed-in page (see App.tsx). Signed-out visitors go to
// /sign-in, and Clerk sends them back here after they sign in.
export default function RequireAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  // Clerk takes a moment to check for a session on page load. Waiting avoids
  // flashing the sign-in page at users who are actually signed in.
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    // Clerk reads redirect_url and returns there after sign-in (or sign-up).
    const returnTo = location.pathname + location.search + location.hash;
    const params = new URLSearchParams({ redirect_url: returnTo });
    return <Navigate to={`/sign-in?${params}`} replace />;
  }

  return <Outlet />;
}
