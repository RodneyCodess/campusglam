import type { Response } from "express";
import { z } from "zod";

// Sends a 400 with Zod's messages grouped by field, e.g.
// { error: "Invalid request", fields: { bio: ["Bio is required"] }, other: [] }
// `other` holds problems not tied to one field, like unknown keys.
export function sendValidationError(res: Response, error: z.ZodError) {
  const { fieldErrors, formErrors } = z.flattenError(error);
  res.status(400).json({
    error: "Invalid request",
    fields: fieldErrors,
    other: formErrors,
  });
}
