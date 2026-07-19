import { formatCzk, formatDateTime } from "@/lib/format";
import type {
  AnalystComparableDto,
  AnalystValuationDto,
  PublicComparableDto,
  PublicValuationDto,
} from "@/domains/valuation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/data-display/table";

const NEU = "Neuvedeno";

function locationLine(c: PublicComparableDto): string {
  const parts = [c.district, c.city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : NEU;
}

function formatObserved(iso: string | null, anonymized: boolean): string {
  if (!iso) return NEU;
  if (anonymized || /^\d{4}-\d{2}$/.test(iso)) return iso;
  return formatDateTime(iso).split(" ")[0] ?? formatDateTime(iso);
}

function pickDisplayRows(
  valuation: PublicValuationDto | AnalystValuationDto,
): Array<PublicComparableDto & { weight?: number }> {
  if (valuation.kind === "analyst") {
    return valuation.analystComparables
      .filter((c) => c.included && c.weight > 0)
      .sort(
        (a, b) =>
          b.weight - a.weight || b.similarityScore - a.similarityScore,
      )
      .slice(0, 10)
      .map((c: AnalystComparableDto) => ({
        ...c,
        // Analyst UI may show real identity; keep anonymized badge if licence says so
        label: c.anonymized
          ? `${c.label} (licence: anonymizovat veřejně)`
          : c.label,
        weight: c.weight,
      }));
  }
  return valuation.comparables;
}

/**
 * 3–10 most relevant comparables (anonymized when licence requires).
 */
export function PropertyValuationComparables({
  valuation,
}: {
  valuation: PublicValuationDto | AnalystValuationDto | null;
}) {
  const rows = valuation ? pickDisplayRows(valuation) : [];
  const showWeight = valuation?.kind === "analyst";

  return (
    <section aria-labelledby="valuation-comps-heading">
      <h2
        id="valuation-comps-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Srovnatelné nemovitosti
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Nejrelevantnější srovnání použité při odhadu. U zdrojů s omezenou licencí
        zobrazujeme anonymizované řádky bez přesné identity nabídky.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-4" padding="lg" variant="muted">
          <p className="text-sm text-[var(--text-secondary)]">
            Srovnatelné nemovitosti: <strong>{NEU}</strong>
            {valuation?.statusReason ? ` — ${valuation.statusReason}` : null}
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-4 hidden md:block">
            <Table>
              <THead>
                <TR>
                  <TH>Nemovitost</TH>
                  <TH>Lokalita</TH>
                  <TH>Dispozice</TH>
                  <TH>Plocha</TH>
                  <TH>Cena</TH>
                  <TH>Kč/m²</TH>
                  <TH>Podobnost</TH>
                  <TH>Pozorováno</TH>
                  {showWeight ? <TH>Váha</TH> : null}
                </TR>
              </THead>
              <TBody>
                {rows.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <span className="font-medium text-[var(--text-primary)]">
                        {c.label}
                      </span>
                      {c.anonymized ? (
                        <Badge className="ml-2" tone="neutral">
                          Anonymizováno
                        </Badge>
                      ) : null}
                    </TD>
                    <TD>{locationLine(c)}</TD>
                    <TD>{c.layout ?? NEU}</TD>
                    <TD>
                      {c.usableArea != null ? `${c.usableArea} m²` : NEU}
                    </TD>
                    <TD>
                      {c.priceCzk != null ? formatCzk(c.priceCzk) : NEU}
                    </TD>
                    <TD>
                      {c.pricePerSqm != null
                        ? formatCzk(Math.round(c.pricePerSqm))
                        : NEU}
                    </TD>
                    <TD>{c.similarityPct} %</TD>
                    <TD>{formatObserved(c.observedAt, c.anonymized)}</TD>
                    {showWeight ? (
                      <TD className="font-metric">
                        {"weight" in c && typeof c.weight === "number"
                          ? c.weight.toFixed(3)
                          : NEU}
                      </TD>
                    ) : null}
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <ul className="mt-4 grid gap-3 md:hidden">
            {rows.map((c) => (
              <li key={c.id}>
                <Card padding="md">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[var(--text-primary)]">
                      {c.label}
                    </p>
                    {c.anonymized ? (
                      <Badge tone="neutral">Anonymizováno</Badge>
                    ) : null}
                    <Badge tone="neutral">{c.similarityPct} % podobnost</Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-[var(--text-muted)]">Lokalita</dt>
                      <dd>{locationLine(c)}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Dispozice</dt>
                      <dd>{c.layout ?? NEU}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Plocha</dt>
                      <dd>
                        {c.usableArea != null ? `${c.usableArea} m²` : NEU}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Cena</dt>
                      <dd>
                        {c.priceCzk != null ? formatCzk(c.priceCzk) : NEU}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Kč/m²</dt>
                      <dd>
                        {c.pricePerSqm != null
                          ? formatCzk(Math.round(c.pricePerSqm))
                          : NEU}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Pozorováno</dt>
                      <dd>{formatObserved(c.observedAt, c.anonymized)}</dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
