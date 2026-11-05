import { z } from "zod";
import {
  hasAtLeastOneField,
  idParamSchema,
  optionalText,
  paginationFields,
} from "./common";

// The only fields a provider can set. strictObject rejects anything else
// (id, user_id, verification_status, ...) with a 400.
const editableFields = {
  bio: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Bio is required" : "Bio must be text",
    })
    .trim()
    .min(1, "Bio is required")
    .max(500, "Bio must be 500 characters or fewer"),
  business_name: optionalText(80, "Business name"),
  instagram_handle: z
    .string("Instagram handle must be text")
    .trim()
    .transform((value) => value.replace(/^@/, ""))
    .refine(
      (value) => value === "" || /^[A-Za-z0-9._]{1,30}$/.test(value),
      "Instagram handle can only use letters, numbers, . and _ (max 30)",
    )
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  photo_url: z
    .url({ protocol: /^https$/, error: "Photo URL must be an https:// link" })
    .max(2048, "Photo URL is too long")
    .nullable()
    .optional(),
  is_accepting_bookings: z
    .boolean("is_accepting_bookings must be true or false")
    .optional(),
};

// POST /api/providers: bio required, everything else optional.
export const createProviderSchema = z.strictObject(editableFields);

// PATCH /api/providers/me: every field optional, but send at least one.
export const updateProviderSchema = z
  .strictObject(editableFields)
  .partial()
  .refine(hasAtLeastOneField, "Send at least one field");

// :id in /api/providers/:id
export const providerIdSchema = idParamSchema("Provider");

// ?limit=&offset= for GET /api/providers.
export const listProvidersQuerySchema = z.object(paginationFields);

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
