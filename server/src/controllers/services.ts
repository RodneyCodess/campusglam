import type { NextFunction, Request, Response } from "express";
import {
  createService as insertService,
  listPublicServices,
  listServicesByProvider,
  updateOwnedService,
} from "../db/services";
import { sendValidationError } from "../validation/respond";
import {
  createServiceSchema,
  listServicesQuerySchema,
  serviceIdSchema,
  updateServiceSchema,
} from "../validation/services";

// Same message whether the service doesn't exist or belongs to someone else,
// so nobody can probe which service ids exist.
const SERVICE_NOT_FOUND = "Service not found.";

// POST /api/services
export async function createService(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    // The owner always comes from the loaded profile, never the body.
    const service = await insertService(req.provider!.id, parsed.data);
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
}

// GET /api/services/mine
export async function listMyServices(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.json(await listServicesByProvider(req.provider!.id));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/services/:id
export async function updateService(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsedId = serviceIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      sendValidationError(res, parsedId.error);
      return;
    }
    const parsed = updateServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const service = await updateOwnedService(
      parsedId.data,
      req.provider!.id,
      parsed.data,
    );
    if (!service) {
      res.status(404).json({ error: SERVICE_NOT_FOUND });
      return;
    }
    res.json(service);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/services/:id
// Soft delete: hides the service (is_active = false) instead of removing
// the row, so past appointments that point at it keep working.
export async function deleteService(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsedId = serviceIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      sendValidationError(res, parsedId.error);
      return;
    }

    const service = await updateOwnedService(parsedId.data, req.provider!.id, {
      is_active: false,
    });
    if (!service) {
      res.status(404).json({ error: SERVICE_NOT_FOUND });
      return;
    }
    res.json(service);
  } catch (err) {
    next(err);
  }
}

// GET /api/services?category=&max_price=&limit=&offset=
export async function listServices(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = listServicesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const services = await listPublicServices(parsed.data);
    res.json({
      services,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  } catch (err) {
    next(err);
  }
}
