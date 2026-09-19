"use client";

import Decimal from "decimal.js";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PropertyCard } from "@/components/property/search/catalog-property-card";
import { maxLoanForMonthlyPayment } from "@/domains/investment/engine/calculations/rental-decision";
import { formatCzk } from "@/lib/format";
import { catalogPropertyHref, type Property } from "@/lib/mock-properties";

const RATE = new Decimal("0.05");

function parseAmount(raw: string): Decimal | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  try {
    const value = new Decimal(cleaned);
    return value.isFinite() && value.gte(0) ? value : null;
  } catch {
    return null;
  }
}

export function CatalogBudgetList({ properties }: { properties: Property[] }) {
  const [funds, setFunds] = useState("");
  const [monthly, setMonthly] = useState("");
  const fundsValue = parseAmount(funds);
  const monthlyValue = parseAmount(monthly);
  const active = fundsValue != null && monthlyValue != null;

  const assessed = useMemo(() => {
    if (!active || fundsValue == null || monthlyValue == null) return null;
    const maxPrice = fundsValue.plus(maxLoanForMonthlyPayment(monthlyValue, RATE, 30));
    let skippedRent = 0;
    let over = 0;
    const fits: Property[] = [];
    for (const property of properties) {
      if (property.typ_transakce !== "prodej") {
        skippedRent += 1;
        continue;
      }
      if (new Decimal(property.cena).lte(maxPrice)) fits.push(property);
      else over += 1;
    }
    return { fits, skippedRent, over, maxPrice };
  }, [active, fundsValue, monthlyValue, properties]);

  return (
    <div className="space-y-4">
      <form className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
        <h2 className="font-display text-xl text-[var(--text-primary)]">Co se vejde do mého rozpočtu</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Koupě: vlastní prostředky a strop měsíční splátky. Model 5 % p.a. na 30 let. Není to schválení hypotéky.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium">Vlastní prostředky</span>
            <input
              value={funds}
              inputMode="numeric"
              onChange={(event) => setFunds(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2 font-metric"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Splátka nejvýše / měsíc</span>
            <input
              value={monthly}
              inputMode="numeric"
              onChange={(event) => setMonthly(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2 font-metric"
            />
          </label>
        </div>
        {assessed ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Strop kupní ceny {formatCzk(assessed.maxPrice.toNumber())}. Vejde se {assessed.fits.length}. Nad
            rozpočtem {assessed.over}. Pronájmy ({assessed.skippedRent}) se s koupí nesrovnávají.
          </p>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">Vyplňte obě pole, jinak se rozpočet nespočítá.</p>
        )}
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(assessed ? assessed.fits : properties).map((property) => (
          <Link
            key={property.id}
            href={catalogPropertyHref(property.id)}
            aria-label={`${property.nazev}, ${property.lokalita}`}
            className="block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {assessed ? (
              <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">
                Vejde se podle vašeho scénáře
              </p>
            ) : null}
            <PropertyCard property={property} />
          </Link>
        ))}
      </div>
    </div>
  );
}
