import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyIdentityGrid } from "@/components/property/property-identity-grid";
import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { MetricValue } from "@/components/data-display/metric-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { StickyMobileCTALink } from "@/components/navigation/mobile-nav";
import {
  buildPropertyDetailBreadcrumbs,
  loadPropertyDetailBySlug,
  propertyListingStatusTone,
} from "@/domains/properties/service/detail-loader";
import { formatCzk, formatCzkPerSqm } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await loadPropertyDetailBySlug(slug);
  if (!property) {
    return { title: "Nemovitost nenalezena", robots: { index: false } };
  }
  const place =
    property.location.label ??
    property.location.city ??
    "Demonstrační detail Majetio";
  return {
    title: property.title,
    description: `${place} — detail nemovitosti Majetio.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `/nemovitosti/${property.slug}` },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await loadPropertyDetailBySlug(slug);
  if (!property) notFound();

  const statusTone = propertyListingStatusTone(property.status);
  const locationLine = [
    property.location.addressLine,
    property.location.district,
    property.location.city,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Container className="overflow-x-hidden py-10 sm:py-14 pb-28 lg:pb-14">
        <PageHeader
          title={property.title}
          description={
            property.location.precision === "HIDDEN"
              ? property.location.city
                ? `${property.location.city} — přesná adresa je skrytá`
                : "Přesná adresa je skrytá"
              : locationLine || property.location.label || undefined
          }
          breadcrumbs={buildPropertyDetailBreadcrumbs(property)}
          badge={
            property.isDemo ? <Badge tone="premium">Demo</Badge> : undefined
          }
        />

        <div className="mb-8 space-y-3">
          {property.isDemo ? (
            <InlineAlert tone="warning" title="Demonstrační nemovitost">
              Tato stránka ukazuje kanonická demo data Majetio. Nejde o reálnou
              nabídku k prodeji.
            </InlineAlert>
          ) : null}

          {statusTone === "unavailable" ? (
            <InlineAlert tone="error" title="Nabídka nemusí být dostupná">
              Stav nabídky je „nedostupná“. Údaje zůstávají pro kontext, ale
              nemovitost už nemusí být na trhu.
            </InlineAlert>
          ) : null}

          {statusTone === "archived" ? (
            <InlineAlert tone="warning" title="Archivovaná nabídka">
              Tato nabídka je v archivu. Informace slouží jako historický záznam.
            </InlineAlert>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-10">
            <PropertyGallery media={property.media} title={property.title} />
            <PropertyIdentityGrid property={property} />

            {property.description ? (
              <section aria-labelledby="property-desc-heading">
                <h2
                  id="property-desc-heading"
                  className="font-display text-xl text-[var(--text-primary)]"
                >
                  Popis
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {property.description}
                </p>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card elevation="raised">
              <p className="text-caption uppercase text-[var(--text-muted)]">
                Nabídková cena
              </p>
              <MetricValue
                size="xl"
                value={
                  property.askingPrice != null
                    ? formatCzk(property.askingPrice)
                    : "—"
                }
              />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {property.pricePerSqm != null
                  ? formatCzkPerSqm(property.pricePerSqm)
                  : "Kč/m² neuvedeno"}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <ButtonLink href="/analyza">Analyzovat nemovitost</ButtonLink>
                <ButtonLink href="/nemovitosti" variant="secondary">
                  Zpět na katalog
                </ButtonLink>
              </div>
            </Card>
          </aside>
        </div>
      </Container>
      <StickyMobileCTALink label="Analyzovat nemovitost" href="/analyza" />
    </>
  );
}
