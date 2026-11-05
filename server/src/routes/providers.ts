import { Router } from "express";
import {
  createProvider,
  getMyProvider,
  getProvider,
  listProviders,
  updateMyProvider,
} from "../controllers/providers";
import { requireUser } from "../middleware/requireUser";

export const providersRouter = Router();

providersRouter.get("/api/providers", requireUser, listProviders);
providersRouter.post("/api/providers", requireUser, createProvider);
// /me must come before /:id, or Express would treat "me" as an id.
providersRouter.get("/api/providers/me", requireUser, getMyProvider);
providersRouter.patch("/api/providers/me", requireUser, updateMyProvider);
providersRouter.get("/api/providers/:id", requireUser, getProvider);
