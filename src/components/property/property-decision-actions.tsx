"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Columns2, Heart, Share2 } from "lucide-react";

import { PropertyPriceBlock } from "@/components/property/property-price-block";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import type { PublicPriceHistoryPoint } from "@/domains/properties/service/dto";
import {
  isFavourite,
  toggleFavourite,
  type FavouriteItem,
} from "@/domains/properties/search/favourites";
import {
  isInCompareTray,
  toggleCompareItem,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";
import { cn } from "@/lib/utils";

const PENDING_FAVOURITE_KEY = "majetio.pendingFavourite.v1";

function toFavourite(item: {
  id: string;
  slug: string;
  title: string;
  href: string;
}): FavouriteItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    href: item.href,
  };
}

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
}) {
  const router = useRouter();
  const href = `/nemovitosti/${property.slug}`;
  const favItem = toFavourite({
    id: property.id,
    slug: property.slug,
    title: property.title,
    href,
  });
  const compareItem = toCompare({
    id: property.id,
    slug: property.slug,
    title: property.title,
    href,
    priceCzk: property.askingPrice,
    location: property.locationLabel,
  });

  const [saved, setSaved] = React.useState(false);
  const [compared, setCompared] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [shareHint, setShareHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSaved(isFavourite(property.id) || isFavourite(property.slug));
    setCompared(isInCompareTray(property.id));

    async function completePendingFavourite() {
      try {
        const raw = sessionStorage.getItem(PENDING_FAVOURITE_KEY);
        if (!raw) return;
        const pending = JSON.parse(raw) as FavouriteItem;
        if (pending.id !== property.id && pending.slug !== property.slug) return;
        sessionStorage.removeItem(PENDING_FAVOURITE_KEY);
        const result = await toggleFavourite(pending);
        if (result.ok && result.added) {
          setSaved(true);
          setToast("Přidáno do oblíbených");
        }
      } catch {
        sessionStorage.removeItem(PENDING_FAVOURITE_KEY);
      }
    }
    void completePendingFavourite();

    const sync = () => {
      setSaved(isFavourite(property.id) || isFavourite(property.slug));
      setCompared(isInCompareTray(property.id));
    };
    window.addEventListener("majetio:favourites-changed", sync);
    window.addEventListener("majetio:compare-changed", sync);
    return () => {
      window.removeEventListener("majetio:favourites-changed", sync);
      window.removeEventListener("majetio:compare-changed", sync);
    };
  }, [property.id, property.slug]);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function onSave() {
    const result = await toggleFavourite(favItem);
    if (!result.ok) {
      sessionStorage.setItem(PENDING_FAVOURITE_KEY, JSON.stringify(favItem));
      router.push(result.loginUrl);
      return;
    }
    setSaved(result.added);
    setToast(result.added ? "Přidáno do oblíbených" : "Odebráno z oblíbených");
  }

  function onCompare() {
    const result = toggleCompareItem(compareItem);
    if (!result.ok) {
      setToast("Porovnání je plné (max 4). Odeberte položku.");
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
  const financeHref = `/kalkulacky/financovani`;

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

        <div className="flex flex-col gap-2">
          <ButtonLink href={analyzeHref}>Analyzovat nemovitost</ButtonLink>
          <ButtonLink href={financeHref} variant="secondary">
            Spočítat financování
          </ButtonLink>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-4">
          <Button
            type="button"
            size="sm"
            variant={saved ? "secondary" : "outline"}
            onClick={() => void onSave()}
            leftIcon={
              <Heart
                className={cn(saved && "fill-current text-[var(--status-error)]")}
                aria-hidden
              />
            }
          >
            {saved ? "Uloženo" : "Uložit"}
          </Button>
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
          <IconButton
            type="button"
            label={saved ? "Odebrat z oblíbených" : "Uložit do oblíbených"}
            variant={saved ? "secondary" : "outline"}
            size="icon"
            onClick={() => void onSave()}
          >
            <Heart
              className={cn("size-5", saved && "fill-current text-[var(--status-error)]")}
            />
          </IconButton>
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
