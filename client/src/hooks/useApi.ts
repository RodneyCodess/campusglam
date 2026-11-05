import { useAuth } from "@clerk/react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { apiFetch, type ApiFetchOptions } from "../api/client";

export type Api = <T>(
  path: string,
  options?: Omit<ApiFetchOptions, "token">,
) => Promise<T>;

// apiFetch with the Clerk session token filled in for you:
//   const api = useApi();
//   const service = await api<Service>("/api/services", { method: "POST", body });
// The returned function is the same on every render, so it's safe to list in
// useEffect dependencies without causing repeat requests.
export function useApi(): Api {
  const { getToken } = useAuth();

  // Keep the latest getToken in a ref so the callback below never has to
  // change, even if Clerk hands us a new getToken.
  const getTokenRef = useRef(getToken);
  useLayoutEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  return useCallback(async (path, options) => {
    const token = await getTokenRef.current();
    return apiFetch(path, { ...options, token });
  }, []);
}
