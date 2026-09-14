/**
 * Comparison Decision Engine orchestrator (BOD 75–113, 144–146).
 * Parallel module load → public snapshot → personal overlays → stale diffs.
 */

import type { PassportState } from "@/lib/financial-passport/types";
import { comparisonConfig } from "@/config/comparison";
import { prisma } from "@/lib/db";
import { loadComparisonModuleBundle } from "./load-modules";
import { assembleAllPublicMetrics } from "./assemble-public-metrics";
import {
  computeFinancingOverlay,
  computeMatchScoreOverlay,
  passportToMatchProfile,
} from "./personal-overlays";
import {
  createComparisonSnapshot,
  getCurrentComparisonSnapshot,
  parseSnapshotFingerprints,
  parseSnapshotPublicMetrics,
} from "./snapshot-service";
import { detectStaleDiffs } from "./fingerprints";
import {
  completenessFromGaps,
  gapsForProperty,
  overallCompleteness,
} from "./completeness";
import {
  buildDecisionAdvice,
  buildOverallAdvice,
  buildPropertyNextAction,
} from "./advice";
import type {
  ComparisonDecisionPack,
  ComparisonPropertyDecision,
  ComparisonPublicPropertyMetrics,
} from "./types";

function attachPersonal(
  pub: ComparisonPublicPropertyMetrics,
  passport: PassportState | null,
  favouriteStatus: string | null,
): ComparisonPropertyDecision {
  const matchScore = computeMatchScoreOverlay(
    pub,
    passportToMatchProfile(passport),
  );
  const financing = computeFinancingOverlay({
    askingPriceCzk: pub.basics.askingPriceCzk,
    valuationMidCzk: pub.valuation.midCzk,
    passport,
  });

  const draft: ComparisonPropertyDecision = {
    ...pub,
    matchScore,
    financing,
    nextAction: {
      id: "pending",
      labelCs: "",
      href: null,
      reasonCs: "",
    },
    completeness: "low",
    advice: { headlineCs: "", missingCs: [], recommendedStepCs: null },
  };

  const gaps = gapsForProperty(draft);
  const nextAction = buildPropertyNextAction({
    propertyId: pub.propertyId,
    slug: pub.slug,
    risks: pub.risks,
    renovation: pub.renovation,
    financing,
    gaps,
    favouriteStatus,
  });
  const advice = buildDecisionAdvice({ gaps, nextAction });
  const completeness = completenessFromGaps(gaps);

  return {
    ...draft,
    nextAction,
    advice,
    completeness,
  };
}

/**
 * Build live decision pack (optionally compare against frozen snapshot).
 * Personal financing is always recomputed — never read from snapshot/cache.
 */
export async function buildComparisonDecisionPack(input: {
  comparisonId?: string | null;
  propertyIds: string[];
  userId?: string | null;
  passport?: PassportState | null;
  /**
   * When true and comparisonId set, persist a new current snapshot
   * (explicit „Aktualizovat porovnání“).
   */
  refreshSnapshot?: boolean;
  /**
   * When true (default for saved comparisons), serve public metrics from
   * snapshot when present — live is only used for stale detection.
   */
  preferSnapshot?: boolean;
}): Promise<ComparisonDecisionPack> {
  const ids = [...new Set(input.propertyIds)].slice(
    0,
    comparisonConfig.maxProperties,
  );

  const bundle = await loadComparisonModuleBundle({
    propertyIds: ids,
    userId: input.userId,
  });

  const livePublic = assembleAllPublicMetrics(bundle);
  const passport = input.passport ?? null;

  let snapshotMeta: ComparisonDecisionPack["snapshot"] = {
    id: null,
    createdAt: null,
    metricsAt: null,
  };
  let staleDiffs: ComparisonDecisionPack["staleDiffs"] = [];
  let publicForUi = livePublic;

  if (input.comparisonId) {
    const current = await getCurrentComparisonSnapshot(input.comparisonId);

    if (input.refreshSnapshot || !current) {
      const created = await createComparisonSnapshot({
        comparisonId: input.comparisonId,
        payload: {
          properties: livePublic,
          fingerprints: livePublic.map((p) => p.fingerprint),
        },
      });
      snapshotMeta = {
        id: created.id,
        createdAt: created.createdAt.toISOString(),
        metricsAt: created.createdAt.toISOString(),
      };
      publicForUi = livePublic;
      staleDiffs = [];
    } else {
      snapshotMeta = {
        id: current.id,
        createdAt: current.createdAt.toISOString(),
        metricsAt: current.createdAt.toISOString(),
      };
      const frozen = parseSnapshotPublicMetrics(current.publicMetrics);
      const fingerprints = parseSnapshotFingerprints(current.fingerprints);

      staleDiffs = detectStaleDiffs({
        snapshotFingerprints: fingerprints,
        live: livePublic.map((p) => ({
          fingerprint: p.fingerprint,
          title: p.title,
        })),
      });

      const preferSnapshot = input.preferSnapshot !== false;
      publicForUi =
        preferSnapshot && frozen.length > 0
          ? // Keep live order / membership; merge frozen metrics by id
            ids
              .map((id) => {
                const f = frozen.find((x) => x.propertyId === id);
                const live = livePublic.find((x) => x.propertyId === id);
                return f ?? live;
              })
              .filter((x): x is ComparisonPublicPropertyMetrics => x != null)
          : livePublic;
    }
  }

  const properties = publicForUi.map((pub) =>
    attachPersonal(
      pub,
      passport,
      bundle.favouritesByProperty.get(pub.propertyId) ?? null,
    ),
  );

  const completeness = overallCompleteness(properties);
  const advice = buildOverallAdvice({
    propertyAdvices: properties.map((p) => p.advice),
  });

  const isStale = staleDiffs.length > 0;
  const refreshHintCs = isStale
    ? "Některá data se od posledního porovnání změnila. Canonical snapshot nepřepisujeme — klikněte na „Aktualizovat porovnání“."
    : null;

  let name: string | null = null;
  if (input.comparisonId) {
    const row = await prisma.comparison.findUnique({
      where: { id: input.comparisonId },
      select: { name: true },
    });
    name = row?.name ?? null;
  }

  return {
    comparisonId: input.comparisonId ?? null,
    name,
    snapshot: snapshotMeta,
    properties,
    staleDiffs,
    isStale,
    completeness,
    advice,
    refreshHintCs,
  };
}

/** Explicit refresh — creates new snapshot at T_now. */
export async function refreshComparisonDecisionPack(input: {
  comparisonId: string;
  propertyIds: string[];
  userId?: string | null;
  passport?: PassportState | null;
}): Promise<ComparisonDecisionPack> {
  return buildComparisonDecisionPack({
    ...input,
    refreshSnapshot: true,
    preferSnapshot: false,
  });
}
