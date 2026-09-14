/**
 * MarketLaunchReadiness — checklist from BLOCKED → READY_PUBLIC (Prompt 17.5).
 */

import { marketHasMinimumSeoDataCoverage } from "@/domains/markets/data-sources/registry";
import {
  marketRegistry,
  isMarketPubliclyActive,
} from "@/domains/markets/registry/market-registry";
import { getMarketPlugin } from "@/domains/markets/plugins";
import { getCurrentPrivacyPolicy } from "@/domains/privacy/policy-registry";
import { listActiveRegulatoryRules } from "@/domains/regulatory";
import { resolveValuationModelForMarket } from "@/domains/valuation/market/model-registry";
import { resolveFinancingProvider } from "@/domains/financing/providers/registry";
import { resolveRenovationCostCatalog } from "@/domains/renovation/costs/catalog/market-registry";
import type { LaunchStatus } from "@/domains/markets/types";

export const MARKET_LAUNCH_READINESS_STATUSES = [
  "BLOCKED",
  "IN_PROGRESS",
  "READY_INTERNAL",
  "READY_PUBLIC",
] as const;

export type MarketLaunchReadinessStatus =
  (typeof MARKET_LAUNCH_READINESS_STATUSES)[number];

export const MARKET_READINESS_CHECK_KEYS = [
  "property_data",
  "valuation_model",
  "regulatory_pack",
  "privacy_legal_docs",
  "terms_of_use",
  "transaction_costs",
  "financing_provider",
  "seo_data_coverage",
  "currency_configured",
  "launch_flags",
] as const;

export type MarketReadinessCheckKey =
  (typeof MARKET_READINESS_CHECK_KEYS)[number];

export type MarketReadinessCheck = {
  key: MarketReadinessCheckKey;
  labelEn: string;
  passed: boolean;
  requiredForPublic: boolean;
  detailEn: string;
};

export type MarketLaunchReadiness = {
  marketCode: string;
  status: MarketLaunchReadinessStatus;
  checks: MarketReadinessCheck[];
  passedCount: number;
  requiredPublicCount: number;
  requiredPublicPassed: number;
  blockingReasons: string[];
};

function scoreStatus(input: {
  requiredPublicPassed: number;
  requiredPublicCount: number;
  passedCount: number;
  total: number;
  publiclyActive: boolean;
}): MarketLaunchReadinessStatus {
  if (input.requiredPublicPassed === 0 && input.passedCount === 0) {
    return "BLOCKED";
  }
  if (input.requiredPublicPassed < input.requiredPublicCount) {
    return input.passedCount === 0 ? "BLOCKED" : "IN_PROGRESS";
  }
  // All required public checks green
  if (input.publiclyActive) return "READY_PUBLIC";
  return "READY_INTERNAL";
}

export function evaluateMarketLaunchReadiness(
  marketCode: string,
): MarketLaunchReadiness {
  const code = marketCode.toUpperCase();
  const plugin = getMarketPlugin(code);
  const market = marketRegistry.get(code);
  const checks: MarketReadinessCheck[] = [];

  const seoCoverage = marketHasMinimumSeoDataCoverage(code);
  checks.push({
    key: "seo_data_coverage",
    labelEn: "SEO / data source coverage",
    passed: seoCoverage,
    requiredForPublic: true,
    detailEn: seoCoverage
      ? "Minimum citable data sources present."
      : "Insufficient citable listing/demographic sources.",
  });

  const hasPropertyData = Boolean(market?.hasMinimumPublicData);
  checks.push({
    key: "property_data",
    labelEn: "Property / public inventory data",
    passed: hasPropertyData,
    requiredForPublic: true,
    detailEn: hasPropertyData
      ? "hasMinimumPublicData=true"
      : "Market lacks minimum public property data.",
  });

  const valuation = resolveValuationModelForMarket({
    marketCode: code,
    propertyType: "APARTMENT",
  });
  const valuationOk = valuation.status === "READY";
  checks.push({
    key: "valuation_model",
    labelEn: "Automated valuation model",
    passed: valuationOk,
    requiredForPublic: false,
    detailEn:
      valuation.status === "READY"
        ? `Model ${valuation.registryCode} ready`
        : valuation.reason,
  });

  const regs = listActiveRegulatoryRules({ marketCode: code });
  const hasRegs = regs.length > 0;
  checks.push({
    key: "regulatory_pack",
    labelEn: "Regulatory rules pack",
    passed: hasRegs,
    requiredForPublic: true,
    detailEn: hasRegs
      ? `${regs.length} active rule(s)`
      : "No active RegulatoryRule seed for market.",
  });

  const privacy = getCurrentPrivacyPolicy({
    marketCode: code,
    kind: "PRIVACY_POLICY",
  });
  const privacyOk = privacy?.isCurrent === true;
  checks.push({
    key: "privacy_legal_docs",
    labelEn: "Current privacy policy",
    passed: privacyOk,
    requiredForPublic: true,
    detailEn: privacyOk
      ? `${privacy!.version} (${privacy!.jurisdictionEn})`
      : "No current privacy policy for market.",
  });

  const terms = getCurrentPrivacyPolicy({
    marketCode: code,
    kind: "TERMS_OF_USE",
  });
  const termsOk = terms?.isCurrent === true;
  checks.push({
    key: "terms_of_use",
    labelEn: "Current terms of use",
    passed: termsOk,
    /** Required for LIVE; BETA may proceed with privacy only. */
    requiredForPublic: true,
    detailEn: termsOk
      ? `${terms!.version}`
      : "No current terms of use for market.",
  });

  const currencyOk = Boolean(
    market?.defaultCurrency && market.defaultCurrency.length === 3,
  );
  checks.push({
    key: "currency_configured",
    labelEn: "Default local currency configured",
    passed: currencyOk,
    requiredForPublic: true,
    detailEn: currencyOk
      ? market!.defaultCurrency
      : "Market missing ISO 4217 defaultCurrency.",
  });

  const txPackId = plugin?.transactionCosts.packId;
  const hasTx = Boolean(txPackId && !txPackId.includes("planned") && !txPackId.includes("draft") && !txPackId.includes("research"));
  // CZ/AE real packs count; planned/draft/research do not
  const txPassed =
    code === "CZ" || code === "AE"
      ? Boolean(txPackId?.includes("v2026"))
      : hasTx;
  checks.push({
    key: "transaction_costs",
    labelEn: "Transaction cost pack",
    passed: txPassed,
    requiredForPublic: true,
    detailEn: txPackId ?? "missing packId",
  });

  const financing = resolveFinancingProvider(code);
  const financingOk =
    financing.status === "READY" || financing.status === "PARTNER_PENDING";
  checks.push({
    key: "financing_provider",
    labelEn: "Financing provider registry",
    passed: financingOk,
    requiredForPublic: false,
    detailEn: financing.reason,
  });

  const launchOk = Boolean(
    market &&
      market.enabled &&
      (market.launchStatus === "BETA" || market.launchStatus === "LIVE"),
  );
  checks.push({
    key: "launch_flags",
    labelEn: "Launch flags (enabled + BETA/LIVE)",
    passed: launchOk,
    requiredForPublic: true,
    detailEn: market
      ? `enabled=${market.enabled} status=${market.launchStatus}`
      : "Market missing from registry",
  });

  // Renovation catalog is informational only (not a public gate)
  void resolveRenovationCostCatalog(code);

  const requiredPublic = checks.filter((c) => c.requiredForPublic);
  const requiredPublicPassed = requiredPublic.filter((c) => c.passed).length;
  const passedCount = checks.filter((c) => c.passed).length;
  const publiclyActive = market ? isMarketPubliclyActive(market) : false;

  const status = scoreStatus({
    requiredPublicPassed,
    requiredPublicCount: requiredPublic.length,
    passedCount,
    total: checks.length,
    publiclyActive,
  });

  const blockingReasons = requiredPublic
    .filter((c) => !c.passed)
    .map((c) => `${c.key}: ${c.detailEn}`);

  return {
    marketCode: code,
    status,
    checks,
    passedCount,
    requiredPublicCount: requiredPublic.length,
    requiredPublicPassed,
    blockingReasons,
  };
}

export function evaluateAllMarketLaunchReadiness(): MarketLaunchReadiness[] {
  return marketRegistry.listAll().map((m) => evaluateMarketLaunchReadiness(m.marketCode));
}

export class MarketLaunchBlockedError extends Error {
  readonly marketCode: string;
  readonly blockingReasons: string[];

  constructor(marketCode: string, blockingReasons: string[]) {
    super(
      `Market ${marketCode} cannot go LIVE: ${blockingReasons.join("; ") || "readiness failed"}`,
    );
    this.name = "MarketLaunchBlockedError";
    this.marketCode = marketCode;
    this.blockingReasons = blockingReasons;
  }
}

/**
 * QA barrier (Rules 233+): refuse LIVE unless all required public checks pass.
 * Currencies, privacy, terms, regulatory, SEO, inventory must be green.
 */
export function assertMarketCanGoLive(marketCode: string): void {
  const readiness = evaluateMarketLaunchReadiness(marketCode);
  const requiredFailed = readiness.checks.filter(
    (c) => c.requiredForPublic && !c.passed,
  );
  if (requiredFailed.length > 0) {
    throw new MarketLaunchBlockedError(
      marketCode.toUpperCase(),
      requiredFailed.map((c) => `${c.key}: ${c.detailEn}`),
    );
  }
}

/**
 * Transition guard for launchStatus. LIVE always requires full readiness.
 * BETA requires the same required public checks (no soft LIVE bypass).
 */
export function assertCanSetLaunchStatus(input: {
  marketCode: string;
  nextStatus: LaunchStatus;
}): void {
  if (input.nextStatus === "LIVE" || input.nextStatus === "BETA") {
    assertMarketCanGoLive(input.marketCode);
  }
}

export function canMarketGoLive(marketCode: string): boolean {
  try {
    assertMarketCanGoLive(marketCode);
    return true;
  } catch {
    return false;
  }
}
