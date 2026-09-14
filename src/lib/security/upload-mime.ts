/**
 * Upload MIME allowlist — Privacy / AppSec default for user & admin uploads.
 * Reject executable / HTML payloads even if extension is renamed.
 */

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/csv",
  "application/json",
] as const;

export type AllowedUploadMime = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

const BLOCKED_MIME_PREFIXES = [
  "text/html",
  "application/javascript",
  "text/javascript",
  "application/x-msdownload",
  "application/x-executable",
  "application/wasm",
] as const;

export type MimeCheckResult =
  | { ok: true; mime: AllowedUploadMime }
  | { ok: false; reason: "missing" | "blocked" | "unsupported" };

export function normalizeMimeType(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.split(";")[0]?.trim().toLowerCase() ?? "";
}

/**
 * Validate Content-Type / declared MIME before accepting an upload buffer.
 * Does not replace magic-byte sniffing for high-risk paths.
 */
export function assertAllowedUploadMime(
  contentType: string | null | undefined,
): MimeCheckResult {
  const mime = normalizeMimeType(contentType);
  if (!mime) return { ok: false, reason: "missing" };

  if (
    BLOCKED_MIME_PREFIXES.some(
      (blocked) => mime === blocked || mime.startsWith(`${blocked}+`),
    )
  ) {
    return { ok: false, reason: "blocked" };
  }

  if ((ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mime)) {
    return { ok: true, mime: mime as AllowedUploadMime };
  }

  return { ok: false, reason: "unsupported" };
}

export function isAllowedUploadMime(
  contentType: string | null | undefined,
): boolean {
  return assertAllowedUploadMime(contentType).ok;
}

/** Soft cap for KYC / admin document metadata registration (bytes). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const EXT_BY_MIME: Record<AllowedUploadMime, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "application/json": [".json"],
};

/**
 * MIME + optional size + extension consistency for upload registration paths.
 */
export function assertSafeUploadMeta(input: {
  contentType: string | null | undefined;
  fileName?: string | null;
  sizeBytes?: number | null;
}):
  | { ok: true; mime: AllowedUploadMime }
  | {
      ok: false;
      reason: "missing" | "blocked" | "unsupported" | "too_large" | "extension";
    } {
  const mimeResult = assertAllowedUploadMime(input.contentType);
  if (!mimeResult.ok) return mimeResult;

  if (
    input.sizeBytes != null &&
    (input.sizeBytes < 0 || input.sizeBytes > MAX_UPLOAD_BYTES)
  ) {
    return { ok: false, reason: "too_large" };
  }

  const name = (input.fileName ?? "").trim().toLowerCase();
  if (name) {
    const allowed = EXT_BY_MIME[mimeResult.mime];
    const hasExt = allowed.some((ext) => name.endsWith(ext));
    if (!hasExt) return { ok: false, reason: "extension" };
    if (name.includes("\0") || name.includes("..") || name.includes("/") || name.includes("\\")) {
      return { ok: false, reason: "extension" };
    }
  }

  return mimeResult;
}
