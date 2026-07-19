"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";

import {
  PropertyCard,
  type PropertyCardData,
} from "@/components/property/property-card";
import { PropertySearchEmptyState } from "@/components/property/search/property-search-empty";
import { SaveSearchButton } from "@/components/property/search/save-search-button";
import { CompareTray } from "@/components/navigation/mobile-nav";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import {
  COMPARE_MAX,
  isInCompareTray,
  readCompareTray,
  toggleCompareItem,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";
import {
  isFavourite,
  toggleFavourite,
} from "@/domains/properties/search/favourites";
import { restoreSearchScrollPosition } from "@/domains/properties/search/scroll-restore";
import {
  buildPropertySearchHref,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/events";

function slugFromHref(href: string): string {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
}

function cardToCompareItem(property: PropertyCardData): CompareTrayItem {
  const slug = property.slug ?? slugFromHref(property.href);
  return {
    id: property.id ?? slug,
    slug,
    title: property.title,
    href: property.href,
    priceCzk: property.priceCzk,
    location: property.location,
  };
}

export function PropertySearchResultsHeader({
  count,
  sortLabel,
  className,
  actions,
}: {
  count: number;
  sortLabel: string;
  className?: string;
  actions?: React.ReactNode;
}) {
  const label =
    count === 1
      ? "nemovitost odpovídá"
      : count >= 2 && count <= 4
        ? "nemovitosti odpovídají"
        : "nemovitostí odpovídá";

  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-default)] pb-4",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-xl text-[var(--text-primary)] sm:text-2xl">
          {count} {label} vašemu hledání
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Řazení: {sortLabel}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function PropertySearchResults({
  properties,
  state,
  sortLabel,
  relaxedCount,
  isAuthenticated = false,
  showPassportCta = false,
}: {
  properties: PropertyCardData[];
  state: PropertyUrlFilterState;
  sortLabel: string;
  relaxedCount?: number | null;
  isAuthenticated?: boolean;
  showPassportCta?: boolean;
}) {
  const router = useRouter();
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [favouriteIds, setFavouriteIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    restoreSearchScrollPosition();
    const sync = () => {
      setCompareIds(readCompareTray().map((c) => c.id));
      setFavouriteIds(
        properties
          .map((p) => p.id ?? p.slug ?? slugFromHref(p.href))
          .filter((id) => isFavourite(id)),
      );
    };
    sync();
    window.addEventListener("majetio:compare-changed", sync);
    window.addEventListener("majetio:favourites-changed", sync);
    return () => {
      window.removeEventListener("majetio:compare-changed", sync);
      window.removeEventListener("majetio:favourites-changed", sync);
    };
  }, [properties]);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleFavourite(property: PropertyCardData) {
    const item = cardToCompareItem(property);
    const result = await toggleFavourite(item);
    if (!result.ok) {
      router.push(result.loginUrl);
      return;
    }
    setFavouriteIds((prev) => {
      if (result.added) return [...new Set([...prev, item.id])];
      return prev.filter((id) => id !== item.id);
    });
    track({
      name: "property_saved",
      props: {
        action: result.added ? "add" : "remove",
        is_demo: Boolean(property.isDemo),
      },
    });
    setToast(result.added ? "Přidáno do oblíbených" : "Odebráno z oblíbených");
  }

  function handleCompare(property: PropertyCardData) {
    const result = toggleCompareItem(cardToCompareItem(property));
    setCompareIds(result.items.map((c) => c.id));
    if (!result.ok) {
      setToast(`Porovnání je plné (max ${COMPARE_MAX}). Odeberte položku.`);
      return;
    }
    track({
      name: "property_compared",
      props: {
        action: result.added ? "add" : "remove",
        tray_count: result.items.length,
      },
    });
    setToast(result.added ? "Přidáno do porovnání" : "Odebráno z porovnání");
  }

  const compareCount = compareIds.length;
  const relaxedHref =
    state.cenaDo != null
      ? buildPropertySearchHref({
          ...state,
          cenaDo: Math.round(state.cenaDo * 1.25),
          stranka: 1,
        })
      : null;

  const passportHref = isAuthenticated
    ? "/ucet/financni-profil"
    : buildLoginUrl("/ucet/financni-profil");

  return (
    <div className="mt-6 space-y-6">
      <PropertySearchResultsHeader
        count={properties.length}
        sortLabel={sortLabel}
        actions={
          <SaveSearchButton state={state} isAuthenticated={isAuthenticated} />
        }
      />

      {showPassportCta ? (
        <InlineAlert tone="info" title="Doplňte Finanční pas">
          Řazení „Doporučené“ potřebuje alespoň rozpočet, lokalitu nebo typ
          nemovitosti ve Finančním pasu.{" "}
          <Link
            href={passportHref}
            className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            Doplnit Finanční pas
          </Link>
        </InlineAlert>
      ) : null}

      {properties.length === 0 ? (
        <div>
          <PropertySearchEmptyState state={state} relaxedCount={relaxedCount} />
          {relaxedHref && relaxedCount != null && relaxedCount > 0 ? (
            <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
              Tip:{" "}
              <Link
                href={relaxedHref}
                className="text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                zvýšením rozpočtu o cca 25&nbsp;% získáte {relaxedCount} nabídek
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const id = property.id ?? property.slug ?? slugFromHref(property.href);
            return (
              <PropertyCard
                key={property.href}
                property={property}
                isFavourite={favouriteIds.includes(id) || isFavourite(id)}
                isCompared={compareIds.includes(id) || isInCompareTray(id)}
                onFavourite={() => void handleFavourite(property)}
                onCompare={() => handleCompare(property)}
              />
            );
          })}
        </div>
      )}

      <CompareTray
        count={compareCount}
        onOpen={() => router.push("/porovnani")}
        className="lg:bottom-6"
      />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[40] max-w-sm -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-2 text-sm shadow-[var(--shadow-overlay)]"
        >
          {toast}
          {compareCount > 0 && toast.includes("porovnání") ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="ml-2"
              onClick={() => router.push("/porovnani")}
            >
              Otevřít
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
