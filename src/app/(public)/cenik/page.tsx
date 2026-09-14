import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PageHeader } from "@/components/layout/page-layouts";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { PricingPageAnalytics } from "@/components/commerce/pricing-page-analytics";
import { listActivePricingPlans, buildPricingPageModel } from "@/domains/commerce";
import { PRICING_DISCLAIMERS_CS } from "@/config/pricing-ux";
import { pricingArchitectureMeta } from "@/config/pricing-architecture";

/** Live PricingPlan — never SSG without DB. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = preparePageMeta({
  title: "Ceník",
  description:
    "Ceník Majetio podle segmentů — kupující, investoři, prodávající, makléři, developeři. Ceny z PricingPlan, bez dark patterns.",
  path: "/cenik",
});

export default async function CenikPage() {
  let plans: Awaited<ReturnType<typeof listActivePricingPlans>> = [];
  try {
    plans = await listActivePricingPlans();
  } catch {
    plans = [];
  }
  const model = buildPricingPageModel(plans);

  return (
    <Container className="py-12 sm:py-16">
      <PricingPageAnalytics />
      <PageHeader
        title="Ceník"
        description="Transparentní nabídka podle toho, kdo jste. Ceny načítáme z verzovaného PricingPlan — ne z UI."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Ceník" }]}
      />

      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Katalog {pricingArchitectureMeta.versionKey} ·{" "}
        {PRICING_DISCLAIMERS_CS.vatInclusive}
      </p>

      <div className="mt-4 flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        <p>{PRICING_DISCLAIMERS_CS.noAutoRenew}</p>
        <p>{PRICING_DISCLAIMERS_CS.noFakeScarcity}</p>
        <p>{PRICING_DISCLAIMERS_CS.serverPrice}</p>
      </div>

      {/* Segment nav */}
      <nav
        aria-label="Segmenty ceníku"
        className="mt-8 flex flex-wrap gap-2 border-b border-[var(--border-default)] pb-4"
      >
        {model.segments.map((seg) => (
          <a
            key={seg.id}
            href={`#segment-${seg.id}`}
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]"
          >
            {seg.titleCs}
          </a>
        ))}
      </nav>

      <div className="mt-12 flex flex-col gap-16">
        {model.segments.map((seg) => (
          <section
            key={seg.id}
            id={`segment-${seg.id}`}
            aria-labelledby={`heading-${seg.id}`}
            className="scroll-mt-24"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-default)] pb-4">
              <div>
                <p className="text-[var(--text-label-s)] uppercase tracking-wide text-[var(--text-muted)]">
                  {seg.audience === "b2b"
                    ? "B2B · limity seatů a nabídek"
                    : seg.audience === "services"
                      ? "Služby · human-in-the-loop"
                      : "B2C · free tier první"}
                </p>
                <h2
                  id={`heading-${seg.id}`}
                  className="font-display text-2xl text-[var(--text-primary)]"
                >
                  {seg.titleCs}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
                  {seg.introCs}
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {seg.cards.map((card) => (
                <Card
                  key={card.key}
                  elevation={card.comparisonHighlight ? "raised" : "flat"}
                  className="flex flex-col"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl">{card.nameCs}</h3>
                    {card.requiresRenewConsent ? (
                      <Badge tone="info">Souhlas s obnovou</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
                    {card.priceLabelCs}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {card.billingLabelCs}
                    {card.versionKey ? ` · ${card.versionKey}` : null}
                  </p>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    {card.taglineCs}
                  </p>

                  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                    {card.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>

                  {card.limits.length > 0 ? (
                    <dl className="mt-4 space-y-1 border-t border-[var(--border-default)] pt-3 text-xs text-[var(--text-muted)]">
                      {card.limits.map((l) => (
                        <div key={l.label} className="flex justify-between gap-2">
                          <dt>{l.label}</dt>
                          <dd className="font-medium text-[var(--text-secondary)]">
                            {l.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  <div className="mt-auto pt-6">
                    {card.disabledReasonCs ? (
                      <p className="text-sm text-[var(--text-muted)]">
                        {card.disabledReasonCs}
                      </p>
                    ) : null}
                    {card.ctaHref ? (
                      <ButtonLink
                        href={card.ctaHref}
                        className="mt-2"
                        variant={
                          card.comparisonHighlight ? "primary" : "secondary"
                        }
                      >
                        {card.ctaLabelCs}
                      </ButtonLink>
                    ) : card.disabledReasonCs ? (
                      <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">
                        Nedostupné
                      </p>
                    ) : (
                      <ButtonLink
                        href="/kontakt"
                        className="mt-2"
                        variant="outline"
                      >
                        Zeptat se
                      </ButtonLink>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 127 — transparent comparison */}
      <section className="mt-16" aria-labelledby="comparison-heading">
        <h2 id="comparison-heading" className="font-display text-2xl">
          Porovnání limitů a funkcí
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Stručná matice vybraných plánů — bez skrytých poplatků a bez falešných
          odpočtů.
        </p>
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-default)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--background-secondary)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Produkt</th>
                <th className="px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Cena</th>
                <th className="px-4 py-3 font-medium">Limity</th>
                <th className="px-4 py-3 font-medium">Funkce</th>
              </tr>
            </thead>
            <tbody>
              {model.comparisonRows.map((row) => (
                <tr
                  key={row.key}
                  className="border-t border-[var(--border-default)]"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {row.nameCs}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {row.segmentTitleCs}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {row.priceLabelCs}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {row.limits || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {row.features || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-4 text-sm text-[var(--text-secondary)]">
        <h2 className="font-display text-lg text-[var(--text-primary)]">
          Obnova a zrušení
        </h2>
        <p className="mt-2">
          Žádné tiché auto-obnovení. Obnova předplatného jen po výslovném
          souhlasu. Zrušení další obnovy:{" "}
          <a
            className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            href="/ucet/objednavky"
          >
            Objednávky v účtu
          </a>{" "}
          (e-mail podpory bez skrytých kroků), nebo{" "}
          <a
            className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            href="mailto:podpora@majetio.cz?subject=Zru%C5%A1en%C3%AD%20obnovy"
          >
            podpora@majetio.cz
          </a>
          .
        </p>
      </section>
    </Container>
  );
}
