import { Router } from "express";
import {
  createService,
  deleteService,
  listMyServices,
  listServices,
  updateService,
} from "../controllers/services";
import { requireProvider } from "../middleware/requireProvider";
import { requireUser } from "../middleware/requireUser";

export const servicesRouter = Router();

// Browse: any signed-in user.
servicesRouter.get("/api/services", requireUser, listServices);

// Provider-only: requireUser loads req.user, then requireProvider loads
// req.provider (or answers 403).
servicesRouter.post(
  "/api/services",
  requireUser,
  requireProvider,
  createService,
);
// /mine must come before any /:id GET route added later.
servicesRouter.get(
  "/api/services/mine",
  requireUser,
  requireProvider,
  listMyServices,
);
servicesRouter.patch(
  "/api/services/:id",
  requireUser,
  requireProvider,
  updateService,
);
servicesRouter.delete(
  "/api/services/:id",
  requireUser,
  requireProvider,
  deleteService,
);
