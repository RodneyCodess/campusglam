import { Router } from "express";
import {
  getMyAvailability,
  getProviderAvailability,
  getProviderSlots,
  replaceMyAvailability,
} from "../controllers/availability";
import { requireProvider } from "../middleware/requireProvider";
import { requireUser } from "../middleware/requireUser";

export const availabilityRouter = Router();

// Provider-only: the signed-in provider's own weekly schedule.
availabilityRouter.get(
  "/api/availability/mine",
  requireUser,
  requireProvider,
  getMyAvailability,
);
availabilityRouter.put(
  "/api/availability/mine",
  requireUser,
  requireProvider,
  replaceMyAvailability,
);

// Any signed-in user: look at a provider's hours and open slots.
availabilityRouter.get(
  "/api/providers/:id/availability",
  requireUser,
  getProviderAvailability,
);
availabilityRouter.get(
  "/api/providers/:id/slots",
  requireUser,
  getProviderSlots,
);
