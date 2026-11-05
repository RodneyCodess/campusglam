import type { NextFunction, Request, Response } from "express";
import { findProviderByUserId } from "../db/providers";

// Use after requireUser on routes only providers may use. Loads the
// signed-in user's provider profile into req.provider.
export async function requireProvider(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const provider = await findProviderByUserId(req.user!.id);
    if (!provider) {
      res.status(403).json({
        error:
          "You need a provider profile to do this. Become a provider first.",
      });
      return;
    }

    req.provider = provider;
    next();
  } catch (err) {
    next(err);
  }
}
