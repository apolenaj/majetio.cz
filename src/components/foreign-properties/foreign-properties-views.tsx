"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, MapPinned } from "lucide-react";

import { FinancingSummary } from "@/components/financing/financing-summary";
import { HypotekaJasneCTA } from "@/components/financing/hypotekajasne-cta";
import {
  FOREIGN_COUNTRIES,
  FOREIGN_LISTINGS,
  PURPOSE_LABEL,
  type ForeignListing,
  type ForeignPurpose,
} from "@/content/foreign-properties";
import { approximateCzkFromLocal } from "@/config/foreign-fx-assumptions";
import { formatCzk } from "@/lib/format";

const PURPOSE_FILTERS: { id: "all" | ForeignPurpose; label: string }[] = [
  { id: "all", label: "Všechny účely" },
  { id: "bydleni", label: "Bydlení" },
  { id: "investice", label: "Investice" },
  { id: "rekreace", label: "Rekreace" },
];

function formatLocal(amount: number, currency: string) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function czkLine(listing: ForeignListing) {
  if (listing.priceCzkApprox != null) {
    return {
      czk: listing.priceCzkApprox,
      note: "Orientační přepočet",
    };
  }
  const approx = approximateCzkFromLocal({
    amount: listing.priceLocal,
    currency: listing.currency,
  });
  if (!approx) return null;
  return {
    czk: approx.czk,
    note: `Orientační přepočet · ${approx.sourceLabel} · ${approx.asOf}`,
  };
}

export function ForeignPropertiesHub() {
  const [country, setCountry] = useState<string>("all");
  const [purpose, setPurpose] = useState<"all" | ForeignPurpose>("all");

  const listings = useMemo(() => {
    return FOREIGN_LISTINGS.filter((item) => {
      if (country !== "all" && item.countrySlug !== country) return false;
      if (purpose !== "all" && item.purpose !== purpose) return false;
      return true;
    });
  }, [country, purpose]);

  return (
    <div className="ho-surface">
      <section className="ho-hero">
        <div className="ho-hero-inner">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0D9A92]">
            Zahraniční nabídky
          </p>
          <h1>Nemovitosti za hranicemi</h1>
          <p className="ho-hero-lead">
            Objevte bydlení a investiční příležitosti v zahraničí s přehledem o
            ceně, nákladech a specifikách místního trhu.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/nemovitosti" className="ho-btn-ghost">
              ← České nemovitosti
            </Link>
            <Link href="/moznosti" className="ho-btn-ghost">
              Další možnosti bydlení
            </Link>
          </div>
        </div>
      </section>

      <div className="ho-body">
        <section className="ho-section" style={{ marginTop: 0 }}>
          <h2>Vyberte zemi</h2>
          <p>
            Filtry jsou oddělené od českého marketplace — bez mapy krajů ČR.
          </p>
          <div className="ho-benefits mt-4">
            {FOREIGN_COUNTRIES.map((c) => (
              <Link
                key={c.slug}
                href={`/zahranicni-nemovitosti/${c.slug}`}
                className="ho-benefit"
              >
                <strong>{c.name}</strong>
                <span>{c.heroNote}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="ho-section" aria-labelledby="fp-filters">
          <h2 id="fp-filters">Filtry zahraničních nabídek</h2>
          <div className="tools-filters mt-3" role="toolbar" aria-label="Země">
            <button
              type="button"
              className="tools-filter"
              aria-pressed={country === "all"}
              onClick={() => setCountry("all")}
            >
              Všechny země
            </button>
            {FOREIGN_COUNTRIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                className="tools-filter"
                aria-pressed={country === c.slug}
                onClick={() => setCountry(c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="tools-filters" role="toolbar" aria-label="Účel">
            {PURPOSE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tools-filter"
                aria-pressed={purpose === item.id}
                onClick={() => setPurpose(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="ho-section" aria-labelledby="fp-list">
          <h2 id="fp-list">Modelové nabídky</h2>
          <p>
            Ukázkové scénáře — ne živé inzeráty. Ceny v lokální měně a orientační
            CZK.
          </p>
          <div className="ho-grid mt-4">
            {listings.map((listing) => (
              <ForeignListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {listings.length === 0 ? (
            <p className="mt-4 text-sm text-[#667A86]">
              Pro zvolené filtry zatím nemáme modelovou nabídku.
            </p>
          ) : null}
        </section>

        <section className="ho-section">
          <h2>Financování zahraniční nemovitosti</h2>
          <p>
            Financování zahraniční nemovitosti se může lišit podle země, typu
            nemovitosti, rezidence kupujícího a způsobu zajištění. Nejde o
            příslib české hypotéky.
          </p>
          <div className="mt-4">
            <HypotekaJasneCTA
              sourceContext="foreign_property"
              label="Zjistit možnosti financování"
            />
          </div>
        </section>

        <p className="ho-disclaimer">
          Uvedené nabídky a přepočty jsou modelové / orientační. Nejde o aktuální
          nabídky ani právní, daňové či finanční doporučení.
        </p>
      </div>
    </div>
  );
}

function ForeignListingCard({ listing }: { listing: ForeignListing }) {
  const country = FOREIGN_COUNTRIES.find((c) => c.slug === listing.countrySlug);
  const czk = czkLine(listing);
  const href = `/zahranicni-nemovitosti/${listing.countrySlug}/${listing.slug}`;

  return (
    <article className="ho-card">
      <Link href={href} className="ho-card-media block" aria-label={listing.title}>
        <Image
          src={listing.image}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="ho-card-badge">{listing.badge}</span>
      </Link>
      <div className="ho-card-body">
        <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#667A86]">
          <MapPinned className="size-3.5" aria-hidden />
          {country?.name} · {listing.cityRegion}
        </p>
        <h3>
          <Link href={href}>{listing.title}</Link>
        </h3>
        <p className="text-sm text-[#667A86]">
          {listing.propertyType} · {PURPOSE_LABEL[listing.purpose]}
          {listing.areaM2 != null ? ` · ${listing.areaM2} m²` : ""}
        </p>
        <p className="mt-2 text-lg font-semibold text-[#0C3551]">
          {formatLocal(listing.priceLocal, listing.currency)}
        </p>
        {czk ? (
          <p className="text-sm text-[#667A86]">
            ≈ {formatCzk(czk.czk)}
            <span className="block text-xs">{czk.note}</span>
          </p>
        ) : null}
        <Link href={href} className="mt-3 inline-flex text-sm font-semibold text-[#0D9A92]">
          Detail nabídky →
        </Link>
      </div>
    </article>
  );
}

export function ForeignCountryPage({ countrySlug }: { countrySlug: string }) {
  const country = FOREIGN_COUNTRIES.find((c) => c.slug === countrySlug);
  const listings = FOREIGN_LISTINGS.filter((l) => l.countrySlug === countrySlug);
  if (!country) return null;

  return (
    <div className="ho-surface">
      <section className="ho-hero">
        <div className="ho-hero-inner">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0D9A92]">
            {country.nameEn}
          </p>
          <h1>Nemovitosti — {country.name}</h1>
          <p className="ho-hero-lead">{country.heroNote}</p>
          <Link href="/zahranicni-nemovitosti" className="ho-btn-ghost mt-4 inline-flex">
            ← Všechny zahraniční nabídky
          </Link>
        </div>
      </section>
      <div className="ho-body">
        <div className="ho-grid">
          {listings.map((listing) => (
            <ForeignListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {listings.length === 0 ? (
          <p className="text-sm text-[#667A86]">
            Pro tuto zemi zatím nemáme modelové nabídky.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ForeignListingDetail({
  listing,
  propertyUrl,
}: {
  listing: ForeignListing;
  propertyUrl: string;
}) {
  const country = FOREIGN_COUNTRIES.find((c) => c.slug === listing.countrySlug);
  const czk = czkLine(listing);
  const gallery = listing.gallery.length ? listing.gallery : [listing.image];
  const main = gallery[0]!;
  const side = gallery.slice(1, 3);
  const specs = [
    { label: "Vlastnický režim", value: listing.countrySpecifics.ownership },
    { label: "Daně a poplatky", value: listing.countrySpecifics.taxesFees },
    { label: "Financování", value: listing.countrySpecifics.financing },
    { label: "Provozní náklady", value: listing.countrySpecifics.opex },
    { label: "Měna", value: listing.countrySpecifics.currencyNote },
    { label: "Právní proces", value: listing.countrySpecifics.legalProcess },
    { label: "Správa nemovitosti", value: listing.countrySpecifics.management },
  ];

  return (
    <div className="ho-surface">
      <section className="ho-hero">
        <div className="ho-hero-inner">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0D9A92]">
            {listing.badge}
          </p>
          <h1>{listing.title}</h1>
          <p className="ho-hero-lead">
            {country?.name} · {listing.cityRegion} · {listing.propertyType}
          </p>
        </div>
      </section>

      <div className="ho-body">
        <div className="ho-detail-gallery">
          <div className="ho-detail-main-img">
            <Image src={main} alt="" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 60vw" />
            <span className="ho-card-badge">{listing.badge}</span>
          </div>
          {side.length > 0 ? (
            <div className="ho-detail-side">
              {side.map((src, i) => (
                <div key={`${src}-${i}`}>
                  <Image src={src} alt="" fill className="object-cover" sizes="30vw" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[#667A86]">
              {country?.name} · {listing.cityRegion}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#0C3551]">
              {formatLocal(listing.priceLocal, listing.currency)}
            </p>
            {czk ? (
              <p className="mt-1 text-sm text-[#667A86]">
                ≈ {formatCzk(czk.czk)} · {czk.note}
              </p>
            ) : null}
          </div>
          <Link
            href={`/zahranicni-nemovitosti/${listing.countrySlug}`}
            className="ho-btn-ghost"
          >
            ← {country?.name}
          </Link>
        </div>

        <p className="mt-4 max-w-3xl text-[0.9375rem] leading-relaxed text-[#667A86]">
          {listing.description}
        </p>

        <section className="ho-section" aria-labelledby="fp-params">
          <h2 id="fp-params">Parametry nabídky</h2>
          <div className="ho-finance">
            <div className="ho-finance-item">
              <span>Účel</span>
              <strong>{PURPOSE_LABEL[listing.purpose]}</strong>
            </div>
            <div className="ho-finance-item">
              <span>Plocha</span>
              <strong>{listing.areaM2 != null ? `${listing.areaM2} m²` : "Nutno ověřit"}</strong>
            </div>
            <div className="ho-finance-item">
              <span>Odhad nájmu</span>
              <strong>{listing.rentEstimateLabel ?? "Nutno ověřit"}</strong>
            </div>
            <div className="ho-finance-item">
              <span>Hrubý výnos (model)</span>
              <strong>{listing.yieldLabel ?? "Nutno ověřit"}</strong>
            </div>
            <div className="ho-finance-item">
              <span>Provozní náklady</span>
              <strong>{listing.opexLabel ?? "Nutno ověřit"}</strong>
            </div>
            {listing.statusHint ? (
              <div className="ho-finance-item">
                <span>Stav projektu</span>
                <strong>{listing.statusHint}</strong>
              </div>
            ) : null}
          </div>
        </section>

        <section className="ho-section" aria-labelledby="fp-country">
          <h2 id="fp-country">Specifika koupě v této zemi</h2>
          <div className="ho-finance">
            {specs.map((row) => (
              <div key={row.label} className="ho-finance-item">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="ho-section" aria-labelledby="fp-fin">
          <h2 id="fp-fin">Možnosti financování</h2>
          <p>
            Financování zahraniční nemovitosti se může lišit podle země, typu
            nemovitosti, rezidence kupujícího a způsobu zajištění.
          </p>
          {czk ? (
            <div className="mt-4">
              <FinancingSummary
                propertyPriceCzk={czk.czk}
                propertyUrl={propertyUrl}
                country={country?.nameEn ?? listing.countrySlug}
                currency={listing.currency}
                sourceContext="foreign_property"
                foreign
                variant="section"
              />
            </div>
          ) : (
            <div className="mt-4">
              <HypotekaJasneCTA
                country={country?.nameEn ?? listing.countrySlug}
                currency={listing.currency}
                propertyUrl={propertyUrl}
                sourceContext="foreign_property"
                label="Zjistit možnosti financování"
              />
              <p className="fs-brand mt-2 inline-flex items-center gap-1">
                Více možností na HypotékaJasně.cz
                <ExternalLink className="size-3" aria-hidden />
              </p>
            </div>
          )}
        </section>

        <p className="ho-disclaimer">
          Modelová nabídka. Orientační výpočty a přepočty nejsou příslibem
          financování ani právní jistoty koupě.
        </p>
      </div>
    </div>
  );
}
