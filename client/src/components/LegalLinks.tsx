import { Link } from "react-router";

export default function LegalLinks() {
  return (
    <>
      <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy Policy</Link>
    </>
  );
}
