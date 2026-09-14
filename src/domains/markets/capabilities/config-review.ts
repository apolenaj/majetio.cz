/**
 * Config / tax / regulatory review flow (Rules 225–230).
 * States: DRAFT → REVIEWED → ACTIVE → RETIRED (SUPERSEDED kept for legacy).
 */

export const CONFIG_REVIEW_STATUSES = [
  "DRAFT",
  "REVIEWED",
  "ACTIVE",
  "RETIRED",
  "SUPERSEDED",
] as const;

export type ConfigReviewStatus = (typeof CONFIG_REVIEW_STATUSES)[number];

export type ConfigReviewRecord = {
  id: string;
  kind: "REGULATORY_RULE" | "TAX_PROVIDER" | "TRANSACTION_COST_PACK";
  marketCode: string;
  configKey: string;
  version: string;
  status: ConfigReviewStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  activatedAt: string | null;
};

export class ConfigReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigReviewError";
  }
}

/**
 * Only ACTIVE configs may be used in production calculations.
 * DRAFT/REVIEWED must not silently go live.
 */
export function assertConfigEditable(input: {
  status: ConfigReviewStatus;
  action: "edit" | "activate" | "retire";
}): void {
  if (input.action === "edit") {
    if (input.status === "ACTIVE") {
      throw new ConfigReviewError(
        "ACTIVE config cannot be edited in place — create a new DRAFT version.",
      );
    }
    if (input.status === "RETIRED" || input.status === "SUPERSEDED") {
      throw new ConfigReviewError("Retired/superseded configs are immutable.");
    }
    return;
  }
  if (input.action === "activate") {
    if (input.status !== "REVIEWED" && input.status !== "DRAFT") {
      throw new ConfigReviewError(
        "Only DRAFT or REVIEWED configs can be activated (prefer REVIEWED).",
      );
    }
    return;
  }
  if (input.action === "retire") {
    if (input.status !== "ACTIVE" && input.status !== "REVIEWED") {
      throw new ConfigReviewError("Only ACTIVE/REVIEWED configs can be retired.");
    }
  }
}

export function transitionConfigStatus(input: {
  from: ConfigReviewStatus;
  to: ConfigReviewStatus;
}): ConfigReviewStatus {
  const allowed: Record<ConfigReviewStatus, ConfigReviewStatus[]> = {
    DRAFT: ["REVIEWED", "RETIRED"],
    REVIEWED: ["ACTIVE", "DRAFT", "RETIRED"],
    ACTIVE: ["SUPERSEDED", "RETIRED"],
    SUPERSEDED: [],
    RETIRED: [],
  };
  if (!allowed[input.from].includes(input.to)) {
    throw new ConfigReviewError(
      `Illegal transition ${input.from} → ${input.to}. Review flow required.`,
    );
  }
  return input.to;
}

/** Production calculators must only consume ACTIVE. */
export function isProductionConfigStatus(status: ConfigReviewStatus): boolean {
  return status === "ACTIVE";
}
