/**
 * Plain-text sanitization for private favourite notes (BOD 134, 135).
 * Delegates to central XSS sanitizer.
 */

import { sanitizePlainText } from "@/lib/security/sanitize";

export const FAVOURITE_NOTE_MAX_LENGTH = 2000;
export const FAVOURITE_FOLDER_MAX_LENGTH = 80;

export function sanitizeFavouriteNote(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const text = sanitizePlainText(String(raw), FAVOURITE_NOTE_MAX_LENGTH);
  return text || null;
}

export function sanitizeFavouriteFolder(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const text = sanitizePlainText(String(raw), FAVOURITE_FOLDER_MAX_LENGTH);
  return text || null;
}
