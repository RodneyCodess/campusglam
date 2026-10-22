import { useEffect, useState } from "react";
import { getHealth } from "../api/health";
import type { HealthResponse } from "../types/health";

export default function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setError("Could not reach the server."));
  }, []);

  if (error) {
    return <p style={{ color: "crimson" }}>{error}</p>;
  }

  if (!health) {
    return <p>Checking server status...</p>;
  }

  return (
    <p>
      Server status: <strong>{health.status}</strong> (as of {health.timestamp})
    </p>
  );
}
