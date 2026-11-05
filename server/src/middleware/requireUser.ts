import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { findUserByClerkId } from "../db/users";

// Use on any route that needs the logged-in user's users row.
// After it runs, the row is available as req.user.
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "You must be signed in." });
      return;
    }

    // Signed in with Clerk but POST /api/users/sync never created a row.
    const user = await findUserByClerkId(userId);
    if (!user) {
      res.status(403).json({
        error:
          "Your CampusGlam account isn't set up yet. Sign out and sign in again to finish setup.",
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
