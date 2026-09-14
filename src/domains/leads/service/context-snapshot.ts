/**
 * Immutable mortgage lead context snapshot (Prompt 13/10).
 * Captured once at lead creation — never mutated.
 */

export const MORTGAGE_LEAD_SNAPSHOT_SCHEMA_VERSION =
  "mortgage-lead-snapshot.v1" as const;

export type MortgageLeadFinancingSnapshot = {
  requestedLoanCzk: number | null;
  availableEquityCzk: number | null;
  ltvOnAskingPricePct: number | null;
  nominalInterestRatePp: number | null;
  aprPp: number | null;
  termYears: number | null;
  estimatedMonthlyPaymentCzk: number | null;
};

export type MortgageLeadPropertySnapshot = {
  propertyId: string | null;
  propertySlug: string | null;
  propertyUrl: string | null;
  propertyTitle: string | null;
  askingPriceCzk: number | null;
  valuationCzk: number | null;
};

export type MortgageLeadContextSnapshotData = {
  schemaVersion: typeof MORTGAGE_LEAD_SNAPSHOT_SCHEMA_VERSION;
  capturedAt: string;
  property: MortgageLeadPropertySnapshot;
  financing: MortgageLeadFinancingSnapshot;
  source: string | null;
  marketCountry: string;
};

export type BuildMortgageLeadSnapshotInput = {
  propertyId?: string | null;
  propertySlug?: string | null;
  propertyTitle?: string | null;
  askingPriceCzk?: number | null;
  valuationCzk?: number | null;
  requestedLoanCzk?: number | null;
  availableEquityCzk?: number | null;
  ltvOnAskingPricePct?: number | null;
  nominalInterestRatePp?: number | null;
  aprPp?: number | null;
  termYears?: number | null;
  estimatedMonthlyPaymentCzk?: number | null;
  source?: string | null;
  marketCountry?: string;
};

function buildPropertyUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "https://majetio.cz";
  return `${base.replace(/\/$/, "")}/nemovitosti/${slug}`;
}

export function buildMortgageLeadContextSnapshot(
  input: BuildMortgageLeadSnapshotInput,
): MortgageLeadContextSnapshotData {
  const propertySlug = input.propertySlug ?? null;

  return {
    schemaVersion: MORTGAGE_LEAD_SNAPSHOT_SCHEMA_VERSION,
    capturedAt: new Date().toISOString(),
    property: {
      propertyId: input.propertyId ?? null,
      propertySlug,
      propertyUrl: buildPropertyUrl(propertySlug),
      propertyTitle: input.propertyTitle ?? null,
      askingPriceCzk: input.askingPriceCzk ?? null,
      valuationCzk: input.valuationCzk ?? null,
    },
    financing: {
      requestedLoanCzk: input.requestedLoanCzk ?? null,
      availableEquityCzk: input.availableEquityCzk ?? null,
      ltvOnAskingPricePct: input.ltvOnAskingPricePct ?? null,
      nominalInterestRatePp: input.nominalInterestRatePp ?? null,
      aprPp: input.aprPp ?? null,
      termYears: input.termYears ?? null,
      estimatedMonthlyPaymentCzk: input.estimatedMonthlyPaymentCzk ?? null,
    },
    source: input.source ?? null,
    marketCountry: input.marketCountry ?? "CZ",
  };
}
