import type { CanonicalMortgageOffer } from "../schemas";
import type {
  ExistingStoredOffer,
  IngestionPipelineResult,
  NormalizedOfferDraft,
} from "./types";
import { validateExternalOffers } from "./validate";
import { normalizeExternalOffers } from "./normalize";
import { deduplicateOffers } from "./deduplicate";
import { compareWithStored } from "./compare";
import {
  applyAnomalyStatus,
  detectRateAnomalies,
} from "./anomaly";
import { dataTierForFetch } from "./freshness";
import type { HypotekaJasneClient } from "../client/interface";

export type MortgageOfferStore = {
  listOffers(): Promise<ExistingStoredOffer[]>;
  upsertOffers(
    offers: CanonicalMortgageOffer[],
    input: {
      runId: string;
      historyOnlyOnChange: boolean;
      comparisons: ReturnType<typeof compareWithStored>;
    },
  ): Promise<{ historyRowsCreated: number }>;
  markAllStale(exceptRunId?: string): Promise<void>;
};

function toCanonical(draft: NormalizedOfferDraft): CanonicalMortgageOffer {
  const { dedupeKey: _dk, anomalies: _a, ...canonical } = draft;
  return canonical;
}

export async function runRateIngestionPipeline(input: {
  client: HypotekaJasneClient;
  store: MortgageOfferStore;
  runId?: string;
  /** When false, all offers stay review_required (admin blocked auto-publish). */
  autoPublishEnabled?: boolean;
}): Promise<IngestionPipelineResult> {
  const runId = input.runId ?? `ingest-${Date.now()}`;
  const stages: IngestionPipelineResult["stages"] = [
    "source",
    "fetch",
    "validate",
    "normalize",
    "deduplicate",
    "compare",
    "anomaly",
    "store",
  ];

  const adapterInfo = input.client.getAdapterInfo();
  let fetchedAt = new Date();
  let sourceStatus: IngestionPipelineResult["sourceStatus"] = "ok";
  let offersRaw: unknown[] = [];
  let usedFallback = false;

  try {
    const fetched = await input.client.getMortgageOffers();
    fetchedAt = fetched.fetchedAt;
    sourceStatus = fetched.sourceStatus;
    offersRaw = fetched.offers;
  } catch {
    sourceStatus = "unavailable";
    usedFallback = true;
  }

  const stored = await input.store.listOffers();

  if (sourceStatus === "unavailable" && stored.length > 0) {
    const fallbackOffers = stored.map((s) => ({
      ...s,
      dataTier: "verified" as const,
      status: "stale" as const,
      retrievedAt: s.retrievedAt,
      verifiedAt: s.verifiedAt ?? s.retrievedAt,
    }));

    return {
      runId,
      stages,
      fetchedAt,
      sourceStatus,
      normalized: [],
      stored: fallbackOffers,
      historyRowsCreated: 0,
      anomalies: [],
      usedFallback: true,
    };
  }

  const validated = validateExternalOffers(offersRaw);
  const dataTier = dataTierForFetch({
    isLive: adapterInfo.isLive,
    sourceStatus,
  });

  const normalizedDrafts = normalizeExternalOffers(validated.valid, {
    fetchedAt,
    dataTier,
    verifiedAt: adapterInfo.isLive ? fetchedAt : null,
    anomalies: validated.anomalies,
  });

  const deduped = deduplicateOffers(normalizedDrafts);
  const comparisons = compareWithStored(deduped, stored);
  const anomalies = detectRateAnomalies({
    offers: deduped,
    comparisons,
  });
  let reviewed = applyAnomalyStatus(deduped, anomalies);
  if (input.autoPublishEnabled === false) {
    reviewed = reviewed.map((offer) => ({
      ...offer,
      status: "review_required" as const,
      anomalies: [
        ...offer.anomalies,
        {
          code: "auto_publish_blocked",
          severity: "critical" as const,
          message: "Auto-publish blocked by Mortgage Ops — awaiting admin review.",
          offerKey: offer.dedupeKey,
        },
      ],
    }));
  }
  const canonical = reviewed.map(toCanonical);

  const { historyRowsCreated } = await input.store.upsertOffers(canonical, {
    runId,
    historyOnlyOnChange: true,
    comparisons,
  });

  if (sourceStatus === "degraded") {
    await input.store.markAllStale(runId);
  }

  return {
    runId,
    stages,
    fetchedAt,
    sourceStatus,
    normalized: reviewed,
    stored: canonical,
    historyRowsCreated,
    anomalies: [...validated.anomalies, ...anomalies],
    usedFallback,
  };
}
