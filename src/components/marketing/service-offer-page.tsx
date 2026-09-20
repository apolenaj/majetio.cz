import Link from "next/link";

import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { formatCzk } from "@/components/marketing/format";
import { InlineAlert } from "@/components/feedback/states";
import {
  getCatalogProductByKey,
  type CatalogProductDef,
} from "@/config/pricing-architecture";
import {
  priceGrossCzkFromMinor,
  PUBLIC_PRICING_POLICY,
  publicCheckoutMode,
} from "@/config/public-offer";

export function ServiceOfferPage({
  productKey,
  title,
  description,
  forWhom,
  deliverables,
  inputs,
  timeline,
  revisions,
  sampleHref,
  ctaHref,
  ctaLabel,
  breadcrumbs,
}: {
  productKey: string;
  title: string;
  description: string;
  forWhom: string[];
  deliverables: string[];
  inputs: string[];
  timeline: string;
  revisions: string;
  sampleHref?: string;
  ctaHref: string;
  ctaLabel: string;
  breadcrumbs: Array<{ href?: string; label: string }>;
}) {
  const product = getCatalogProductByKey(productKey) as CatalogProductDef | null;
  const czk = priceGrossCzkFromMinor(product?.priceGrossMinor);
  const inquiry = publicCheckoutMode() === "inquiry";

  return (
    <StandardPageLayout>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-xl">Pro koho je služba</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-secondary)]">
              {forWhom.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl">Co dostanete</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-secondary)]">
              {deliverables.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl">Jaké podklady dodáte</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-secondary)]">
              {inputs.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl">Termín a revize</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{timeline}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{revisions}</p>
          </section>
        </div>

        <aside className="h-fit rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Cena
          </p>
          {czk != null ? (
            <p className="mt-2 font-display text-3xl text-[var(--text-primary)]">
              {formatCzk(czk)}
            </p>
          ) : (
            <p className="mt-2 text-sm">Individuálně</p>
          )}
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {product?.billingType === "SUBSCRIPTION" ? "měsíčně" : "jednorázově"} ·{" "}
            {PUBLIC_PRICING_POLICY.consumerPriceNoteCs}
          </p>
          {inquiry ? (
            <InlineAlert tone="info" className="mt-4" title="Nezávazná poptávka">
              {PUBLIC_PRICING_POLICY.inquiryUntilReadyCs}
            </InlineAlert>
          ) : null}
          <Link
            href={ctaHref}
            className="mt-4 flex h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white"
          >
            {ctaLabel}
          </Link>
          {sampleHref ? (
            <Link
              href={sampleHref}
              className="mt-2 flex h-11 items-center justify-center rounded-lg border border-[var(--border-default)] px-4 text-sm font-medium"
            >
              Ukázka výstupu
            </Link>
          ) : null}
          <Link
            href="/cenik"
            className="mt-3 block text-center text-sm underline underline-offset-2"
          >
            Zpět na ceník
          </Link>
        </aside>
      </div>
    </StandardPageLayout>
  );
}
