import { z } from "zod";

// Optional text: trims spaces, and treats "" as "clear this field" (null).
export function optionalText(max: number, label: string) {
  return z
    .string(`${label} must be text`)
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();
}

// A route param like :id: a whole number that fits a Postgres integer.
export function idParamSchema(label: string) {
  const message = `${label} id must be a positive whole number`;
  return z
    .string()
    .regex(/^\d+$/, message)
    .transform(Number)
    .refine((id) => id >= 1 && id <= 2147483647, message);
}

// ?limit=&offset= for list endpoints: up to 50 per page, 20 by default.
export const paginationFields = {
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
};

// For PATCH bodies: every field optional, but at least one must be sent.
export function hasAtLeastOneField(body: object) {
  return Object.keys(body).length > 0;
}
