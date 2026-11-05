import type { NextFunction, Request, Response } from "express";
import {
  createProviderProfile,
  findActiveServicesByProviderId,
  findOwnProviderWithRatings,
  findProviderByUserId,
  findPublicProviderById,
  listPublicProviders,
  updateProviderByUserId,
} from "../db/providers";
import { isUniqueViolation } from "../db/users";
import {
  createProviderSchema,
  listProvidersQuerySchema,
  providerIdSchema,
  updateProviderSchema,
} from "../validation/providers";
import { sendValidationError } from "../validation/respond";

const ALREADY_PROVIDER = "You already have a provider profile.";
const NO_PROFILE = "You don't have a provider profile yet.";
const PROVIDER_NOT_FOUND = "Provider not found.";

// POST /api/providers
// Creates the signed-in user's provider profile.
export async function createProvider(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createProviderSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    // The owner always comes from the login, never from the request body.
    const userId = req.user!.id;

    if (await findProviderByUserId(userId)) {
      res.status(409).json({ error: ALREADY_PROVIDER });
      return;
    }

    try {
      const profile = await createProviderProfile(userId, parsed.data);
      res.status(201).json(profile);
    } catch (err) {
      // Two requests at once: provider_profiles.user_id is unique, so the
      // second insert fails and its transaction rolls back.
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: ALREADY_PROVIDER });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/providers/me
export async function getMyProvider(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const profile = await findOwnProviderWithRatings(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: NO_PROFILE });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/providers/me
export async function updateMyProvider(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = updateProviderSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const profile = await updateProviderByUserId(req.user!.id, parsed.data);
    if (!profile) {
      res.status(404).json({ error: NO_PROFILE });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

// GET /api/providers/:id
// One provider's public profile plus their active services.
export async function getProvider(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsedId = providerIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      sendValidationError(res, parsedId.error);
      return;
    }

    const provider = await findPublicProviderById(parsedId.data);
    if (!provider) {
      res.status(404).json({ error: PROVIDER_NOT_FOUND });
      return;
    }

    const services = await findActiveServicesByProviderId(provider.id);
    res.json({ ...provider, services });
  } catch (err) {
    next(err);
  }
}

// GET /api/providers?limit=20&offset=0
// Newest providers first, for the browse page.
export async function listProviders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = listProvidersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const { limit, offset } = parsed.data;
    const providers = await listPublicProviders(limit, offset);
    res.json({ providers, limit, offset });
  } catch (err) {
    next(err);
  }
}
