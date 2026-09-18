"use client";

import {
  Building2,
  Building,
  Factory,
  Home,
  KeyRound,
  LandPlot,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

import { TYP_OPTIONS } from "@/domains/properties/search/url-state";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  byt: Building2,
  dum: Home,
  "dum-na-klic": KeyRound,
  pozemek: LandPlot,
  komercni: Factory,
  projekty: Building,
  ostatni: MoreHorizontal,
};

export type CategoryCounts = Partial<Record<string, number>>;

export function CategoryGrid({
  selected,
  onChange,
  counts,
  className,
}: {
  selected: string[];
  onChange: (typ: string[]) => void;
  /** Optional offer counts per category slug. */
  counts?: CategoryCounts;
  className?: string;
}) {
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((x) => x !== value)
        : [...selected, value],
    );
  }

  return (
    <section className={cn("space-y-4", className)} aria-label="Kategorie nemovitostí">
      <div>
        <h2 className="font-display text-xl text-[var(--text-primary)] sm:text-2xl">
          Co hledáte?
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Vyberte jednu nebo více kategorií — filtry se dají kombinovat
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {TYP_OPTIONS.map((cat) => {
          const active = selected.includes(cat.value);
          const Icon = CATEGORY_ICONS[cat.value] ?? MoreHorizontal;
          const count = counts?.[cat.value];

          return (
            <button
              key={cat.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(cat.value)}
              className={cn(
                "group flex min-h-[7.5rem] flex-col items-start justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? "border-[var(--action-accent)] bg-[var(--action-accent)]/8 ring-1 ring-[var(--action-accent)]/40"
                  : "border-[var(--border-default)] bg-[var(--surface-primary)] hover:border-[var(--action-accent)]/35",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl transition-colors",
                  active
                    ? "bg-[var(--action-accent)] text-[var(--text-inverse)]"
                    : "bg-[var(--background-secondary)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                  {cat.label}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                  {count != null
                    ? `${new Intl.NumberFormat("cs-CZ").format(count)} nabídek`
                    : "— nabídek"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
