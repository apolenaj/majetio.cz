"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";

import {
  PropertyCard,
  type PropertyCardData,
} from "@/components/property/property-card";
import { PropertyBudgetPanel } from "@/components/property/search/property-budget-panel";
import { PropertyResultsToolbar } from "@/components/property/search/property-results-toolbar";
import { PropertySearchEmptyState } from "@/components/property/search/property-search-empty";
import { SaveSearchButton } from "@/components/property/search/save-search-button";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { comparisonConfig } from "@/config/comparison";
import {
  isInCompareTray,
  readCompareTray,
  toggleCompareItem,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";
import {
  isFavourite,
  toggleSaveProperty,
  SAVE_FAILURE_MESSAGE,
} from "@/domains/properties/search/favourites";
import { FAVOURITES_CHANGED_EVENT } from "@/domains/favourites/guest-storage";
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
  compactHeader = false,
}: {
  properties: PropertyCardData[];
  state: PropertyUrlFilterState;
  sortLabel: string;
  relaxedCount?: number | null;
  isAuthenticated?: boolean;
  showPassportCta?: boolean;
  /** Hide budget panel / full toolbar (e.g. sponsored strip). */
  compactHeader?: boolean;
}) {
  const router = useRouter();
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [favouriteIds, setFavouriteIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"grid" | "list">("grid");

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
    window.addEventListener(FAVOURITES_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("majetio:compare-changed", sync);
      window.removeEventListener(FAVOURITES_CHANGED_EVENT, sync);
    };
  }, [properties]);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleFavourite(property: PropertyCardData) {
    const item = cardToCompareItem(property);
    const wasSaved = favouriteIds.includes(item.id) || isFavourite(item.id);
    const optimistic = !wasSaved;
    setFavouriteIds((prev) => {
      if (optimistic) return [...new Set([...prev, item.id])];
      return prev.filter((id) => id !== item.id);
    });

    const result = await toggleSaveProperty({
      propertyId: item.id,
      slug: item.slug,
      title: item.title,
      href: item.href,
      priceCzk: item.priceCzk,
    });

    if (!result.ok) {
      setFavouriteIds((prev) => {
        if (wasSaved) return [...new Set([...prev, item.id])];
        return prev.filter((id) => id !== item.id);
      });
      if (result.reason === "login_required") {
        router.push(result.loginUrl);
        return;
      }
      setToast(result.message || SAVE_FAILURE_MESSAGE);
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
    setToast(
      result.added
        ? result.mode === "guest"
          ? "Uloženo v tomto zařízení"
          : "Uloženo"
        : "Odebráno z uložených",
    );
  }

  function handleCompare(property: PropertyCardData) {
    const result = toggleCompareItem(cardToCompareItem(property));
    setCompareIds(result.items.map((c) => c.id));
    if (!result.ok) {
      setToast(comparisonConfig.trayFullMessageCs);
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
    <div className={cn("space-y-5", !compactHeader && "mt-1")}>
      {compactHeader ? (
        <PropertySearchResultsHeader
          count={properties.length}
          sortLabel={sortLabel}
          actions={
            <SaveSearchButton state={state} isAuthenticated={isAuthenticated} />
          }
        />
      ) : (
        <>
          <PropertyBudgetPanel />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PropertyResultsToolbar
              count={properties.length}
              state={state}
              view={view}
              onViewChange={setView}
            />
            <SaveSearchButton state={state} isAuthenticated={isAuthenticated} />
          </div>
        </>
      )}

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
        <div
          className={cn(
            view === "list"
              ? "properties-grid-list"
              : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {properties.map((property, index) => {
            const id = property.id ?? property.slug ?? slugFromHref(property.href);
            return (
              <PropertyCard
                key={property.href}
                property={property}
                priority={index < 3}
                variant="premium"
                isFavourite={favouriteIds.includes(id) || isFavourite(id)}
                isCompared={compareIds.includes(id) || isInCompareTray(id)}
                onFavourite={() => void handleFavourite(property)}
                onCompare={() => handleCompare(property)}
              />
            );
          })}
        </div>
      )}

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
