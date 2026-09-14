/**
 * Pure MAE / MAPE + model lifecycle governance (172–177, 233–239).
 */

export type AccuracyObservation = {
  predicted: number;
  actual: number;
  marketCode?: string;
  segmentKey?: string;
};

export type AccuracyMetrics = {
  sampleSize: number;
  mae: number;
  mape: number;
};

export function computeMaeMape(
  observations: AccuracyObservation[],
): AccuracyMetrics | null {
  const usable = observations.filter(
    (o) =>
      Number.isFinite(o.predicted) &&
      Number.isFinite(o.actual) &&
      o.actual !== 0,
  );
  if (usable.length === 0) return null;

  let absErr = 0;
  let absPct = 0;
  for (const o of usable) {
    absErr += Math.abs(o.predicted - o.actual);
    absPct += Math.abs(o.predicted - o.actual) / Math.abs(o.actual);
  }
  return {
    sampleSize: usable.length,
    mae: absErr / usable.length,
    mape: (absPct / usable.length) * 100,
  };
}

export const MAE_REGRESSION_THRESHOLD = 0.15;

export function detectPerformanceRegression(input: {
  mae: number;
  previousMae: number | null | undefined;
  mape?: number;
  previousMape?: number | null;
  threshold?: number;
}): { alert: boolean; note: string | null } {
  const prev = input.previousMae;
  if (prev == null || !(prev > 0)) {
    return { alert: false, note: null };
  }
  const threshold = input.threshold ?? MAE_REGRESSION_THRESHOLD;
  const delta = (input.mae - prev) / prev;
  if (delta >= threshold) {
    const mapeBit =
      input.mape != null && input.previousMape != null
        ? ` MAPE ${input.previousMape.toFixed(1)}% → ${input.mape.toFixed(1)}%.`
        : "";
    return {
      alert: true,
      note: `MAE regressed ${(delta * 100).toFixed(1)}% (${prev.toFixed(0)} → ${input.mae.toFixed(0)}).${mapeBit}`,
    };
  }
  return { alert: false, note: null };
}

/**
 * Canonical workflow: DRAFT → REVIEW_REQUESTED → APPROVED → ACTIVE.
 * TESTING is a legacy alias of REVIEW_REQUESTED.
 */
export const MODEL_LIFECYCLE = [
  "DRAFT",
  "TESTING",
  "REVIEW_REQUESTED",
  "APPROVED",
  "ACTIVE",
] as const;

export type ModelLifecycleStatus = (typeof MODEL_LIFECYCLE)[number];

function normalizeLifecycle(
  status: ModelLifecycleStatus,
): "DRAFT" | "REVIEW_REQUESTED" | "APPROVED" | "ACTIVE" {
  if (status === "TESTING" || status === "REVIEW_REQUESTED") {
    return "REVIEW_REQUESTED";
  }
  return status;
}

export function canTransitionModelLifecycle(
  from: ModelLifecycleStatus,
  to: ModelLifecycleStatus,
): boolean {
  if (from === to) return false;
  const a = normalizeLifecycle(from);
  const b = normalizeLifecycle(to);

  const allowed: Record<string, string[]> = {
    DRAFT: ["REVIEW_REQUESTED"],
    REVIEW_REQUESTED: ["DRAFT", "APPROVED"],
    APPROVED: ["REVIEW_REQUESTED", "ACTIVE", "DRAFT"],
    ACTIVE: ["APPROVED", "DRAFT"],
  };
  return (allowed[a] ?? []).includes(b);
}

export function isModelLive(status: string, isActive?: boolean): boolean {
  return status === "ACTIVE" || (isActive === true && status === "ACTIVE");
}

export function assertModelCanGoLive(status: string): {
  ok: boolean;
  error?: string;
} {
  if (status !== "APPROVED" && status !== "ACTIVE") {
    return {
      ok: false,
      error: "Model musí být nejdřív APPROVED (audit) než ACTIVE.",
    };
  }
  return { ok: true };
}

export type ModelVersionCompare = {
  sameAlgorithm: boolean;
  leftVersion: string;
  rightVersion: string;
  leftStatus: string;
  rightStatus: string;
  leftMae: number | null;
  rightMae: number | null;
  maeDelta: number | null;
  notes: string[];
};

export function compareModelVersions(input: {
  left: {
    algorithmVersion: string;
    lifecycleStatus: string;
    mae?: number | null;
  };
  right: {
    algorithmVersion: string;
    lifecycleStatus: string;
    mae?: number | null;
  };
}): ModelVersionCompare {
  const notes: string[] = [];
  const sameAlgorithm =
    input.left.algorithmVersion === input.right.algorithmVersion;
  if (!sameAlgorithm) {
    notes.push(
      `Algorithm ${input.left.algorithmVersion} vs ${input.right.algorithmVersion}`,
    );
  }
  if (input.left.lifecycleStatus !== input.right.lifecycleStatus) {
    notes.push(
      `Status ${input.left.lifecycleStatus} vs ${input.right.lifecycleStatus}`,
    );
  }
  const leftMae = input.left.mae ?? null;
  const rightMae = input.right.mae ?? null;
  const maeDelta =
    leftMae != null && rightMae != null ? rightMae - leftMae : null;
  if (maeDelta != null) {
    notes.push(
      maeDelta < 0
        ? `Right model MAE better by ${Math.abs(maeDelta).toFixed(1)}`
        : `Right model MAE worse by ${maeDelta.toFixed(1)}`,
    );
  }
  return {
    sameAlgorithm,
    leftVersion: input.left.algorithmVersion,
    rightVersion: input.right.algorithmVersion,
    leftStatus: input.left.lifecycleStatus,
    rightStatus: input.right.lifecycleStatus,
    leftMae,
    rightMae,
    maeDelta,
    notes,
  };
}
