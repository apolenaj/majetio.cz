import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { DataQualityBadge, RiskBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";
import { MajetioScore, MetricValue } from "@/components/data-display/metric-card";
import { InlineAlert } from "@/components/feedback/states";
import { StickyMobileCTALink } from "@/components/navigation/mobile-nav";
import { AspectRatio } from "@/components/ui/layout-primitives";
import { PropertyPriceHistory } from "@/components/property/property-price-history";
import { PropertySourceFreshness } from "@/components/property/property-source-freshness";
import { getDemoPublicProperty } from "@/content/demo-canonical-properties";
import { formatCzk, formatCzkPerSqm, formatPercentPoints } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = getDemoPublicProperty(slug);
  if (!property) {
    return { title: "Nemovitost nenalezena", robots: { index: false } };
  }
  return {
    title: property.title,
    description: `${property.location.label ?? property.location.city ?? ""} — demonstrační detail nemovitosti Majetio.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `/nemovitosti/${property.slug}` },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = getDemoPublicProperty(slug);
  if (!property) notFound();

  const primaryImage =
    property.media.find((m) => m.isPrimary) ?? property.media[0] ?? null;
  const areaConflict = property.fieldConflicts.find((c) => c.fieldKey === "usableArea");

  return (
    <>
      <Container className="py-10 sm:py-14 pb-28 lg:pb-14">
        <PageHeader
          title={property.title}
          description={property.location.label ?? property.location.city ?? undefined}
          breadcrumbs={[
            { href: "/", label: "Domů" },
            { href: "/nemovitosti", label: "Nemovitosti" },
            { label: property.title },
          ]}
        />

        {property.isDemo ? (
          <InlineAlert tone="warning" title="Demonstrační nemovitost" className="mb-8">
            Tato stránka ukazuje kanonická demo data Majetio. Nejde o reálnou nabídku k prodeji.
          </InlineAlert>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-8">
            <AspectRatio ratio="16/9" className="rounded-[var(--radius-card)] bg-[var(--surface-sunken)]">
              {primaryImage && !primaryImage.isPlaceholder ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage.url}
                  alt={primaryImage.alt ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                  <Building2 className="size-10" aria-hidden />
                  <span className="text-sm">Fotografie není k dispozici (demo)</span>
                </div>
              )}
            </AspectRatio>

            <div className="flex flex-wrap gap-2">
              {property.dataQuality ? (
                <DataQualityBadge quality={property.dataQuality} />
              ) : null}
              {property.risk ? <RiskBadge level={property.risk} /> : null}
              {property.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>

            <Card>
              <h2 className="font-display text-xl">Rychlé shrnutí</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-caption text-[var(--text-muted)]">Nabídková cena</dt>
                  <dd>
                    <MetricValue
                      value={
                        property.askingPrice != null ? formatCzk(property.askingPrice) : "—"
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-[var(--text-muted)]">Cena za m²</dt>
                  <dd className="font-metric font-semibold">
                    {property.pricePerSqm != null
                      ? formatCzkPerSqm(property.pricePerSqm)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-[var(--text-muted)]">Dispozice / plocha</dt>
                  <dd>
                    {[property.layout, property.usableAreaDisplay]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                  {areaConflict ? (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Zdroje se liší — zobrazujeme rozsah místo falešné přesnosti.
                    </p>
                  ) : null}
                </div>
                <div>
                  <dt className="text-caption text-[var(--text-muted)]">Hrubý výnos (demo)</dt>
                  <dd>
                    <MetricValue
                      tone="positive"
                      value={
                        property.grossYieldPct != null
                          ? formatPercentPoints(property.grossYieldPct, { signed: true })
                          : "—"
                      }
                    />
                  </dd>
                </div>
              </dl>
              {property.description ? (
                <p className="mt-4 text-sm text-[var(--text-secondary)]">{property.description}</p>
              ) : null}
            </Card>

            <MajetioScore score={property.majetioScore ?? null} />

            <Card>
              <h2 className="font-display text-xl">Historie ceny</h2>
              <div className="mt-4">
                <PropertyPriceHistory points={property.priceHistory} />
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-xl">Zdroj a aktuálnost</h2>
              <div className="mt-4">
                <PropertySourceFreshness
                  sources={property.sources}
                  lastSeenAt={property.lastSeenAt}
                  freshness={property.freshness}
                />
              </div>
            </Card>

            {property.fieldConflicts.length > 0 ? (
              <Card>
                <h2 className="font-display text-xl">Rozdíly mezi zdroji</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {property.fieldConflicts.map((conflict) => (
                    <li key={conflict.fieldKey}>
                      <strong>{conflict.label}:</strong> {conflict.display}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card elevation="raised">
              <p className="text-caption uppercase text-[var(--text-muted)]">Cena (demo)</p>
              <MetricValue
                size="xl"
                value={property.askingPrice != null ? formatCzk(property.askingPrice) : "—"}
              />
              <div className="mt-6 flex flex-col gap-2">
                <ButtonLink href="/analyza">Analyzovat nemovitost</ButtonLink>
                <ButtonLink href="/porovnani" variant="secondary">
                  Přidat do porovnání
                </ButtonLink>
                <ButtonLink href="/ucet/oblibene" variant="outline">
                  Uložit (vyžaduje účet)
                </ButtonLink>
                <ButtonLink href="/kalkulacky/financovani" variant="ghost">
                  Spočítat financování
                </ButtonLink>
                <ButtonLink href="/cenik" variant="link">
                  Objednat kompletní analýzu
                </ButtonLink>
              </div>
              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Uložení a porovnání vyžadují dokončenou autentizaci. CTA vedou na připravené
                stránky bez falešného úspěchu.
              </p>
            </Card>
          </aside>
        </div>
      </Container>
      <StickyMobileCTALink label="Analyzovat nemovitost" href="/analyza" />
    </>
  );
}
