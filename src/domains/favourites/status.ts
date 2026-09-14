/**
 * Favourite status — UI labels are Czech; never show raw enum to users.
 * BOD 83: Zvažuji · Prohlídka · Favorit · Vyřazeno
 */

export const FAVOURITE_STATUSES = [
  "CONSIDERING",
  "VIEWING",
  "FAVORITE",
  "REJECTED",
] as const;

export type FavouriteStatusValue = (typeof FAVOURITE_STATUSES)[number];

/** Czech labels for Decision Workspace UI. */
export const FAVOURITE_STATUS_LABELS_CS: Record<FavouriteStatusValue, string> = {
  CONSIDERING: "Zvažuji",
  VIEWING: "Prohlídka",
  FAVORITE: "Favorit",
  REJECTED: "Vyřazeno",
};

export const FAVOURITE_REJECTION_REASONS = [
  "TOO_EXPENSIVE",
  "LOCATION",
  "CONDITION",
  "FINANCING",
  "LAYOUT",
  "COMPETITION",
  "TIMING",
  "OTHER",
] as const;

export type FavouriteRejectionReasonValue =
  (typeof FAVOURITE_REJECTION_REASONS)[number];

/** Optional reject reasons (BOD 84, 87) — never force a modal. */
export const FAVOURITE_REJECTION_REASON_LABELS_CS: Record<
  FavouriteRejectionReasonValue,
  string
> = {
  TOO_EXPENSIVE: "Příliš drahé",
  LOCATION: "Lokalita",
  CONDITION: "Stav nemovitosti",
  FINANCING: "Finance / hypotéka",
  LAYOUT: "Dispozice / velikost",
  COMPETITION: "Konkurence / lepší tip",
  TIMING: "Špatné načasování",
  OTHER: "Jiný důvod",
};

/** Legacy enum values from guest storage / older rows. */
const LEGACY_STATUS_MAP: Record<string, FavouriteStatusValue> = {
  SAVED: "CONSIDERING",
  ANALYZING: "CONSIDERING",
  CONSIDERING: "CONSIDERING",
  VIEWING_PLANNED: "VIEWING",
  VIEWING: "VIEWING",
  SHORTLISTED: "FAVORITE",
  FAVORITE: "FAVORITE",
  REJECTED: "REJECTED",
};

export function normalizeFavouriteStatus(
  value: unknown,
): FavouriteStatusValue {
  if (typeof value !== "string") return "CONSIDERING";
  return LEGACY_STATUS_MAP[value] ?? "CONSIDERING";
}

export function favouriteStatusLabel(status: FavouriteStatusValue): string {
  return (
    FAVOURITE_STATUS_LABELS_CS[status] ?? FAVOURITE_STATUS_LABELS_CS.CONSIDERING
  );
}

export function isFavouriteStatus(
  value: unknown,
): value is FavouriteStatusValue {
  return (
    typeof value === "string" &&
    (FAVOURITE_STATUSES as readonly string[]).includes(value)
  );
}

export function isFavouriteRejectionReason(
  value: unknown,
): value is FavouriteRejectionReasonValue {
  return (
    typeof value === "string" &&
    (FAVOURITE_REJECTION_REASONS as readonly string[]).includes(value)
  );
}

export function rejectionReasonLabel(
  reason: FavouriteRejectionReasonValue | null | undefined,
): string | null {
  if (!reason) return null;
  return FAVOURITE_REJECTION_REASON_LABELS_CS[reason] ?? null;
}

/** Favorit = vážnější výběr (shortlist / BOD „Favorit“). */
export function isShortlisted(status: FavouriteStatusValue): boolean {
  return status === "FAVORITE";
}

/** Explicit negative signal — must not be re-recommended immediately (BOD 85–89). */
export function isRejectedFavourite(status: FavouriteStatusValue): boolean {
  return status === "REJECTED";
}

/** Default status when user taps „Uložit“. */
export const DEFAULT_SAVE_STATUS: FavouriteStatusValue = "CONSIDERING";

/** @deprecated Prefer FAVORITE_STATUS — alias for Favorit. */
export const SHORTLIST_STATUS: FavouriteStatusValue = "FAVORITE";

export const FAVORITE_STATUS: FavouriteStatusValue = "FAVORITE";
