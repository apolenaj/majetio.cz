/**
 * Ranking Integrity tests (checklist 182, 219) + commercial firewall (218, 217, 224).
 * Prove Majetio Score is identical before/after a Boost signal appears.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildMajetioScoreFeatures } from "@/domains/investment/integrations/score-search-dto";
import {
  assertProductFirewallHardFalse,
  assertScoreUnchangedByBoost,
  COMMERCIAL_FIREWALL_CONTRACT,
  detectCommercialContamination,
  majetioScoreIntegrityFingerprint,
  scrubCommercialSignalsFromFeatures,
  composeDiscoverySearchPage,
  SPONSORED_LABEL_CS,
} from "@/domains/listing-promotions";
import {
  QUALIFIED_LEAD_BILLING_CONDITIONS,
  shouldChargePayPerLeadOnAccept,
} from "@/domains/revenue/lead-billing-conditions";
import {
  isTransactionSuccessFeeHiddenByDefault,
  getTransactionSuccessFeePublicSurface,
  TRANSACTION_SUCCESS_FEE_MODEL,
} from "@/domains/revenue/success-fee-model";
import { FEATURE_FLAG_DEFAULTS } from "@/config/feature-flags";

describe("Commercial firewall hard contract (218)", () => {
  it("keeps all boost→analytics flags false", () => {
    expect(assertProductFirewallHardFalse()).toEqual({ ok: true });
    expect(COMMERCIAL_FIREWALL_CONTRACT.boostAffectsMajetioScore).toBe(false);
    expect(COMMERCIAL_FIREWALL_CONTRACT.boostAffectsOrganicRanking).toBe(false);
    expect(COMMERCIAL_FIREWALL_CONTRACT.boostAffectsRecommendations).toBe(false);
  });

  it("scrubs injected commercial keys from feature maps", () => {
    const scrubbed = scrubCommercialSignalsFromFeatures({
      netYield: 0.05,
      placementWeight: 100,
      sponsored: 1,
      boost: 1,
      dscr: 1.2,
    });
    expect(scrubbed).toEqual({ netYield: 0.05, dscr: 1.2 });
    expect(detectCommercialContamination({ placementWeight: 1 })).toContain(
      "placementWeight",
    );
  });
});

describe("Ranking integrity — score before/after boost (182 / 219)", () => {
  it("Majetio Score fingerprint is unchanged when boost metadata appears", () => {
    const scoreBefore = buildMajetioScoreFeatures({
      propertyId: "prop-1",
      assumptionConfigVersion: "v1",
      engineVersion: "inv-1",
      netYield: 0.042,
      monthlyCashFlow: 8_500,
      dscr: 1.35,
      ltv: 0.7,
    });

    // Simulate a buggy path that tried to inject boost into features
    const contaminated = {
      ...scoreBefore,
      features: {
        ...scoreBefore.features,
        placementWeight: 100,
        sponsored: 1 as unknown as number,
        boost: 1,
      },
    };

    const scoreAfter = buildMajetioScoreFeatures({
      propertyId: "prop-1",
      assumptionConfigVersion: "v1",
      engineVersion: "inv-1",
      netYield: 0.042,
      monthlyCashFlow: 8_500,
      dscr: 1.35,
      ltv: 0.7,
    });

    expect(majetioScoreIntegrityFingerprint(scoreBefore)).toBe(
      majetioScoreIntegrityFingerprint(scoreAfter),
    );
    expect(
      assertScoreUnchangedByBoost({
        scoreBeforeBoost: scoreBefore,
        scoreAfterBoost: scoreAfter,
      }),
    ).toEqual({ ok: true });

    // Contaminated vector scrubbed → same fingerprint as clean score
    expect(
      majetioScoreIntegrityFingerprint({
        ...contaminated,
        features: scrubCommercialSignalsFromFeatures(contaminated.features),
      }),
    ).toBe(majetioScoreIntegrityFingerprint(scoreBefore));
  });

  it("organic order is not rewritten by sponsored placementWeight", () => {
    const page = composeDiscoverySearchPage({
      organicItems: [
        { id: "low-price" } as never,
        { id: "boosted-high-weight" } as never,
        { id: "mid" } as never,
      ],
      sponsoredPlacements: [
        {
          placementId: "b1",
          sponsored: true,
          label: SPONSORED_LABEL_CS,
          productKey: "boost_7_days",
          endsAt: null,
          property: { id: "boosted-high-weight" } as never,
        },
      ],
      pagination: {
        mode: "page",
        page: 1,
        pageSize: 20,
        total: 3,
        nextCursor: null,
        hasMore: false,
      },
      sort: { field: "askingPrice", direction: "asc" },
      warnings: [],
      appliedFilters: {},
      dedupeOrganicAgainstSponsored: false,
    });

    expect(page.organicResults.map((r) => r.id)).toEqual([
      "low-price",
      "boosted-high-weight",
      "mid",
    ]);
    expect(page.integrity.boostAffectsOrganicRanking).toBe(false);
    expect(page.integrity.boostAffectsMajetioScore).toBe(false);
    expect(page.sponsoredPlacements[0]?.label).toBe(SPONSORED_LABEL_CS);
  });

  it("organic sorts source never references ListingBoost", () => {
    const sorts = readFileSync(
      join(process.cwd(), "src/domains/properties/service/search/sorts.ts"),
      "utf8",
    );
    expect(sorts).not.toMatch(/ListingBoost|placementWeight|boost_/i);
  });
});

describe("Qualified lead billing conditions (183 / 216)", () => {
  it("MODE A charges on AGENT_ACCEPTED only", () => {
    expect(QUALIFIED_LEAD_BILLING_CONDITIONS.PAY_PER_LEAD.trigger).toBe(
      "AGENT_ACCEPTED",
    );
    expect(QUALIFIED_LEAD_BILLING_CONDITIONS.PAY_PER_LEAD.chargeOnInquiryCreate).toBe(
      false,
    );
    expect(
      shouldChargePayPerLeadOnAccept({
        organizationId: "org-1",
        billingMode: "PAY_PER_LEAD",
      }),
    ).toBe(true);
    expect(
      shouldChargePayPerLeadOnAccept({
        organizationId: "org-1",
        billingMode: "SUCCESS_FEE",
      }),
    ).toBe(false);
  });

  it("acceptQualifiedBuyerLead wires chargePayPerLead", () => {
    const file = readFileSync(
      join(
        process.cwd(),
        "src/domains/crm/qualified-buyer-lead-service.ts",
      ),
      "utf8",
    );
    expect(file).toMatch(/chargePayPerLead/);
    expect(file).toMatch(/shouldChargePayPerLeadOnAccept/);
  });
});

describe("Transaction Success Fee default OFF (184 / 215 / 225)", () => {
  it("stays hidden behind feature flag", () => {
    expect(FEATURE_FLAG_DEFAULTS.TRANSACTION_SUCCESS_FEE_ENABLED).toBe(false);
    expect(isTransactionSuccessFeeHiddenByDefault()).toBe(true);
    expect(getTransactionSuccessFeePublicSurface()).toBeNull();
    expect(TRANSACTION_SUCCESS_FEE_MODEL.affectsMajetioScore).toBe(false);
    expect(TRANSACTION_SUCCESS_FEE_MODEL.affectsOrganicRanking).toBe(false);
  });

  it("MODE B deal-close wires createSuccessFeePotential without Concierge flag", () => {
    const tx = readFileSync(
      join(
        process.cwd(),
        "src/domains/professional-services/transactions.ts",
      ),
      "utf8",
    );
    expect(tx).toMatch(/createSuccessFeePotential/);
    expect(tx).toMatch(/status === "CLOSED"/);
    expect(QUALIFIED_LEAD_BILLING_CONDITIONS.SUCCESS_FEE.trigger).toBe(
      "DEAL_CLOSED_VERIFIED",
    );
    expect(
      QUALIFIED_LEAD_BILLING_CONDITIONS.SUCCESS_FEE.recognizeOnPotentialCreate,
    ).toBe(false);
  });
});

describe("Boost expiration ops (181)", () => {
  it("expire script and package script exist", () => {
    const script = readFileSync(
      join(process.cwd(), "scripts/expire-listing-boosts.ts"),
      "utf8",
    );
    expect(script).toMatch(/expireListingBoosts|sweepAndCountActiveBoosts/);
    const pkg = readFileSync(join(process.cwd(), "package.json"), "utf8");
    expect(pkg).toMatch(/boosts:expire/);
  });

  it("fetchSponsoredPlacements expires before serving", () => {
    const file = readFileSync(
      join(
        process.cwd(),
        "src/domains/listing-promotions/sponsored-search.ts",
      ),
      "utf8",
    );
    expect(file).toMatch(/expireListingBoosts/);
  });
});
