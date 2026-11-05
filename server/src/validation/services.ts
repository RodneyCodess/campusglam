import { z } from "zod";
import {
  hasAtLeastOneField,
  idParamSchema,
  optionalText,
  paginationFields,
} from "./common";

// Must match services_category_check in the create_services migration.
export const SERVICE_CATEGORIES = [
  "braids",
  "makeup",
  "nails",
  "lashes",
  "haircut",
  "skincare",
  "hair",
  "locs",
  "other",
] as const;

const MAX_PRICE = 1000;

const category = z.enum(SERVICE_CATEGORIES, {
  error: `Category must be one of: ${SERVICE_CATEGORIES.join(", ")}`,
});

const price = z
  .number("Price must be a number")
  .positive("Price must be more than 0")
  .max(MAX_PRICE, `Price must be $${MAX_PRICE} or less`)
  .refine(
    // Compare in cents, allowing for floating-point noise (19.99 * 100).
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
    "Price can have at most 2 decimal places",
  )
  // Saved as an exact string like "19.99" so no float rounding reaches the
  // database; this also matches how Postgres returns decimals.
  .transform((value) => value.toFixed(2));

// The fields a provider sets when creating a service. provider_id is NOT
// here: it always comes from req.provider. strictObject rejects anything
// else (id, provider_id, created_at, ...) with a 400.
const serviceFields = {
  category,
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Title is required" : "Title must be text",
    })
    .trim()
    .min(1, "Title is required")
    .max(80, "Title must be 80 characters or fewer"),
  description: optionalText(1000, "Description"),
  price,
  duration_min: z
    .number("Duration must be a number of minutes")
    .int("Duration must be a whole number of minutes")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration must be 480 minutes (8 hours) or less"),
};

// POST /api/services: everything required except description.
export const createServiceSchema = z.strictObject(serviceFields);

// PATCH /api/services/:id: any of the fields above, plus is_active
// (send true to bring back a deleted service). At least one field.
export const updateServiceSchema = z
  .strictObject({
    ...serviceFields,
    is_active: z.boolean("is_active must be true or false"),
  })
  .partial()
  .refine(hasAtLeastOneField, "Send at least one field");

// :id in /api/services/:id
export const serviceIdSchema = idParamSchema("Service");

// GET /api/services?category=&max_price=&limit=&offset=
export const listServicesQuerySchema = z.object({
  category: category.optional(),
  max_price: z.coerce
    .number("max_price must be a number")
    .positive("max_price must be more than 0")
    .optional(),
  ...paginationFields,
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
