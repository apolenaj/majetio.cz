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

export const metadata: Metadata = preparePageMeta({
  title: "Pro inzerenty",
  description:
    "Zveřejněte nabídku za pevnou cenu. Premium zvýraznění, profesionální příprava a firemní limity — bez procentní provize z prodeje za běžnou inzerci.",
  path: "/pro-inzerenty",
});

export default function ProInzerentyPage() {
  const products = listPublicCustomerProducts();
  const listing = products.filter((p) =>
    ["listing_basic_30", "listing_premium_30", "listing_prep"].includes(p.key),
  );
  const firm = products.filter((p) => p.key.startsWith("firm_"));
  const inquiry = publicCheckoutMode() === "inquiry";

  return (
    <StandardPageLayout>
      <PageHeader
        title="Pro inzerenty"
        description="Soukromí majitelé, makléři, kanceláře i developeři — pevná cena za zveřejnění, ne procento z prodeje."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Pro inzerenty" },
        ]}
      />

      <InlineAlert tone="info" title="Obchodní model" className="mb-8">
        <p>{PUBLIC_PRICING_POLICY.noPercentageListingFeeCs}</p>
        <p className="mt-2">
          Partnerské odměny za kvalifikované poptávky řešíme individuálně a odděleně od
          standardní inzerce.
        </p>
        {inquiry ? (
          <p className="mt-2">{PUBLIC_PRICING_POLICY.inquiryUntilReadyCs}</p>
        ) : null}
      </InlineAlert>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/pridat-nemovitost"
          className="inline-flex h-11 items-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white"
        >
          Přidat nemovitost
        </Link>
        <Link
          href="/registrace"
          className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium"
        >
          Vytvořit účet
        </Link>
        <Link
          href="/cenik#inzerce"
          className="inline-flex h-11 items-center rounded-lg border border-[var(--border-default)] px-5 text-sm font-medium"
        >
          Zobrazit ceník
        </Link>
      </div>

      <h2 className="mt-12 font-display text-2xl">Inzerce za pevnou cenu</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {listing.map((product) => {
          const czk = priceGrossCzkFromMinor(product.priceGrossMinor);
          return (
            <li
              key={product.key}
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4"
            >
              <p className="font-medium text-[var(--text-primary)]">{product.nameCs}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{product.taglineCs}</p>
              {czk != null ? (
                <p className="mt-3 font-display text-2xl">{formatCzk(czk)}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <h2 className="mt-12 font-display text-2xl">Firemní limity</h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
        Předplatné nahrazuje základní poplatek za inzerát v rámci limitu. Premium a příprava
        inzerátu se kupují zvlášť.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {firm.map((product) => {
          const czk = priceGrossCzkFromMinor(product.priceGrossMinor);
          const limit = product.limits.maxActiveListings;
          return (
            <li
              key={product.key}
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4"
            >
              <p className="font-medium text-[var(--text-primary)]">{product.nameCs}</p>
              {czk != null ? (
                <p className="mt-2 font-display text-2xl">
                  {formatCzk(czk)}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / měsíc</span>
                </p>
              ) : null}
              {typeof limit === "number" ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Do {limit} aktivních inzerátů
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-sm text-[var(--text-muted)]">
        Detailní popis a CTA najdete na{" "}
        <Link href="/cenik" className="underline underline-offset-2">
          ceníku
        </Link>
        .
      </p>
    </StandardPageLayout>
  );
}
