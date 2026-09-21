"use client";

import * as React from "react";
import { Columns2, Share2 } from "lucide-react";

import { FinancingSummary } from "@/components/financing/financing-summary";
import { SavePropertyControl } from "@/components/favourites/save-property-control";
import { PropertyPriceBlock } from "@/components/property/property-price-block";
import { ReportListingDialog } from "@/components/property/report-listing-dialog";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { comparisonConfig } from "@/config/comparison";
import type { PublicPriceHistoryPoint } from "@/domains/properties/service/dto";
import { FAVOURITES_CHANGED_EVENT } from "@/domains/favourites/guest-storage";
import {
  COMPARE_CHANGED_EVENT,
  isInCompareTray,
  toggleCompareItem,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";
import { mortgageLeadFinancingPageHref } from "@/domains/leads/service/user-messaging";
import type { MortgageLeadDuplicateInfo } from "@/domains/leads/schemas/mortgage-lead";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import { cn } from "@/lib/utils";

function toCompare(item: {
  id: string;
  slug: string;
  title: string;
  href: string;
  priceCzk: number | null;
  location: string;
}): CompareTrayItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    href: item.href,
    priceCzk: item.priceCzk ?? undefined,
    location: item.location,
  };
}

export function PropertyDecisionActions({
  property,
  activeFinancingLead = null,
}: {
  property: {
    id: string;
    slug: string;
    title: string;
    askingPrice: number | null;
    pricePerSqm: number | null;
    priceHistory: PublicPriceHistoryPoint[];
    locationLabel: string;
    isDemo: boolean;
  };
  activeFinancingLead?: MortgageLeadDuplicateInfo | null;
}) {
  const href = `/nemovitosti/${property.slug}`;
  const saveItem = {
    propertyId: property.id,
    slug: property.slug,
    title: property.title,
    href,
    priceCzk: property.askingPrice,
  };
  const compareItem = toCompare({
    id: property.id,
    slug: property.slug,
    title: property.title,
    href,
    priceCzk: property.askingPrice,
    location: property.locationLabel,
  });

  const [compared, setCompared] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [shareHint, setShareHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCompared(isInCompareTray(property.id));
    const sync = () => setCompared(isInCompareTray(property.id));
    window.addEventListener(COMPARE_CHANGED_EVENT, sync);
    window.addEventListener(FAVOURITES_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener(COMPARE_CHANGED_EVENT, sync);
      window.removeEventListener(FAVOURITES_CHANGED_EVENT, sync);
    };
  }, [property.id]);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  function onCompare() {
    const result = toggleCompareItem(compareItem);
    if (!result.ok) {
      setToast(comparisonConfig.trayFullMessageCs);
      return;
    }
    setCompared(result.added);
    setToast(result.added ? "Přidáno do porovnání" : "Odebráno z porovnání");
  }

  async function onShare() {
    const url =
      typeof window !== "undefined" ? window.location.href : href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint("Odkaz zkopírován");
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      setShareHint("Sdílení se nepodařilo");
      window.setTimeout(() => setShareHint(null), 2500);
    }
  }

  const analyzeHref = `/analyza?nemovitost=${encodeURIComponent(property.slug)}`;
  const financeHref = activeFinancingLead
    ? mortgageLeadFinancingPageHref(activeFinancingLead.correlationId)
    : `#financovani`;
  const financeLabel = activeFinancingLead
    ? "Zobrazit stav financování"
    : "Zjistit financování";

  return (
    <>
      {/* Desktop sticky cockpit */}
      <Card
        elevation="raised"
        className="hidden space-y-5 lg:block"
        padding="lg"
      >
        <PropertyPriceBlock
          askingPrice={property.askingPrice}
          pricePerSqm={property.pricePerSqm}
          priceHistory={property.priceHistory}
          compact
        />

        {property.askingPrice != null && property.askingPrice > 0 ? (
          <FinancingSummary
            propertyPriceCzk={property.askingPrice}
            propertyUrl={`${getSiteOrigin()}${href}`}
            variant="compact"
            sourceContext="property_detail"
          />
        ) : null}

        <div className="flex flex-col gap-2">
          <ButtonLink href={analyzeHref}>Analyzovat nemovitost</ButtonLink>
          <ButtonLink href={financeHref} variant="secondary">
            {financeLabel}
          </ButtonLink>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-4">
          <SavePropertyControl
            item={saveItem}
            variant="button"
            size="sm"
            onToast={setToast}
          />
          <Button
            type="button"
            size="sm"
            variant={compared ? "secondary" : "outline"}
            onClick={onCompare}
            leftIcon={<Columns2 aria-hidden />}
          >
            {compared ? "V porovnání" : "Porovnat"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void onShare()}
            leftIcon={<Share2 aria-hidden />}
          >
            Sdílet
          </Button>
          <ReportListingDialog
            propertyId={property.id}
            propertyTitle={property.title}
          />
        </div>
        {shareHint ? (
          <p className="text-xs text-[var(--text-muted)]" role="status">
            {shareHint}
          </p>
        ) : null}
        {property.isDemo ? (
          <p className="text-xs text-[var(--text-muted)]">
            Demo data — CTA vedou na připravené nástroje bez falešného úspěchu.
          </p>
        ) : null}
      </Card>

      {/* Mobile sticky: primary + save */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[35] border-t border-[var(--border-default)]",
          "bg-[var(--surface-primary)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          "lg:hidden",
        )}
      >
        <div className="flex items-center gap-2">
          <ButtonLink href={analyzeHref} className="min-w-0 flex-1" size="md">
            Analyzovat
          </ButtonLink>
          <SavePropertyControl
            item={saveItem}
            variant="icon"
            size="icon"
            onToast={setToast}
          />
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[40] max-w-sm -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-2 text-sm shadow-[var(--shadow-overlay)] lg:bottom-8"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
