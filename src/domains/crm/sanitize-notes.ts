/**
 * XSS-safe plain text for CRM notes — delegates to central sanitizer.
 */

export {
  sanitizePlainText as sanitizeCrmPlainText,
  escapeHtmlForDisplay,
} from "@/lib/security/sanitize";
