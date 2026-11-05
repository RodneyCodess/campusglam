import { Router } from "express";
import { syncUser } from "../controllers/users";
import { requireSignedIn } from "../middleware/requireSignedIn";

export const usersRouter = Router();

usersRouter.post("/api/users/sync", requireSignedIn, syncUser);
