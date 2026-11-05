import { SignUp } from "@clerk/react-router";
import "../styles/auth.css";
import { clerkAppearance } from "../styles/clerkAppearance";

export default function SignUpPage() {
  return (
    <main className="auth-screen">
      <div className="auth-stack">
        <div className="auth-intro">
          <h1 className="auth-title">
            Welcome to <em>Campus Glam</em>
          </h1>
          <p className="auth-subtitle">Book local. Book UB.</p>
        </div>
        <div className="auth-form">
          <SignUp appearance={clerkAppearance} />
        </div>
      </div>
    </main>
  );
}
