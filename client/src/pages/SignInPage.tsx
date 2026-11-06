import { SignIn } from "@clerk/react-router";
import { useSearchParams } from "react-router";
import "../styles/auth.css";
import { clerkAppearance } from "../styles/clerkAppearance";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  // Set by CurrentUserProvider when the server rejects a non-UB email.
  const notBuffalo = searchParams.get("reason") === "not-buffalo";

  return (
    <main className="auth-screen">
      <div className="auth-stack">
        <div className="auth-intro">
          <h1 className="auth-title">
            Welcome to <em>Campus Glam</em>
          </h1>
          <p className="auth-subtitle">Sign in with your @buffalo.edu email.</p>
        </div>
        <div className="auth-form">
          {notBuffalo && (
            <p className="auth-error" role="alert">
              <span className="auth-error-icon" aria-hidden="true">!</span>
              <span>
                Campus Glam is for UB students. Please use your @buffalo.edu
                email.
              </span>
            </p>
          )}
          <SignIn appearance={clerkAppearance} />
        </div>
      </div>
    </main>
  );
}
