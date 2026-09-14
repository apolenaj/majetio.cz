import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/feedback/states";
import { resolveSecretShare } from "@/domains/comparisons/share/share-service";
import { formatCzk } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sdílené porovnání | Majetio",
  robots: { index: false, follow: false },
};

export default async function SharedComparisonPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await resolveSecretShare(token);
  if (!result.ok) {
    return (
      <Container className="py-12">
        <InlineAlert tone="warning" title="Sdílení není dostupné">
          {result.error}
        </InlineAlert>
        <p className="mt-4 text-sm">
          <Link href="/" className="underline">
            Zpět na Majetio
          </Link>
        </p>
      </Container>
    );
  }

  const view = result.view;
  if (!view.properties.length) notFound();

  return (
    <Container className="space-y-8 py-10">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Sdílené porovnání (read-only)</p>
        <h1 className="text-h2 text-[var(--text-primary)]">
          {view.name?.trim() || "Porovnání nemovitostí"}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          {view.disclaimerCs}
        </p>
      </header>

      <InlineAlert tone="info" title="Bez osobních finančních údajů">
        Tento odkaz neobsahuje Finanční pas, příjmy, osobní financování ani soukromé
        poznámky. Zobrazená data jsou výslovně vybraná autorem sdílení.
      </InlineAlert>

      <ul className="grid gap-4 md:grid-cols-2">
        {view.properties.map((p) => (
          <li key={p.propertyId}>
            <Card className="space-y-3 p-5">
              <h2 className="font-display text-xl text-[var(--text-primary)]">
                <Link href={p.href} className="hover:underline">
                  {p.title}
                </Link>
              </h2>
              {p.basics ? (
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-[var(--text-muted)]">Cena</dt>
                  <dd>
                    {p.basics.askingPriceCzk != null
                      ? formatCzk(p.basics.askingPriceCzk)
                      : "Není k dispozici"}
                  </dd>
                  <dt className="text-[var(--text-muted)]">Lokalita</dt>
                  <dd>{p.basics.city ?? "Není k dispozici"}</dd>
                  <dt className="text-[var(--text-muted)]">Dispozice</dt>
                  <dd>{p.basics.layout ?? "Není k dispozici"}</dd>
                </dl>
              ) : null}
              {p.valuation?.midCzk != null ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Odhad (střed): {formatCzk(p.valuation.midCzk)}
                  {p.valuation.confidence
                    ? ` · spolehlivost ${p.valuation.confidence}`
                    : ""}
                </p>
              ) : null}
              {p.investment?.grossYieldPct != null ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Hrubý výnos: {p.investment.grossYieldPct.toFixed(1)} %
                </p>
              ) : null}
              {p.risks && p.risks.length > 0 ? (
                <ul className="text-sm text-[var(--text-secondary)]">
                  {p.risks.map((r) => (
                    <li key={`${r.title}-${r.severity}`}>
                      [{r.severity}] {r.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-xs text-[var(--text-muted)]">
        Sdíleno {new Date(view.sharedAt).toLocaleString("cs-CZ")}. Majetio
        nerozhoduje za vás — jde o orientační podklad.
      </p>
    </Container>
  );
}
