import AuthBar from "../components/AuthBar";
import HealthStatus from "../components/HealthStatus";

export default function Home() {
  return (
    <main>
      <AuthBar />
      <h1>Beauty Glam</h1>
      <p>A student beauty-services marketplace.</p>
      <HealthStatus />
    </main>
  );
}
