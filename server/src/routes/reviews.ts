import { Router } from "express";
import {
  createReview,
  getMyReviews,
  getProviderReviews,
} from "../controllers/reviews";
import { requireUser } from "../middleware/requireUser";

export const reviewsRouter = Router();

reviewsRouter.post("/api/reviews", requireUser, createReview);
reviewsRouter.get("/api/reviews/mine", requireUser, getMyReviews);
reviewsRouter.get(
  "/api/providers/:id/reviews",
  requireUser,
  getProviderReviews,
);
