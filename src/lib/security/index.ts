/**
 * Security barrel — headers, SSRF, sanitize, logger, rate-limit, validate/IDOR,
 * privacy-by-default HTTP helpers, audit, soft erasure.
 */

export {
  applySecurityHeaders,
  buildContentSecurityPolicy,
  createRequestNonce,
} from "@/lib/security/headers";

export {
  assertSafeOutboundUrl,
  isPrivateOrLocalHostname,
  hostMatchesAllowlist,
} from "@/lib/security/ssrf";

export { safeFetch } from "@/lib/security/ssrf-fetch";

export {
  sanitizePlainText,
  sanitizeRichHtml,
  sanitizeCrmPlainText,
  escapeHtmlForDisplay,
} from "@/lib/security/sanitize";

export {
  logger,
  redactFields,
  redactErrorForClient,
} from "@/lib/security/logger";

export {
  assertSlidingRateLimit,
  assertLoginRateLimit,
  assertPublicSearchRateLimit,
  assertWebhookIpRateLimit,
  assertAuthRateLimit,
  recordAuthFailure,
  clearAuthFailures,
} from "@/lib/security/rate-limit";

export {
  strictObject,
  paginationSchema,
  parseLimitedJsonBody,
  assertOwnedRecord,
  pickDto,
  cuidSchema,
  shortText,
  optionalShortText,
  MAX_JSON_BODY_BYTES,
  MAX_FILTER_KEYS,
  OwnershipError,
  PayloadTooLargeError,
  InvalidJsonError,
  TooManyFieldsError,
} from "@/lib/security/validate";

export {
  applyPrivateCacheHeaders,
  isPrivateNoStorePath,
  rejectCorsPreflight,
  stripCorsHeaders,
  jsonNoStore,
  CACHE_CONTROL_PRIVATE_NO_STORE,
} from "@/lib/security/http-privacy";

export {
  auditWebhookForgery,
  auditAuthFailureBurst,
  auditAdminRightsChange,
} from "@/lib/security/security-audit";

export {
  softRequestAccountErasure,
  sanitizeUserContentField,
} from "@/lib/security/privacy-data";

export {
  assertAllowedUploadMime,
  isAllowedUploadMime,
  assertSafeUploadMeta,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/security/upload-mime";

export { enforcePublicSearchRateLimit } from "@/lib/security/public-search-guard";
