import { formatCzk } from "@/lib/format";
import type { RenovationDemo } from "@/content/demo-property-financial";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

const NEU = "Neuvedeno";

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-metric text-lg font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export function PropertyRenovationSection({
  renovation,
}: {
  renovation: RenovationDemo | null;
}) {
  return (
    <section aria-labelledby="renovation-heading">
      <h2
        id="renovation-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Rekonstrukce a potenciál
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Orientační náklady a hodnota po úpravách. Nejde o stavební rozpočet ani
        garanci zhodnocení.
      </p>

      {!renovation ? (
        <Card className="mt-5" padding="lg" variant="muted">
          <p className="text-sm text-[var(--text-secondary)]">
            Odhad rekonstrukce: <strong>{NEU}</strong>. Pro tuto nabídku nejsou
            připravená demonstrační data potenciálu.
          </p>
        </Card>
      ) : (
        <Card className="mt-5" padding="lg">
          <CardHeader>
            <CardTitle as="h3">Orientační scénář úprav</CardTitle>
            <CardDescription>{renovation.note || NEU}</CardDescription>
          </CardHeader>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Cell
              label="Odhad nákladů"
              value={
                renovation.costCzk != null
                  ? formatCzk(renovation.costCzk)
                  : NEU
              }
            />
            <Cell
              label="Rezerva"
              value={
                renovation.reserveCzk != null
                  ? formatCzk(renovation.reserveCzk)
                  : NEU
              }
            />
            <Cell
              label="Hodnota po rekonstrukci"
              value={
                renovation.valueAfterCzk != null
                  ? formatCzk(renovation.valueAfterCzk)
                  : NEU
              }
            />
            <Cell
              label="Max. nabídková cena"
              value={
                renovation.maxOfferCzk != null
                  ? formatCzk(renovation.maxOfferCzk)
                  : NEU
              }
            />
          </div>

          <ButtonLink
            href="/kalkulacky/rekonstrukce"
            variant="secondary"
            size="sm"
            className="mt-5"
          >
            Otevřít kalkulačku rekonstrukce
          </ButtonLink>
        </Card>
      )}
    </section>
  );
}
