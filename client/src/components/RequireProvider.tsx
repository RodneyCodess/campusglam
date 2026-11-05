import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "../hooks/useCurrentUser";
import LoadingScreen from "./LoadingScreen";

// Wraps provider-only pages (see App.tsx). Must sit inside RequireAuth.
export default function RequireProvider() {
  const { user, loading } = useCurrentUser();

  // Wait for our users row before deciding, or a real provider would be
  // bounced to /become-a-provider on every page refresh.
  if (loading) {
    return <LoadingScreen />;
  }

  // Sync failed. AppLayout already shows the error message.
  if (!user) {
    return null;
  }

  if (!user.is_provider) {
    return <Navigate to="/become-a-provider" replace />;
  }

  return <Outlet />;
}
