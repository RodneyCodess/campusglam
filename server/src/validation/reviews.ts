import { z } from "zod";
import { optionalText, paginationFields } from "./common";

// POST /api/reviews. Who wrote it and who it's about come from the
// appointment and req.user, so client_id / provider_id are a 400.
export const createReviewSchema = z.strictObject({
  appointment_id: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "appointment_id is required"
          : "appointment_id must be a number",
    })
    .int("appointment_id must be a whole number")
    .positive("appointment_id must be a whole number"),
  rating: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Rating is required"
          : "Rating must be a number",
    })
    .int("Rating must be a whole number from 1 to 5")
    .min(1, "Rating must be a whole number from 1 to 5")
    .max(5, "Rating must be a whole number from 1 to 5"),
  comment: optionalText(1000, "Comment"),
});

// ?limit=&offset= for review lists.
export const listReviewsQuerySchema = z.object(paginationFields);

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
