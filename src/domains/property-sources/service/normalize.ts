/**
 * Unit / currency normalization helpers (Prompt 7 Part 4).
 */

const SQFT_TO_M2 = 0.09290304;

const CURRENCY_ALIASES: Record<string, string> = {
  kc: "CZK",
  "kč": "CZK",
  czk: "CZK",
  "česká koruna": "CZK",
  eur: "EUR",
  euro: "EUR",
  "€": "EUR",
  usd: "USD",
  "$": "USD",
};

export function normalizeCurrency(raw: string | null | undefined): string {
  if (!raw?.trim()) return "CZK";
  const key = raw.trim().toLowerCase();
  return CURRENCY_ALIASES[key] ?? raw.trim().toUpperCase();
}

export function areaToSquareMeters(
  value: number,
  unit: "m2" | "sqm" | "sqft" | "ft2" | string | null | undefined,
): number {
  if (!Number.isFinite(value)) return value;
  const u = (unit ?? "m2").toLowerCase().replace("²", "2");
  if (u === "sqft" || u === "ft2" || u === "sq ft") {
    return Math.round(value * SQFT_TO_M2 * 100) / 100;
  }
  return value;
}

export function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function slugifyTitle(title: string, externalId: string): string {
  const base = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const suffix = externalId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase();
  return `${base || "nemovitost"}-${suffix || "x"}`;
}

export function buildCanonicalKey(provider: string, externalPropertyId: string): string {
  return `${provider.trim().toLowerCase()}:${externalPropertyId.trim()}`;
}
