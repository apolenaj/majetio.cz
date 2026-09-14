/**
 * Share-safe comparison payload — never includes Financial Passport,
 * incomes, personal financing, or private notes (BOD 80, 81).
 */

export const SHARE_FORBIDDEN_KEYS = [
  "passport",
  "financialPassport",
  "income",
  "monthlyIncome",
  "householdIncome",
  "netSalary",
  "availableEquity",
  "equityCzk",
  "financing",
  "personalFinancing",
  "ltv",
  "dsti",
  "note",
  "notes",
  "privateNotes",
  "matchScore",
  /** Private decision workspace — never on share links. */
  "rejectionReason",
  "rejectedReason",
  "rejectReason",
  "decisionPriority",
  "personalNotes",
  "taskNotes",
  "checklistPrivate",
] as const;

export type ShareIncludeFlags = {
  /** Asking price, area, layout, location label */
  basics: boolean;
  /** Public valuation mid/range + confidence (no passport) */
  valuation: boolean;
  /** Gross/net yield, cash flow — public investment outputs only */
  investment: boolean;
  /** Renovation cost bands / ARV — no personal financing */
  renovation: boolean;
  /** Risk titles by severity — no private DD notes */
  risks: boolean;
  /** Majetio / location scores with breakdown */
  scores: boolean;
};

export const DEFAULT_SHARE_INCLUDE: ShareIncludeFlags = {
  basics: true,
  valuation: true,
  investment: true,
  renovation: true,
  risks: true,
  scores: true,
};

export type ShareSafePropertyView = {
  propertyId: string;
  slug: string;
  title: string;
  href: string;
  basics?: {
    askingPriceCzk: number | null;
    usableArea: number | null;
    layout: string | null;
    propertyType: string | null;
    city: string | null;
  };
  valuation?: {
    midCzk: number | null;
    confidence: string | null;
  };
  investment?: {
    grossYieldPct: number | null;
    netYieldPct: number | null;
    cashFlowMonthlyCzk: number | null;
  };
  renovation?: {
    costBaseCzk: number | null;
    arvCzk: number | null;
  };
  risks?: Array<{ title: string; severity: string }>;
  scores?: {
    majetioScore: number | null;
    locationLabel: string | null;
  };
};

export type ShareSafeComparisonView = {
  schemaVersion: "1.0.0";
  comparisonId: string;
  name: string | null;
  sharedAt: string;
  includeFlags: ShareIncludeFlags;
  properties: ShareSafePropertyView[];
  disclaimerCs: string;
};

export function assertShareSafePayload(payload: unknown): void {
  const json = JSON.stringify(payload);
  for (const key of SHARE_FORBIDDEN_KEYS) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`Share payload must not include forbidden key: ${key}`);
    }
  }
  // Soft PII patterns
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(json)) {
    throw new Error("Share payload must not include e-mail addresses.");
  }
}
