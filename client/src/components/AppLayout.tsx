import { SignOutButton } from "@clerk/react-router";
import { NavLink, Outlet } from "react-router";
import { useCurrentUser } from "../hooks/useCurrentUser";

// The frame around every signed-in page: a top bar, plus a bottom tab bar on
// phones. The current page renders where <Outlet /> is.
export default function AppLayout() {
  const { user, error } = useCurrentUser();

  const links = [
    { to: "/browse", label: "Browse" },
    { to: "/bookings", label: "My bookings" },
    user?.is_provider
      ? { to: "/dashboard", label: "Dashboard" }
      : { to: "/become-a-provider", label: "Become a provider" },
  ];

  // NavLink adds the "active" class when its page is open (styled gold).
  const navLinks = links.map((link) => (
    <NavLink key={link.to} to={link.to} className="nav-link">
      {link.label}
    </NavLink>
  ));

  return (
    <div className="app-layout">
      <header className="top-bar">
        <NavLink to="/browse" className="logo">
          CampusGlam
        </NavLink>
        <nav className="top-links">{navLinks}</nav>
        <div className="user-menu">
          {user && <span>{user.full_name || user.email}</span>}
          <SignOutButton />
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <main className="page">
        <Outlet />
      </main>

      <nav className="bottom-tabs">{navLinks}</nav>
    </div>
  );
}
