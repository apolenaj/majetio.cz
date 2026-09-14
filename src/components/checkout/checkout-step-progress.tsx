import { commerceConfig } from "@/config/commerce";

const STEPS = commerceConfig.checkout.steps;

export type CheckoutStepId = (typeof STEPS)[number];

const LABELS: Record<CheckoutStepId, string> = {
  select_product: "Produkt",
  review: "Rekapitulace",
  billing: "Fakturace",
  payment: "Platba",
  confirmation: "Potvrzení",
  entitlement: "Přístup",
  success: "Hotovo",
};

/**
 * Visual progress for checklist 129 — all seven checkout stages.
 */
export function CheckoutStepProgress({
  current,
  completedThrough,
}: {
  /** Active step highlight */
  current: CheckoutStepId;
  /** All steps up to and including this one are marked done */
  completedThrough?: CheckoutStepId;
}) {
  const currentIdx = STEPS.indexOf(current);
  const doneIdx = completedThrough
    ? STEPS.indexOf(completedThrough)
    : currentIdx - 1;

  return (
    <nav aria-label="Průběh objednávky" className="flex flex-wrap gap-2 text-xs">
      {STEPS.map((s, i) => {
        const isCurrent = i === currentIdx;
        const isDone = i <= doneIdx;
        return (
          <span
            key={s}
            className={
              isCurrent
                ? "rounded-[var(--radius-sm)] bg-[var(--background-secondary)] px-2 py-1 font-semibold text-[var(--text-primary)]"
                : isDone
                  ? "px-2 py-1 text-[var(--text-secondary)]"
                  : "px-2 py-1 text-[var(--text-muted)]"
            }
            aria-current={isCurrent ? "step" : undefined}
          >
            {i + 1}. {LABELS[s]}
          </span>
        );
      })}
    </nav>
  );
}

export function checkoutStepLabel(step: CheckoutStepId): string {
  return LABELS[step] ?? step;
}

export { STEPS as CHECKOUT_STEPS };
