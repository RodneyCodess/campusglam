import { SignUp } from "@clerk/react-router";
import AuthPageLayout from "../components/AuthPageLayout";

export default function SignUpPage() {
  return (
    <AuthPageLayout>
      <SignUp />
    </AuthPageLayout>
  );
}
