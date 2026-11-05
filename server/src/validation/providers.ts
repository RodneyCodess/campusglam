import { z } from "zod";

// Optional text: trims spaces, and treats "" as "clear this field" (null).
function optionalText(max: number, label: string) {
  return z
    .string(`${label} must be text`)
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();
}

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
  .refine((body) => Object.keys(body).length > 0, "Send at least one field");

// :id in /api/providers/:id must be a whole number that fits a Postgres integer.
export const providerIdSchema = z
  .string()
  .regex(/^\d+$/, "Provider id must be a positive whole number")
  .transform(Number)
  .refine(
    (id) => id >= 1 && id <= 2147483647,
    "Provider id must be a positive whole number",
  );

// ?limit=&offset= for GET /api/providers.
export const listProvidersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
