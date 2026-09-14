"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Columns2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { comparisonConfig } from "@/config/comparison";
import {
  COMPARE_CHANGED_EVENT,
  COMPARE_MAX,
  readCompareTray,
  removeCompareItem,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";
import { formatCzk } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Sticky compare tray — desktop floating card / mobile compact bottom bar.
 * Shows e.g. "Porovnání 3/4" + Porovnat CTA.
 */
export function CompareTray({
  className,
  compactMobile = true,
}: {
  className?: string;
  compactMobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = React.useState<CompareTrayItem[]>([]);

  React.useEffect(() => {
    const sync = () => setItems(readCompareTray());
    sync();
    window.addEventListener(COMPARE_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COMPARE_CHANGED_EVENT, sync);
  }, []);

  // Hide on comparison workspace itself (and account list).
  if (
    pathname.startsWith("/porovnani") ||
    pathname.startsWith("/ucet/porovnani")
  ) {
    return null;
  }

  if (items.length < 1) return null;

  const count = items.length;
  const canCompare = count >= comparisonConfig.minPropertiesToCompare;
  const href =
    count > 0
      ? `/porovnani?ids=${encodeURIComponent(items.map((i) => i.slug).join(","))}`
      : "/porovnani";

  return (
    <>
      {/* Mobile compact bottom bar */}
      {compactMobile ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-[36] border-t border-[var(--border-default)]",
            "bg-[var(--surface-primary)] px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]",
            "shadow-[var(--shadow-overlay)] sm:hidden",
            className,
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <Columns2 className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-sm text-[var(--text-secondary)]">
              Porovnání{" "}
              <strong className="text-[var(--text-primary)]">
                {count}/{COMPARE_MAX}
              </strong>
              {count >= COMPARE_MAX ? (
                <span className="sr-only">
                  . Pro přidání další nemovitosti nejprve jednu odeberte.
                </span>
              ) : null}
            </p>
            <ButtonLink
              href={href}
              size="sm"
              className={!canCompare ? "pointer-events-none opacity-50" : undefined}
              aria-disabled={!canCompare}
            >
              Porovnat
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {/* Desktop / tablet sticky tray */}
      <div
        className={cn(
          "fixed right-4 bottom-6 z-[36] hidden w-[min(100%-2rem,22rem)] rounded-[var(--radius-card)]",
          "border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-overlay)]",
          "sm:block",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-[var(--text-secondary)]">
            Porovnání{" "}
            <strong className="text-[var(--text-primary)]">
              {count}/{COMPARE_MAX}
            </strong>
          </p>
          <Columns2 className="size-4 text-[var(--text-muted)]" aria-hidden />
        </div>

        <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--background-secondary)] px-2 py-1.5 text-xs"
            >
              <Link
                href={item.href}
                className="min-w-0 truncate font-medium text-[var(--text-primary)] hover:underline"
              >
                {item.title}
              </Link>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)]"
                aria-label={`Odebrat ${item.title} z porovnání`}
                onClick={() => removeCompareItem(item.id)}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>

        {items[0]?.priceCzk != null ? (
          <p className="mt-2 text-[var(--text-caption)] text-[var(--text-muted)]">
            Od {formatCzk(Math.min(...items.map((i) => i.priceCzk!).filter(Boolean)))}
          </p>
        ) : null}

        <Button
          type="button"
          size="sm"
          className="mt-3 w-full"
          disabled={!canCompare}
          onClick={() => router.push(href)}
        >
          Porovnat
        </Button>
        {!canCompare ? (
          <p className="mt-1 text-[var(--text-caption)] text-[var(--text-muted)]">
            Přidejte alespoň {comparisonConfig.minPropertiesToCompare} nemovitosti.
          </p>
        ) : count >= COMPARE_MAX ? (
          <p className="mt-1 text-[var(--text-caption)] text-[var(--text-muted)]">
            Pro přidání další nemovitosti nejprve jednu odeberte.
          </p>
        ) : null}
      </div>
    </>
  );
}

/** @deprecated Prefer named CompareTray from comparisons — kept for search results API. */
export function CompareTrayLegacy({
  count,
  onOpen,
  className,
}: {
  count: number;
  onOpen?: () => void;
  className?: string;
}) {
  if (count < 1) return null;
  return (
    <div
      className={cn(
        "fixed right-4 bottom-20 z-[35] rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-overlay)] sm:bottom-6",
        className,
      )}
    >
      <p className="text-sm text-[var(--text-secondary)]">
        Porovnání{" "}
        <strong className="text-[var(--text-primary)]">
          {count}/{COMPARE_MAX}
        </strong>
      </p>
      <Button type="button" size="sm" className="mt-2 w-full" onClick={onOpen} disabled={count < 2}>
        Porovnat
      </Button>
    </div>
  );
}
