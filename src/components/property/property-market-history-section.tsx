import { formatCzk } from "@/lib/format";
import type { PublicPriceHistoryPoint } from "@/domains/properties/service/dto";
import { PropertyPriceHistory } from "@/components/property/property-price-history";
import { InlineAlert } from "@/components/feedback/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NEU = "Nutno ověřit";

/**
 * Price history timeline/table + days on market + relist notice.
 */
export function PropertyMarketHistorySection({
  points,
  daysOnMarket,
  relisted,
  relistNote,
  publishedAt,
}: {
  points: PublicPriceHistoryPoint[];
  daysOnMarket: number | null;
  relisted: boolean;
  relistNote: string | null;
  publishedAt: string | null;
}) {
  const sortedAsc = [...points].sort(
    (a, b) =>
      new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
  );

  return (
    <section aria-labelledby="market-history-heading" className="space-y-4">
      <div>
        <h2
          id="market-history-heading"
          className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
        >
          Historie ceny a doba na trhu
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Změny nabídkové ceny ze zdrojů. Historii nevymýšlíme — bez bodů ji
          neuvidíte.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Card padding="md" className="min-w-[10rem] flex-1">
          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            Doba na trhu
          </p>
          <p
            className={cn(
              "mt-1 font-metric text-2xl font-semibold",
              daysOnMarket == null
                ? "text-[var(--text-muted)]"
                : "text-[var(--text-primary)]",
            )}
          >
            {daysOnMarket != null ? `${daysOnMarket} dní` : NEU}
          </p>
          {publishedAt ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Publikováno:{" "}
              {new Intl.DateTimeFormat("cs-CZ", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date(publishedAt))}
            </p>
          ) : null}
        </Card>
        {relisted ? (
          <InlineAlert
            className="min-w-[16rem] flex-[2]"
            tone="warning"
            title="Nabídka byla znovu zveřejněna"
          >
            {relistNote ||
              "Záznam naznačuje relisting — doba na trhu nemusí odpovídat prvnímu zveřejnění."}
          </InlineAlert>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h3">Časová osa</CardTitle>
            <CardDescription>PropertyPriceHistory</CardDescription>
          </CardHeader>
          <PropertyPriceHistory points={points} />
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h3">Tabulka změn</CardTitle>
            <CardDescription>Chronologicky od nejstarší</CardDescription>
          </CardHeader>
          {sortedAsc.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Historie ceny zatím není k dispozici.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                    <th className="py-2 pr-3 font-medium">Datum</th>
                    <th className="py-2 pr-3 font-medium">Cena</th>
                    <th className="py-2 pr-3 font-medium">Změna</th>
                    <th className="py-2 font-medium">Zdroj</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAsc.map((p, i) => {
                    const prev = i > 0 ? sortedAsc[i - 1]! : null;
                    const delta =
                      prev != null ? p.amount - prev.amount : null;
                    return (
                      <tr
                        key={`${p.observedAt}-${p.amount}-${i}`}
                        className="border-b border-[var(--border-default)] last:border-0"
                      >
                        <td className="py-2 pr-3 text-[var(--text-secondary)]">
                          {new Intl.DateTimeFormat("cs-CZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(p.observedAt))}
                        </td>
                        <td className="py-2 pr-3 font-metric font-semibold">
                          {formatCzk(p.amount)}
                        </td>
                        <td className="py-2 pr-3">
                          {delta == null ? (
                            <Badge tone="neutral">Start</Badge>
                          ) : (
                            <span
                              className={cn(
                                "font-metric text-xs font-semibold",
                                delta < 0
                                  ? "text-[var(--investment-positive)]"
                                  : delta > 0
                                    ? "text-[var(--investment-negative)]"
                                    : "text-[var(--text-muted)]",
                              )}
                            >
                              {formatCzk(delta, { signed: true })}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-xs text-[var(--text-muted)]">
                          {p.sourceLabel || NEU}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
