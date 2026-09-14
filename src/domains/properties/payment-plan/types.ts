/**
 * Off-plan PropertyPaymentPlan model (Prompt 17.4).
 * Phases feed Financial Engine cash timing — not a bank amortization schedule.
 */

export const PAYMENT_PLAN_PHASE_KINDS = [
  "BOOKING",
  "DOWN_PAYMENT",
  "CONSTRUCTION",
  "HANDOVER",
  "POST_HANDOVER",
  "OTHER",
] as const;

export type PaymentPlanPhaseKind = (typeof PAYMENT_PLAN_PHASE_KINDS)[number];

export type PropertyPaymentPlanPhase = {
  id: string;
  kind: PaymentPlanPhaseKind;
  labelEn: string;
  /** Sort order ascending. */
  sequence: number;
  /** Share of purchase price in basis points (sum should ≈ 10000). */
  amountBps: number;
  /** Optional absolute override in minor currency units. */
  amountMinorOverride: number | null;
  /** ISO date or null if tied to milestone only. */
  dueDate: string | null;
  /** Construction % complete trigger (0–100), optional. */
  constructionPctTrigger: number | null;
  notesEn: string | null;
};

export type PropertyPaymentPlan = {
  id: string;
  propertyId: string | null;
  marketCode: string;
  currency: string;
  /** Total contract price in minor units. */
  totalPriceMinor: number;
  developerName: string | null;
  projectName: string | null;
  version: string;
  phases: PropertyPaymentPlanPhase[];
  /** FX snapshot id if plan currency ≠ scenario baseCurrency. */
  fxSnapshotId: string | null;
};

export type PaymentScheduleCashEvent = {
  phaseId: string;
  kind: PaymentPlanPhaseKind;
  labelEn: string;
  amountMinor: number;
  currency: string;
  dueDate: string | null;
  sequence: number;
};

/**
 * Expand plan phases into absolute cash events (minor units).
 */
export function expandPaymentPlanSchedule(
  plan: PropertyPaymentPlan,
): PaymentScheduleCashEvent[] {
  return [...plan.phases]
    .sort((a, b) => a.sequence - b.sequence)
    .map((p) => {
      const amountMinor =
        p.amountMinorOverride != null
          ? p.amountMinorOverride
          : Math.round((plan.totalPriceMinor * p.amountBps) / 10_000);
      return {
        phaseId: p.id,
        kind: p.kind,
        labelEn: p.labelEn,
        amountMinor,
        currency: plan.currency,
        dueDate: p.dueDate,
        sequence: p.sequence,
      };
    });
}

export function assertPaymentPlanBpsNearComplete(
  plan: PropertyPaymentPlan,
  toleranceBps = 50,
): boolean {
  const sum = plan.phases.reduce((s, p) => {
    if (p.amountMinorOverride != null) {
      return (
        s + Math.round((p.amountMinorOverride * 10_000) / plan.totalPriceMinor)
      );
    }
    return s + p.amountBps;
  }, 0);
  return Math.abs(sum - 10_000) <= toleranceBps;
}

/** Demo AE-style 10/40/50 plan for tests / fixtures. */
export function createDemoOffPlanPaymentPlan(input: {
  totalPriceMinor: number;
  currency?: string;
  marketCode?: string;
}): PropertyPaymentPlan {
  return {
    id: "demo-plan",
    propertyId: null,
    marketCode: input.marketCode ?? "AE",
    currency: input.currency ?? "AED",
    totalPriceMinor: input.totalPriceMinor,
    developerName: null,
    projectName: null,
    version: "demo.v1",
    fxSnapshotId: null,
    phases: [
      {
        id: "p1",
        kind: "DOWN_PAYMENT",
        labelEn: "Down payment",
        sequence: 1,
        amountBps: 1000,
        amountMinorOverride: null,
        dueDate: null,
        constructionPctTrigger: 0,
        notesEn: null,
      },
      {
        id: "p2",
        kind: "CONSTRUCTION",
        labelEn: "During construction",
        sequence: 2,
        amountBps: 4000,
        amountMinorOverride: null,
        dueDate: null,
        constructionPctTrigger: 50,
        notesEn: null,
      },
      {
        id: "p3",
        kind: "HANDOVER",
        labelEn: "On handover",
        sequence: 3,
        amountBps: 5000,
        amountMinorOverride: null,
        dueDate: null,
        constructionPctTrigger: 100,
        notesEn: null,
      },
    ],
  };
}
