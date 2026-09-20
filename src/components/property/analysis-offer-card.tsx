"use client";

import Link from "next/link";
import { useEffect } from "react";

import { publicCheckoutMode, publicCustomerOffer } from "@/config/public-offer";
import { formatCzk } from "@/lib/format";
import { track } from "@/lib/analytics/events";

export type AnalysisOfferProperty = {
  id: string;
  slug: string;
  title: string;
  canonicalUrl: string;
  locality: string;
  askingPrice: number | null;
  currency: string;
  transactionType: string;
  propertyType: string;
  isDemo: boolean;
  layout?: string | null;
  usableArea?: number | null;
};

const SAMPLE_HREF = "/ukazky/byt-dlouhodoby-pronajem";

export function AnalysisOfferCard({
  property,
  compact = false,
}: {
  property: AnalysisOfferProperty;
  /** Side-rail subtle link variant. */
  compact?: boolean;
}) {
  const sale = property.transactionType === "SALE";
  const mode = publicCheckoutMode();
  const priceLabel = formatCzk(publicCustomerOffer.priceGrossCzk);

  useEffect(() => {
    if (compact) return;
    track({
      name: "analysis_offer_viewed",
      props: {
        propertyId: property.id,
        isDemo: property.isDemo,
        transactionType: property.transactionType === "RENT" ? "RENT" : "SALE",
      },
    });
  }, [compact, property.id, property.isDemo, property.transactionType]);

  if (!sale) {
    if (compact) return null;
    return (
      <section
        id="analyza-nabidka"
        className="scroll-mt-28 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6"
      >
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Potřebujete posoudit i pronájem?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Služba „Analýza před koupí“ je určená pro prodejní nabídky. U pronájmu
          připravíme individuální poptávku — neprodáváme ji pod stejným názvem.
        </p>
        <Link
          href="/kontakt"
          className="mt-4 inline-flex text-sm font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Nezávazně konzultovat pronájem
        </Link>
      </section>
    );
  }

  if (property.isDemo) {
    if (compact) {
      return (
        <p className="text-sm text-[var(--text-secondary)]">
          Ukázková nabídka —{" "}
          <Link href={SAMPLE_HREF} className="underline underline-offset-2">
            prohlédnout ukázku analýzy
          </Link>
          {" · "}
          <Link href="/sluzby/analyza-pred-koupi" className="underline underline-offset-2">
            zadat vlastní nabídku
          </Link>
        </p>
      );
    }
    return (
      <section
        id="analyza-nabidka"
        className="scroll-mt-28 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6"
      >
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Vyplatí se tato nemovitost?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Toto je ukázkový inzerát. Placenou analýzu nelze objednat k neexistující
          nabídce. Prohlédněte si ukázku výstupu, nebo zadejte vlastní skutečnou
          nemovitost.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={SAMPLE_HREF}
            className="inline-flex h-11 items-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-[var(--text-inverse)]"
          >
            Prohlédnout ukázku analýzy
          </Link>
          <Link
            href="/sluzby/analyza-pred-koupi#poptavka"
            className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-medium"
          >
            Zadat vlastní nabídku
          </Link>
        </div>
      </section>
    );
  }

  const inquiryHref = buildInquiryHref(property);
  const checkoutHref = `/checkout?product=deep_analysis&propertyId=${encodeURIComponent(property.id)}`;
  const primaryHref = mode === "checkout" ? checkoutHref : inquiryHref;
  const primaryLabel =
    mode === "checkout"
      ? "Objednat analýzu této nemovitosti"
      : "Poptat analýzu této nemovitosti";

  if (compact) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        <Link
          href={primaryHref}
          className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
          onClick={() =>
            track({
              name: "analysis_offer_cta_clicked",
              props: {
                propertyId: property.id,
                cta: "primary",
                mode,
              },
            })
          }
        >
          {primaryLabel}
        </Link>
        <span className="text-[var(--text-muted)]"> · {priceLabel}</span>
      </p>
    );
  }

  return (
    <section
      id="analyza-nabidka"
      className="scroll-mt-28 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 sm:p-8"
    >
      <h2 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
        Vyplatí se tato nemovitost?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
        Nechte si před koupí posoudit cenu, celkové náklady a rizika této nabídky.
        Získáte přehled, co je doložené a co ještě ověřit.
      </p>
      <ul className="mt-5 grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
        <li>Posouzení ceny podle dostupných podkladů.</li>
        <li>Celkové pořizovací a měsíční náklady.</li>
        <li>Scénáře financování a případného pronájmu.</li>
        <li>Rizika a otázky před rozhodnutím.</li>
      </ul>
      <p className="mt-5 font-metric text-xl text-[var(--text-primary)]">
        {priceLabel}
        <span className="ml-2 text-sm font-sans font-normal text-[var(--text-muted)]">
          {publicCustomerOffer.billingCs}
        </span>
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Termín dodání potvrdíme po přijetí potřebných podkladů — nezačíná odesláním
        formuláře.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="inline-flex h-11 items-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-[var(--text-inverse)]"
          onClick={() =>
            track({
              name: "analysis_offer_cta_clicked",
              props: {
                propertyId: property.id,
                cta: "primary",
                mode,
              },
            })
          }
        >
          {primaryLabel}
        </Link>
        <Link
          href={SAMPLE_HREF}
          className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium"
          onClick={() =>
            track({
              name: "analysis_offer_cta_clicked",
              props: {
                propertyId: property.id,
                cta: "sample",
                mode,
              },
            })
          }
        >
          Prohlédnout ukázku analýzy
        </Link>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Kontakt na inzerenta zůstává hlavní akcí u nabídky. Analýza odděluje tvrzení
        inzerenta, ověřené podklady a modelové předpoklady.
      </p>
    </section>
  );
}

function buildInquiryHref(property: AnalysisOfferProperty): string {
  const params = new URLSearchParams({
    propertyId: property.id,
    title: property.title.slice(0, 120),
    url: property.canonicalUrl,
    locality: property.locality.slice(0, 120),
    transactionType: property.transactionType,
    propertyType: property.propertyType,
  });
  if (property.askingPrice != null) {
    params.set("price", String(property.askingPrice));
    params.set("currency", property.currency || "CZK");
  }
  if (property.layout) params.set("layout", property.layout);
  if (property.usableArea != null) params.set("area", String(property.usableArea));
  return `/sluzby/analyza-pred-koupi?${params.toString()}#poptavka`;
}
