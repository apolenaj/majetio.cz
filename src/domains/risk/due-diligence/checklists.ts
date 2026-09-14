/**
 * Market-specific Due Diligence checklists — versioned + reviewedAt (Rules 153–154).
 */

export const DD_CHECKLIST_ITEM_STATUSES = [
  "REQUIRED",
  "RECOMMENDED",
  "CONDITIONAL",
] as const;

export type DueDiligenceItemStatus =
  (typeof DD_CHECKLIST_ITEM_STATUSES)[number];

export type DueDiligenceChecklistItem = {
  code: string;
  titleEn: string;
  descriptionEn: string;
  status: DueDiligenceItemStatus;
  /** Dimension alignment with International Risk Model. */
  riskDimension?:
    | "LEGAL"
    | "FINANCING"
    | "TAX"
    | "OPERATIONAL"
    | "MARKET"
    | "CURRENCY"
    | "DATA_QUALITY"
    | "LIQUIDITY";
  relatedRegulatoryRuleCodes?: string[];
};

export type DueDiligenceChecklistPack = {
  marketCode: string;
  version: string;
  /** ISO UTC when legal/ops reviewed this pack. */
  reviewedAt: string | null;
  reviewedBy: string | null;
  titleEn: string;
  isDemo: boolean;
  items: readonly DueDiligenceChecklistItem[];
};

export const CZ_DD_CHECKLIST_V2026_07: DueDiligenceChecklistPack = {
  marketCode: "CZ",
  version: "cz-dd.v2026.07",
  reviewedAt: "2026-07-01T00:00:00.000Z",
  reviewedBy: "ops-seed",
  titleEn: "Czech residential purchase due diligence",
  isDemo: false,
  items: [
    {
      code: "cz.dd.title_extract",
      titleEn: "Obtain current title extract (list vlastnictví)",
      descriptionEn: "Verify ownership, liens, and easements in katastr.",
      status: "REQUIRED",
      riskDimension: "LEGAL",
    },
    {
      code: "cz.dd.svj_docs",
      titleEn: "Review SVJ / HOA documents and debt",
      descriptionEn: "Bylaws, minutes, building fund, pending repairs.",
      status: "REQUIRED",
      riskDimension: "OPERATIONAL",
    },
    {
      code: "cz.dd.penb",
      titleEn: "Energy performance certificate (PENB)",
      descriptionEn: "Confirm class and validity for the unit.",
      status: "REQUIRED",
      riskDimension: "OPERATIONAL",
    },
    {
      code: "cz.dd.financing_preapproval",
      titleEn: "Mortgage capacity check with named lender/partner",
      descriptionEn:
        "If financing via HypotekaJasne, grant explicit named consent before data transfer.",
      status: "RECOMMENDED",
      riskDimension: "FINANCING",
    },
    {
      code: "cz.dd.tax_counsel",
      titleEn: "Tax treatment with adviser",
      descriptionEn: "Acquisition VAT / income tax on rental — not Majetio advice.",
      status: "RECOMMENDED",
      riskDimension: "TAX",
    },
  ],
};

/** Demo-only AE checklist — not production legal. */
export const AE_DD_CHECKLIST_DEMO_V2026_07: DueDiligenceChecklistPack = {
  marketCode: "AE",
  version: "ae-dd.demo.v2026.07",
  reviewedAt: null,
  reviewedBy: null,
  titleEn: "UAE residential due diligence (DEMO)",
  isDemo: true,
  items: [
    {
      code: "ae.dd.freehold_eligibility",
      titleEn: "Confirm freehold / leasehold eligibility for buyer nationality",
      descriptionEn:
        "Verify designated freehold zone and buyer eligibility with UAE counsel — Majetio does not assert purchase rights.",
      status: "REQUIRED",
      riskDimension: "LEGAL",
      relatedRegulatoryRuleCodes: ["ae.foreign_ownership.freehold_zones"],
    },
    {
      code: "ae.dd.ojo_title",
      titleEn: "Title / Oqood / SPA review",
      descriptionEn: "Developer SPA, escrow, and registration status.",
      status: "REQUIRED",
      riskDimension: "LEGAL",
    },
    {
      code: "ae.dd.service_charge",
      titleEn: "Service charge history and budget",
      descriptionEn: "Community fees, sinking fund, outstanding arrears.",
      status: "REQUIRED",
      riskDimension: "OPERATIONAL",
    },
    {
      code: "ae.dd.payment_plan",
      titleEn: "Off-plan payment plan and completion risk",
      descriptionEn: "Schedule, escrow, and construction progress verification.",
      status: "CONDITIONAL",
      riskDimension: "MARKET",
    },
  ],
};

const PACKS: readonly DueDiligenceChecklistPack[] = [
  CZ_DD_CHECKLIST_V2026_07,
  AE_DD_CHECKLIST_DEMO_V2026_07,
];

export function listDueDiligenceChecklists(
  marketCode?: string,
): DueDiligenceChecklistPack[] {
  const code = marketCode?.toUpperCase();
  return PACKS.filter((p) => !code || p.marketCode === code);
}

export function resolveDueDiligenceChecklist(input: {
  marketCode: string;
  version?: string;
  allowDemo?: boolean;
}): DueDiligenceChecklistPack | null {
  const market = input.marketCode.toUpperCase();
  const allowDemo = input.allowDemo ?? false;
  const matches = PACKS.filter((p) => {
    if (p.marketCode !== market) return false;
    if (!allowDemo && p.isDemo) return false;
    if (input.version && p.version !== input.version) return false;
    return true;
  });
  return matches.find((p) => !p.isDemo) ?? matches[0] ?? null;
}

export function isChecklistCurrent(pack: DueDiligenceChecklistPack): boolean {
  return Boolean(pack.reviewedAt) && !pack.isDemo;
}
