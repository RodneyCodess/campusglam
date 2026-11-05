import { Link } from "react-router";

// The "CampusGlam" logo text, linking home.
export default function Wordmark() {
  return (
    <Link to="/" className="wordmark">
      CampusGlam
    </Link>
  );
}
