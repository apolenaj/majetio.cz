"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import {
  buildMortgageOfferTermsUrl,
  filterDisplayableMortgageOffers,
  formatOfferRatePp,
  MORTGAGE_OFFER_SORT_LABELS,
  offerFreshness,
  sortMortgageOffers,
  type MortgageOfferSortKey,
} from "@/domains/financing/mortgage-offer-catalog";
import type { CanonicalMortgageOffer, MortgageFreshness } from "@/integrations/hypotekajasne/schemas";
import { MortgageFreshnessBadge } from "@/components/financing/mortgage-offer-display";
import { InlineAlert } from "@/components/feedback/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatCsDateTime(d: Date): string {
  return d.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OfferCard({
  offer,
  isSelected,
  isCompareSelected,
  compareDisabled,
  onSelect,
  onToggleCompare,
}: {
  offer: CanonicalMortgageOffer;
  isSelected: boolean;
  isCompareSelected: boolean;
  compareDisabled: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
}) {
  const freshness = offerFreshness(offer);
  const termsUrl = buildMortgageOfferTermsUrl(offer);

  return (
    <Card
      variant={isSelected ? "selected" : "interactive"}
      padding="md"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            {offer.bankName}
          </p>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            {offer.productName}
          </h4>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {offer.isSponsored ? (
            <Badge tone="warning">Sponzorováno</Badge>
          ) : null}
          {isSelected ? <Badge tone="info">Modelování</Badge> : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-[var(--text-muted)]">Sazba od</dt>
          <dd className="font-semibold tabular-nums">
            {formatOfferRatePp(offer.interestRateFrom)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">RPSN od</dt>
          <dd className="font-semibold tabular-nums">
            {offer.aprFrom != null ? formatOfferRatePp(offer.aprFrom) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Fixace</dt>
          <dd className="font-medium">
            {offer.fixationYears != null
              ? `${offer.fixationYears} let`
              : "Neuvedeno"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Max. LTV</dt>
          <dd className="font-medium tabular-nums">
            {offer.ltvMaxPct != null ? `${offer.ltvMaxPct}\u00a0%` : "—"}
          </dd>
        </div>
      </dl>

      <div className="rounded-[var(--radius-sm)] bg-[var(--background-secondary)] px-3 py-2 text-xs text-[var(--text-muted)] space-y-1">
        <p>
          Zdroj: <span className="text-[var(--text-secondary)]">HypotekaJasne.cz</span>
        </p>
        <p>Aktualizace: {formatCsDateTime(offer.retrievedAt)}</p>
        {offer.verifiedAt ? (
          <p>Ověření: {formatCsDateTime(offer.verifiedAt)}</p>
        ) : (
          <p>Ověření: zatím neověřeno v tomto cyklu</p>
        )}
        <MortgageFreshnessBadge freshness={freshness} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant={isSelected ? "secondary" : "primary"}
          size="sm"
          className="flex-1"
          onClick={onSelect}
        >
          {isSelected ? "Použito ve scénáři" : "Použít sazbu ve scénáři"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={compareDisabled}
          aria-pressed={isCompareSelected}
          onClick={onToggleCompare}
        >
          {isCompareSelected ? "Odebrat z porovnání" : "Porovnat"}
        </Button>
        <ButtonLink
          href={termsUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="sm"
          className="flex-1"
        >
          <ExternalLink className="size-4" aria-hidden />
          Zobrazit podmínky
        </ButtonLink>
      </div>

      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        Inzerovaná sazba — platí při splnění podmínek banky. RPSN zahrnuje úrok a
        poplatky uvedené ve zdroji. Nejde o personalizovanou nabídku.
      </p>
    </Card>
  );
}

export function MortgageOfferCatalogSection({
  offers,
  globalFreshness,
  selectedOfferId,
  compareOfferIds,
  sortKey,
  onSortKeyChange,
  onSelectOffer,
  onToggleCompareOffer,
  className,
}: {
  offers: CanonicalMortgageOffer[];
  globalFreshness?: MortgageFreshness | null;
  selectedOfferId: string | null;
  compareOfferIds: string[];
  sortKey: MortgageOfferSortKey;
  onSortKeyChange: (key: MortgageOfferSortKey) => void;
  onSelectOffer: (offerId: string) => void;
  onToggleCompareOffer: (offerId: string) => void;
  className?: string;
}) {
  const displayable = React.useMemo(
    () => sortMortgageOffers(filterDisplayableMortgageOffers(offers), sortKey),
    [offers, sortKey],
  );

  const compareAtMax = compareOfferIds.length >= 4;

  return (
    <section
      aria-labelledby="mortgage-rates-heading"
      className={cn("space-y-4", className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3
            id="mortgage-rates-heading"
            className="text-base font-semibold text-[var(--text-primary)]"
          >
            Aktuální hypoteční sazby
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Zobrazujeme aktivní a čerstvé nabídky. Řazení je transparentní — žádné
            skryté „nejlepší“ označení podle úroku.
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Řazení</span>
          <select
            className="w-full min-w-[12rem] rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as MortgageOfferSortKey)}
          >
            {(Object.keys(MORTGAGE_OFFER_SORT_LABELS) as MortgageOfferSortKey[]).map(
              (key) => (
                <option key={key} value={key}>
                  {MORTGAGE_OFFER_SORT_LABELS[key]}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {globalFreshness ? (
        <InlineAlert tone={globalFreshness.isStale ? "warning" : "info"}>
          {globalFreshness.label}. Zdroj dat: HypotekaJasne.cz.
        </InlineAlert>
      ) : null}

      {displayable.length === 0 ? (
        <Card variant="muted" padding="md">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Aktuální sazby nejsou k dispozici
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Zobrazíme poslední ověřenou sazbu ze scénáře, dokud nebude feed opět
            dostupný. Majetio nezobrazuje fiktivní 0&nbsp;%.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {displayable.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isSelected={selectedOfferId === offer.id}
              isCompareSelected={compareOfferIds.includes(offer.id)}
              compareDisabled={compareAtMax && !compareOfferIds.includes(offer.id)}
              onSelect={() => onSelectOffer(offer.id)}
              onToggleCompare={() => onToggleCompareOffer(offer.id)}
            />
          ))}
        </div>
      )}

      {compareOfferIds.length > 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          Vybráno k porovnání: {compareOfferIds.length}/4
          {compareOfferIds.length < 2 ? " (min. 2 nabídky)" : ""}
        </p>
      ) : null}
    </section>
  );
}
