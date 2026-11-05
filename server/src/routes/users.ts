import { Router } from "express";
import { getMe, syncUser } from "../controllers/users";
import { requireSignedIn } from "../middleware/requireSignedIn";
import { requireUser } from "../middleware/requireUser";

export const usersRouter = Router();

usersRouter.post("/api/users/sync", requireSignedIn, syncUser);
usersRouter.get("/api/users/me", requireUser, getMe);
