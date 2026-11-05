import { useAuth } from "@clerk/react-router";
import { Link, Navigate } from "react-router";
import LegalLinks from "../components/LegalLinks";
import LoadingScreen from "../components/LoadingScreen";
import Wordmark from "../components/Wordmark";

const STEPS = [
  {
    title: "Browse UB stylists",
    text: "See lashes, nails, hair and more offered by students on campus.",
  },
  {
    title: "Request a time",
    text: "Pick a service and send a request for a time that works for you.",
  },
  {
    title: "Get it done on campus",
    text: "Meet up and get your glam without leaving campus.",
  },
];

// The landing page for signed-out visitors. Signed-in users go to /browse.
export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (isSignedIn) {
    return <Navigate to="/browse" replace />;
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <Wordmark />
      </header>

      <main>
        <section className="hero">
          <h1 className="hero-title">Your campus. Your glam.</h1>
          <p className="hero-text">
            CampusGlam is where UB students book beauty services — lashes,
            nails, hair and more — from other UB students.
          </p>
          <div className="hero-actions">
            <Link to="/sign-up" className="button-primary">
              Get started
            </Link>
            <Link to="/sign-in">Sign in</Link>
          </div>
        </section>

        <section className="how-it-works" aria-labelledby="how-it-works">
          <h2 id="how-it-works">How it works</h2>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="providers-line">
          <p>
            Do lashes, nails or hair? Offer your services to other UB students.{" "}
            <Link to="/sign-up">Become a provider</Link>
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <LegalLinks />
      </footer>
    </div>
  );
}
