import {
  resolveEffectiveCapability,
  type EffectiveCapability,
} from "@/domains/markets/capabilities/effective";
import type { MarketCapabilityKey } from "@/domains/markets/types";
import { cn } from "@/lib/utils";

/**
 * Polite unavailable / limited notice driven by Capability Matrix.
 * Never throws for ES or other planned markets.
 */
export function MarketCapabilityNotice(props: {
  marketCode: string;
  capability: MarketCapabilityKey;
  locale?: string;
  className?: string;
  /** Optional pre-resolved effective capability (tests / RSC). */
  effective?: EffectiveCapability;
}) {
  const effective =
    props.effective ??
    resolveEffectiveCapability({
      marketCode: props.marketCode,
      capability: props.capability,
      locale: props.locale,
    });

  if (effective.uiState === "FULL" || !effective.message) {
    return null;
  }

  const tone =
    effective.uiState === "LIMITED"
      ? "border-[var(--status-warning)] bg-[var(--background-secondary)]"
      : "border-[var(--border-default)] bg-[var(--background-secondary)]";

  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        tone,
        props.className,
      )}
      data-capability={effective.capability}
      data-ui-state={effective.uiState}
      data-market={effective.marketCode}
    >
      <p className="font-medium text-[var(--text-primary)]">
        {effective.message.title}
      </p>
      <p className="mt-1 text-[var(--text-secondary)]">{effective.message.body}</p>
      {effective.reviewRequired ? (
        <p className="mt-2 text-xs text-[var(--status-warning)]">
          Trh vyžaduje kontrolu regulačních pravidel (review_required).
        </p>
      ) : null}
      {effective.killSwitchActive ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Dočasně pozastaveno administrátorem.
        </p>
      ) : null}
    </div>
  );
}
