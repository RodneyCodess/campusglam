import { useContext } from "react";
import {
  CurrentUserContext,
  type CurrentUserValue,
} from "../contexts/currentUserContext";

// Gives any component the logged-in user: const { user, loading } = useCurrentUser();
export function useCurrentUser(): CurrentUserValue {
  const value = useContext(CurrentUserContext);
  if (!value) {
    throw new Error("useCurrentUser must be used inside <CurrentUserProvider>");
  }
  return value;
}
