import { z } from "zod";

/** PocketBase record IDs are exactly 15 alphanumeric characters. */
export const pbIdSchema = z.string().regex(/^[a-zA-Z0-9]{15}$/, "Invalid record ID");

/** Validate and return a PocketBase record ID. Throws on invalid format. */
export function validatePbId(value: string): string {
  return pbIdSchema.parse(value);
}

/** Encode a user-derived value for safe inclusion in a URL path segment. */
export function safePath(segment: string): string {
  return encodeURIComponent(segment);
}

/**
 * Build a safe PocketBase filter for a relation field lookup.
 * Validates the id before interpolation.
 */
export function safeRelationFilter(field: string, id: string): string {
  const validId = validatePbId(id);
  return `${field} = "${validId}"`;
}

/**
 * Return a generic user-facing error message.
 * Never exposes raw backend error details.
 */
export function safeErrorMessage(_e: unknown, fallback: string): string {
  return fallback;
}
