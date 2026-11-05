import { SignIn } from "@clerk/react-router";
import { useSearchParams } from "react-router";

// Unstyled for now; styling comes in a later issue.
export default function SignInPage() {
  const [searchParams] = useSearchParams();
  // Set by CurrentUserProvider when the server rejects a non-UB email.
  const notBuffalo = searchParams.get("reason") === "not-buffalo";

  return (
    <main className="page">
      {notBuffalo && (
        <p className="error">CampusGlam is only for @buffalo.edu emails.</p>
      )}
      <SignIn />
    </main>
  );
}
