import type { PublicValuationDto, AnalystValuationDto } from "@/domains/valuation";
import { VALUATION_LEGAL_DISCLAIMER } from "@/domains/valuation";
import { PropertyValuationRecalcButton } from "@/components/property/property-valuation-analytics";

/**
 * Legal disclaimer under automated estimate UI.
 */
export function PropertyValuationDisclaimer({
  slug,
  valuation,
}: {
  slug: string;
  valuation?: PublicValuationDto | AnalystValuationDto | null;
}) {
  const text = valuation?.disclaimer ?? VALUATION_LEGAL_DISCLAIMER;

  return (
    <aside
      aria-label="Právní upozornění k odhadu"
      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]"
    >
      <p>{text}</p>
      {valuation?.engineVersion ? (
        <p className="mt-2 text-caption text-[var(--text-muted)]">
          Model: {valuation.engineVersion}
          {valuation.isDemo ? " · demonstrační data" : null}
        </p>
      ) : null}
      <PropertyValuationRecalcButton slug={slug} />
    </aside>
  );
}
