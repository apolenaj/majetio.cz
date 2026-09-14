/**
 * XSS-safe plain text for PropertyUserNote content.
 */

export const PROPERTY_NOTE_MAX_LENGTH = 8000;

export function sanitizePropertyNoteContent(
  raw: string | null | undefined,
): string {
  if (raw == null) return "";
  let text = String(raw);
  text = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<\/?[^>]+>/g, "");
  text = text.replace(/javascript:/gi, "");
  text = text.replace(/data:/gi, "");
  text = text.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return text.trim().slice(0, PROPERTY_NOTE_MAX_LENGTH);
}
