import { formatCzk } from "@/lib/format";
import type {
  AnalystValuationDto,
  PublicValuationDto,
} from "@/domains/valuation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NEU = "Nutno ověřit";

/**
 * "Co hodnotu ovlivňuje" — public adjustment list from the engine.
 */
export function PropertyValuationAdjustments({
  valuation,
}: {
  valuation: PublicValuationDto | AnalystValuationDto | null;
}) {
  const adjustments = valuation?.adjustments ?? [];

  return (
    <section aria-labelledby="valuation-adj-heading">
      <h2
        id="valuation-adj-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Co hodnotu ovlivňuje
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Korekce vůči základu ze srovnatelných nemovitostí — každá má směr a
        vysvětlení.
      </p>

      {adjustments.length === 0 ? (
        <Card className="mt-4" padding="lg" variant="muted">
          <p className="text-sm text-[var(--text-secondary)]">
            {valuation?.status === "CALCULATED"
              ? "Žádné specifické korekce oproti mediánu comparables."
              : (
                  <>
                    Úpravy odhadu: <strong>{NEU}</strong>
                  </>
                )}
          </p>
        </Card>
      ) : (
        <ul className="mt-4 space-y-2">
          {adjustments.map((a) => (
            <li key={a.code}>
              <Card padding="md">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "font-medium",
                      a.direction === "up" &&
                        "text-[var(--investment-positive)]",
                      a.direction === "down" &&
                        "text-[var(--investment-negative)]",
                      a.direction === "neutral" &&
                        "text-[var(--text-primary)]",
                    )}
                  >
                    {a.label}
                  </p>
                  <p className="font-metric text-sm text-[var(--text-secondary)]">
                    {a.amountCzk > 0 ? "+" : ""}
                    {formatCzk(a.amountCzk)}{" "}
                    <span className="text-[var(--text-muted)]">
                      ({a.factor > 0 ? "+" : ""}
                      {(a.factor * 100).toFixed(1)} %)
                    </span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {a.reason}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
