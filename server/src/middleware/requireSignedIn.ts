import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

// clerkMiddleware() (set up in index.ts) reads the session token on every
// request. This checks the result and stops signed-out requests with a 401
// instead of redirecting like the deprecated requireAuth() did.
export function requireSignedIn(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { isAuthenticated } = getAuth(req);

  if (!isAuthenticated) {
    res.status(401).json({ error: "You must be signed in." });
    return;
  }

  next();
}
