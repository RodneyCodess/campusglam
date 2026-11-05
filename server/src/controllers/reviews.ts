import type { NextFunction, Request, Response } from "express";
import { findPublicProviderById } from "../db/providers";
import {
  findClientAppointment,
  insertReview,
  listClientReviews,
  listProviderReviews,
} from "../db/reviews";
import { isUniqueViolation } from "../db/users";
import { providerIdSchema } from "../validation/providers";
import { sendValidationError } from "../validation/respond";
import {
  createReviewSchema,
  listReviewsQuerySchema,
} from "../validation/reviews";

const ALREADY_REVIEWED = "You already reviewed this appointment.";

// POST /api/reviews
// Only the appointment's client, only once it's completed, only once.
export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const { appointment_id: appointmentId, rating, comment } = parsed.data;

    // Looked up by id AND client_id = you: someone else's appointment
    // looks exactly like a missing one.
    const appointment = await findClientAppointment(
      appointmentId,
      req.user!.id,
    );
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found." });
      return;
    }
    if (appointment.status !== "completed") {
      res.status(409).json({
        error: `You can only review completed appointments (this one is ${appointment.status}).`,
      });
      return;
    }

    try {
      const review = await insertReview({
        appointment_id: appointment.id,
        rating,
        comment: comment ?? null,
      });
      res.status(201).json(review);
    } catch (err) {
      // reviews.appointment_id is UNIQUE, so a second review for the same
      // appointment (even two clicks at once) is refused by Postgres.
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: ALREADY_REVIEWED });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/providers/:id/reviews
// Same visibility as the provider profile: rejected providers are a 404.
export async function getProviderReviews(
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
    const parsedQuery = listReviewsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      sendValidationError(res, parsedQuery.error);
      return;
    }

    const provider = await findPublicProviderById(parsedId.data);
    if (!provider) {
      res.status(404).json({ error: "Provider not found." });
      return;
    }

    const { limit, offset } = parsedQuery.data;
    const reviews = await listProviderReviews(provider.id, limit, offset);
    res.json({
      rating_avg: provider.rating_avg,
      review_count: provider.review_count,
      reviews,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/mine
export async function getMyReviews(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = listReviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const { limit, offset } = parsed.data;
    const reviews = await listClientReviews(req.user!.id, limit, offset);
    res.json({ reviews, limit, offset });
  } catch (err) {
    next(err);
  }
}
