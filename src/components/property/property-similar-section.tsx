import { PropertyCard, type PropertyCardData } from "@/components/property/property-card";
import { Card } from "@/components/ui/card";

const NEU = "Neuvedeno";

export type SimilarPropertyItem = {
  card: PropertyCardData;
  reason: string;
};

/**
 * 3–6 alternative listings with explicit “why this alternative” reasons.
 */
export function PropertySimilarSection({
  items,
}: {
  items: SimilarPropertyItem[];
}) {
  return (
    <section aria-labelledby="similar-heading">
      <h2
        id="similar-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Možné alternativy
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Relevantní srovnání s vysvětlením — ne náhodný výpis. Chybí-li data,
        sekci nevyplňujeme falešnými nabídkami.
      </p>

      {items.length === 0 ? (
        <Card className="mt-5" padding="lg" variant="muted">
          <p className="text-sm text-[var(--text-secondary)]">
            Alternativy: <strong>{NEU}</strong>. Pro tuto nabídku zatím nejsou
            připravené demonstrační srovnání.
          </p>
        </Card>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ card, reason }) => (
            <li key={card.slug ?? card.href}>
              <PropertyCard
                property={{
                  ...card,
                  matchReasons: [
                    { tone: "positive", label: reason },
                    ...(card.matchReasons ?? []),
                  ],
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
