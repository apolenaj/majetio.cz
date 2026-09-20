import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { formatCzk } from "@/components/marketing/format";
import { InlineAlert } from "@/components/feedback/states";
import {
  listPublicCustomerProducts,
  priceGrossCzkFromMinor,
  PUBLIC_PRICING_POLICY,
  publicCheckoutMode,
} from "@/config/public-offer";
import type { CatalogProductDef } from "@/config/pricing-architecture";

export const metadata: Metadata = preparePageMeta({
  title: "Ceník",
  description:
    "Pevné ceny za inzerát, Premium, přípravu inzerátu, analýzu před koupí, hledání na zadání a firemní předplatné. Bez procentní provize z prodeje za běžnou inzerci.",
  path: "/cenik",
});

function ProductCard({
  product,
  href,
  cta,
}: {
  product: CatalogProductDef;
  href: string;
  cta: string;
}) {
  const czk = priceGrossCzkFromMinor(product.priceGrossMinor);
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-raised)]">
      <h3 className="font-display text-xl text-[var(--text-primary)]">{product.nameCs}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{product.taglineCs}</p>
      {czk != null ? (
        <p className="mt-4 font-metric text-3xl text-[var(--text-primary)]">{formatCzk(czk)}</p>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Individuální nabídka</p>
      )}
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {product.billingType === "SUBSCRIPTION" ? "měsíčně" : "jednorázově"}
        {typeof product.limits.durationDays === "number"
          ? ` · ${product.limits.durationDays} dní`
          : null}
        {typeof product.limits.maxActiveListings === "number"
          ? ` · do ${product.limits.maxActiveListings} aktivních inzerátů`
          : null}
      </p>
      <ul className="mt-4 flex-1 space-y-1.5 text-sm text-[var(--text-secondary)]">
        {product.features.slice(0, 5).map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--action-accent)] px-4 text-sm font-medium text-white hover:bg-[var(--action-accent-hover)]"
      >
        {cta}
      </Link>
    </article>
  );
}

export default function CenikPage() {
  const products = listPublicCustomerProducts();
  const byKey = Object.fromEntries(products.map((p) => [p.key, p]));
  const inquiry = publicCheckoutMode() === "inquiry";

  const listing = [
    byKey.listing_basic_30,
    byKey.listing_premium_30,
    byKey.listing_prep,
  ].filter(Boolean) as CatalogProductDef[];
  const buyer = [byKey.deep_analysis, byKey.property_search_project].filter(
    Boolean,
  ) as CatalogProductDef[];
  const firm = [
    byKey.firm_starter_monthly,
    byKey.firm_growth_monthly,
    byKey.firm_scale_monthly,
  ].filter(Boolean) as CatalogProductDef[];

  return (
    <StandardPageLayout>
      <PageHeader
        title="Ceník"
        description="Pevné ceny za zveřejnění, Premium, přípravu inzerátu a služby pro kupující. Firemní předplatné podle limitu aktivních nabídek."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Ceník" }]}
      />

      <InlineAlert tone="info" title="Jak funguje cena" className="mb-8">
        <p>{PUBLIC_PRICING_POLICY.noPercentageListingFeeCs}</p>
        <p className="mt-2">{PUBLIC_PRICING_POLICY.consumerPriceNoteCs}</p>
        {inquiry ? (
          <p className="mt-2">{PUBLIC_PRICING_POLICY.inquiryUntilReadyCs}</p>
        ) : null}
      </InlineAlert>

      <section id="inzerce" className="scroll-mt-24">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Inzerce</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Premium je celková cena včetně zveřejnění. Příprava inzerátu zveřejnění neobsahuje.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {listing.map((product) => (
            <ProductCard
              key={product.key}
              product={product}
              href={
                product.key === "listing_prep"
                  ? "/sluzby/priprava-inzeratu"
                  : "/pridat-nemovitost"
              }
              cta={inquiry ? "Nezávazně poptat" : "Pokračovat"}
            />
          ))}
        </div>
      </section>

      <section id="sluzby" className="mt-14 scroll-mt-24">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Služby pro kupující
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {buyer.map((product) => (
            <ProductCard
              key={product.key}
              product={product}
              href={
                product.key === "property_search_project"
                  ? "/sluzby/hledani-na-zadani"
                  : "/sluzby/analyza-pred-koupi"
              }
              cta="Nezávazně poptat"
            />
          ))}
        </div>
      </section>

      <section id="firmy" className="mt-14 scroll-mt-24">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Firemní předplatné
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          {PUBLIC_PRICING_POLICY.b2bPriceNoteCs} Předplatné nahrazuje základní poplatek za
          inzerát v rámci limitu — totéž zveřejnění neúčtujeme dvakrát. Premium a odborné
          služby zůstávají samostatné.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {firm.map((product) => (
            <ProductCard
              key={product.key}
              product={product}
              href="/pro-inzerenty"
              cta={inquiry ? "Nezávazně poptat" : "Vybrat tarif"}
            />
          ))}
        </div>
      </section>

      <p className="mt-10 text-xs text-[var(--text-muted)]">
        Verze ceníku {PUBLIC_PRICING_POLICY.versionKey}. Historické objednávky si zachovávají
        původní cenu ze své smlouvy.
      </p>
    </StandardPageLayout>
  );
}
