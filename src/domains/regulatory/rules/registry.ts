/**
 * In-memory RegulatoryRule registry (Prompt 17.4).
 * Prisma RegulatoryRule mirrors these for admin override later.
 */

import {
  isRuleActiveOn,
  type RegulatoryRule,
  type RegulatoryRuleKind,
} from "@/domains/regulatory/rules/types";
import {
  AE_REGULATORY_RULES_V2026_07,
  CZ_REGULATORY_RULES_V2026_07,
  DEMO_HALLUCINATED_REGULATORY_RULES,
} from "@/domains/regulatory/rules/packs/seed-rules";
import { foreignOwnershipDisclaimer } from "@/domains/regulatory/disclaimer";

const ALL_SEED: readonly RegulatoryRule[] = [
  ...CZ_REGULATORY_RULES_V2026_07,
  ...AE_REGULATORY_RULES_V2026_07,
];

/** Demo-only pack — never merged into production listActive without allowDemo. */
export function listDemoRegulatoryRules(): RegulatoryRule[] {
  return [
    ...AE_REGULATORY_RULES_V2026_07.filter((r) => r.isDemo),
    ...DEMO_HALLUCINATED_REGULATORY_RULES,
  ];
}

export function listRegulatoryRules(
  marketCode?: string,
  options?: { includeDemo?: boolean },
): RegulatoryRule[] {
  const includeDemo = options?.includeDemo ?? false;
  const base = includeDemo
    ? [...ALL_SEED, ...DEMO_HALLUCINATED_REGULATORY_RULES]
    : ALL_SEED.filter((r) => !r.isDemo);
  if (!marketCode) return [...base];
  const code = marketCode.toUpperCase();
  return base.filter((r) => r.marketCode === code);
}

export function getRegulatoryRule(
  marketCode: string,
  code: string,
  options?: { includeDemo?: boolean },
): RegulatoryRule | null {
  return (
    listRegulatoryRules(marketCode, options).find((r) => r.code === code) ??
    null
  );
}

export function listActiveRegulatoryRules(input: {
  marketCode: string;
  asOfIsoDate?: string;
  kind?: RegulatoryRuleKind;
  allowDemo?: boolean;
}): RegulatoryRule[] {
  const asOf = input.asOfIsoDate ?? new Date().toISOString().slice(0, 10);
  return listRegulatoryRules(input.marketCode, {
    includeDemo: input.allowDemo,
  }).filter((r) => {
    if (input.kind && r.kind !== input.kind) return false;
    return isRuleActiveOn(r, asOf, { allowDemo: input.allowDemo });
  });
}

export type ForeignOwnershipOrientationalView = {
  rule: RegulatoryRule | null;
  foreignersMayOwn: string;
  disclaimer: string;
  /** Always false — product must not assert certainty. */
  certainPurchaseAllowed: false;
};

export function getForeignOwnershipOrientationalView(input: {
  marketCode: string;
  locale?: string;
  /** Research markets may pass true; production UIs should leave false. */
  allowDemo?: boolean;
}): ForeignOwnershipOrientationalView {
  const rules = listActiveRegulatoryRules({
    marketCode: input.marketCode,
    kind: "FOREIGN_OWNERSHIP",
    allowDemo: input.allowDemo,
  });
  const rule = rules[0] ?? null;
  const foreignersMayOwn =
    typeof rule?.payload.foreignersMayOwn === "string"
      ? rule.payload.foreignersMayOwn
      : "UNKNOWN";
  return {
    rule,
    foreignersMayOwn,
    disclaimer: foreignOwnershipDisclaimer({
      marketCode: input.marketCode,
      locale: input.locale,
    }),
    certainPurchaseAllowed: false,
  };
}
