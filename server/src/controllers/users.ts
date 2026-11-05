import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import {
  findUserByClerkId,
  insertUserIfMissing,
  isUniqueViolation,
} from "../db/users";

const ALLOWED_EMAIL_DOMAIN = "@buffalo.edu";

// POST /api/users/sync
// Makes sure the signed-in Clerk user has a row in our users table.
export async function syncUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "You must be signed in." });
      return;
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    const primaryEmail = clerkUser.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId,
    );
    if (primaryEmail?.verification?.status !== "verified") {
      res.status(403).json({ error: "Your email address is not verified." });
      return;
    }

    const email = primaryEmail.emailAddress.toLowerCase();
    if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
      res
        .status(403)
        .json({ error: "CampusGlam is only for @buffalo.edu emails." });
      return;
    }

    const existing = await findUserByClerkId(userId);
    if (existing) {
      res.json(existing);
      return;
    }

    const fullName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ");

    try {
      const user = await insertUserIfMissing({
        clerk_user_id: userId,
        full_name: fullName,
        email,
      });
      res.status(201).json(user);
    } catch (err) {
      // The clerk_user_id conflict is ignored by the insert, so a unique
      // violation here means another account already has this email.
      if (isUniqueViolation(err)) {
        res.status(409).json({
          error:
            "This email is already linked to a different CampusGlam account.",
        });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/users/me
// requireUser has already loaded the row into req.user.
export function getMe(req: Request, res: Response) {
  res.json(req.user);
}
