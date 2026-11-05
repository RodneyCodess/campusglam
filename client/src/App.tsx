import { Route, Routes } from "react-router";
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import RequireProvider from "./components/RequireProvider";
import BecomeProviderPage from "./pages/BecomeProviderPage";
import BookingsPage from "./pages/BookingsPage";
import BrowsePage from "./pages/BrowsePage";
import DashboardPage from "./pages/DashboardPage";
import Home from "./pages/Home";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProviderPage from "./pages/ProviderPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import TermsPage from "./pages/TermsPage";

// Every page in the app is listed here. See "How to add a new page" in
// CONTRIBUTING.md.
function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      {/* The /* lets Clerk use sub-paths like /sign-in/factor-one */}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Signed-in pages: RequireAuth checks login, AppLayout adds the nav */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/providers/:id" element={<ProviderPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/become-a-provider" element={<BecomeProviderPage />} />

          {/* Providers only */}
          <Route element={<RequireProvider />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
