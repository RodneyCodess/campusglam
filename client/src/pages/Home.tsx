import { useAuth } from "@clerk/react-router";
import { Link, Navigate } from "react-router";
import LoadingScreen from "../components/LoadingScreen";
import "../styles/landing.css";

const SERVICES = ["Cuts & Fades", "Braids & Locs", "Nails", "Lashes"];

const STEPS = [
  {
    number: "01",
    title: "Browse UB students",
    text: "See who on campus offers hair, nails, lashes and more.",
  },
  {
    number: "02",
    title: "Pick a service and time",
    text: "Choose what you need and a time that fits your day.",
  },
  {
    number: "03",
    title: "Pay and show up",
    text: "Book and pay in the app, then show up.",
  },
];

// Signed-out landing page. Signed-in users go straight to /browse.
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
      <header className="landing-topbar">
        <div className="landing-container">
          <Link to="/" className="landing-wordmark">
            Campus Glam
          </Link>
          <Link to="/sign-in" className="landing-toplink">
            Log in
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-section landing-hero">
          <div className="landing-container">
            <div>
              <h1 className="landing-heading landing-hero-title">
                <span>Welcome to</span>
                <em>Campus Glam</em>
              </h1>
              <p className="landing-tagline">Book local. Book UB.</p>
              <div className="landing-hero-actions">
                <Link to="/sign-up" className="landing-btn landing-btn--primary">
                  Sign up
                </Link>
                <Link to="/sign-in" className="landing-btn landing-btn--secondary">
                  Log in
                </Link>
              </div>
              <p className="landing-hero-note">
                For UB students only. Sign up with your @buffalo.edu email.
              </p>
            </div>

            <div className="landing-hero-photos" aria-hidden="true">
              <div className="landing-photo landing-photo--tall">
                <span className="landing-photo-label">Hair</span>
              </div>
              <div className="landing-hero-photos-side">
                <div className="landing-photo landing-photo--mid">
                  <span className="landing-photo-label">Lashes</span>
                </div>
                <div className="landing-photo landing-photo--short">
                  <span className="landing-photo-label">Nails</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-services">
          <div className="landing-container">
            <h2 className="landing-heading landing-section-title">
              For <em>everyone</em> on campus.
            </h2>
            <div className="landing-services-grid">
              {SERVICES.map((name) => (
                <div key={name} className="landing-service">
                  <div className="landing-photo" aria-hidden="true" />
                  <p className="landing-service-name">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-steps">
          <div className="landing-container">
            <h2 className="landing-heading landing-section-title">
              How it <em>works</em>
            </h2>
            <ol className="landing-steps-list">
              {STEPS.map((step) => (
                <li key={step.number} className="landing-step">
                  <span className="landing-step-number">{step.number}</span>
                  <h3 className="landing-step-title">{step.title}</h3>
                  <p className="landing-step-text">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-section landing-cta">
          <div className="landing-container">
            <h2 className="landing-heading landing-cta-title">
              Ready to <em>book?</em>
            </h2>
            <Link to="/sign-up" className="landing-btn landing-btn--primary">
              Sign up
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <Link to="/" className="landing-wordmark">
            Campus Glam
          </Link>
          <p className="landing-copyright">
            © {new Date().getFullYear()} Campus Glam. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
