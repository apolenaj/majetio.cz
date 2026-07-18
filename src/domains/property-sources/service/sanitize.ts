/**
 * Sanitize incoming listing text / numbers before normalize (Prompt 7 Part 4).
 */

import type { NormalizedListing } from "../schemas/normalized-listing";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

export function sanitizeText(value: string | null | undefined, maxLen = 10_000): string | undefined {
  if (value == null) return undefined;
  const cleaned = value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLen);
}

export function sanitizeListingDraft(
  draft: Partial<NormalizedListing>,
): Partial<NormalizedListing> {
  return {
    ...draft,
    title: sanitizeText(draft.title, 300) ?? draft.title,
    description: sanitizeText(draft.description, 20_000),
    publicCity: sanitizeText(draft.publicCity, 120),
    publicDistrict: sanitizeText(draft.publicDistrict, 120),
    publicRegion: sanitizeText(draft.publicRegion, 120),
    publicLabel: sanitizeText(draft.publicLabel, 200),
    street: sanitizeText(draft.street, 200),
    houseNumber: sanitizeText(draft.houseNumber, 40),
    zip: sanitizeText(draft.zip, 20),
    layout: sanitizeText(draft.layout, 40),
    sourceUrl: sanitizeText(draft.sourceUrl, 2_000),
    askingPrice:
      draft.askingPrice != null && Number.isFinite(draft.askingPrice)
        ? Math.round(draft.askingPrice)
        : draft.askingPrice,
    latitude: clampCoord(draft.latitude, -90, 90),
    longitude: clampCoord(draft.longitude, -180, 180),
  };
}

function clampCoord(
  value: number | null | undefined,
  min: number,
  max: number,
): number | null | undefined {
  if (value == null) return value;
  if (!Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}
