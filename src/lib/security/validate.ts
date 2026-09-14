/**
 * Shared Zod helpers — strict bodies, max payload / pagination / filter counts.
 */

import { z } from "zod";

/** Reject unknown keys (mass-assignment defense). */
export function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export const paginationSchema = strictObject({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const MAX_JSON_BODY_BYTES = 64 * 1024; // 64 KiB default for mutations
export const MAX_ADMIN_JSON_BODY_BYTES = 256 * 1024;
export const MAX_FILTER_KEYS = 24;

export const cuidSchema = z.string().cuid();
export const shortText = (max = 200) => z.string().trim().min(1).max(max);
export const optionalShortText = (max = 200) =>
  z.string().trim().max(max).optional();

/**
 * Parse JSON body with size cap + Zod. Throws on invalid JSON / oversize / schema fail.
 */
export async function parseLimitedJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new PayloadTooLargeError(maxBytes);
  }

  const rawText = await request.text();
  if (rawText.length > maxBytes) {
    throw new PayloadTooLargeError(maxBytes);
  }

  let raw: unknown;
  try {
    raw = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new InvalidJsonError();
  }

  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Object.keys(raw as object).length > MAX_FILTER_KEYS * 2
  ) {
    throw new TooManyFieldsError();
  }

  return schema.parse(raw);
}

export class PayloadTooLargeError extends Error {
  readonly status = 413;
  constructor(maxBytes: number) {
    super(`Payload exceeds ${maxBytes} bytes`);
    this.name = "PayloadTooLargeError";
  }
}

export class InvalidJsonError extends Error {
  readonly status = 400;
  constructor() {
    super("Body must be JSON");
    this.name = "InvalidJsonError";
  }
}

export class TooManyFieldsError extends Error {
  readonly status = 400;
  constructor() {
    super("Too many fields in request body");
    this.name = "TooManyFieldsError";
  }
}

export class OwnershipError extends Error {
  readonly status = 404;
  constructor(message = "Resource not found") {
    super(message);
    this.name = "OwnershipError";
  }
}

/**
 * IDOR helper — load by id+owner; never return row belonging to another user.
 * Uses 404 (not 403) to avoid existence leaks.
 */
export async function assertOwnedRecord<T>(input: {
  load: () => Promise<T | null>;
}): Promise<T> {
  const row = await input.load();
  if (!row) throw new OwnershipError();
  return row;
}

/** Strip Prisma / mass-assignment: pick only allowlisted keys for updates. */
export function pickDto<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key];
    }
  }
  return out;
}
