import { useAuth } from "@clerk/react-router";
import { Link, Navigate } from "react-router";
import HealthStatus from "../components/HealthStatus";
import LoadingScreen from "../components/LoadingScreen";

// Placeholder. The real signed-out landing page comes in a later issue.
export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (isSignedIn) {
    return <Navigate to="/browse" replace />;
  }

  return (
    <main className="page">
      <h1>CampusGlam</h1>
      <p>A student beauty-services marketplace. Landing page coming soon.</p>
      <p>
        <Link to="/sign-in">Sign in</Link> · <Link to="/sign-up">Sign up</Link>
      </p>
      <HealthStatus />
    </main>
  );
}
