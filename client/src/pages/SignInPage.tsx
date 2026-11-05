import { SignIn } from "@clerk/react-router";
import { useSearchParams } from "react-router";
import AuthPageLayout from "../components/AuthPageLayout";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  // Set by CurrentUserProvider when the server rejects a non-UB email.
  const notBuffalo = searchParams.get("reason") === "not-buffalo";

  return (
    <AuthPageLayout
      notice={
        notBuffalo && (
          <p className="notice" role="alert">
            CampusGlam is only for @buffalo.edu emails.
          </p>
        )
      }
    >
      <SignIn />
    </AuthPageLayout>
  );
}
