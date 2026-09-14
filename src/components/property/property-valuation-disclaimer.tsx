import type { PublicValuationDto, AnalystValuationDto } from "@/domains/valuation";
import { VALUATION_LEGAL_DISCLAIMER } from "@/domains/valuation";
import { PropertyValuationRecalcButton } from "@/components/property/property-valuation-analytics";
import { MethodologyAttribution } from "@/components/methodology/methodology-attribution";

/**
 * Legal disclaimer under automated estimate UI.
 */
export function PropertyValuationDisclaimer({
  slug,
  valuation,
  methodologyPackageVersion,
}: {
  slug: string;
  valuation?: PublicValuationDto | AnalystValuationDto | null;
  /** Frozen package from persisted analysis when available. */
  methodologyPackageVersion?: string | null;
}) {
  const text = valuation?.disclaimer ?? VALUATION_LEGAL_DISCLAIMER;

  return (
    <aside
      aria-label="Právní upozornění k odhadu"
      className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]"
    >
      <p>{text}</p>
      <MethodologyAttribution
        compact
        methodologyPackageVersion={methodologyPackageVersion}
        valuationEngineVersion={valuation?.engineVersion}
      />
      {valuation?.isDemo ? (
        <p className="text-[var(--text-caption)] text-[var(--text-muted)]">
          Demonstrační data
        </p>
      ) : null}
      <PropertyValuationRecalcButton slug={slug} />
    </aside>
  );
}
