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

import {
  BYT_SUBCATEGORIES,
  DUM_SUBCATEGORIES,
  SubCategoryPills,
} from "@/components/property/search/sub-category-pills";
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

export type CategorySubSelection = {
  byt: string[];
  dum: string[];
};

export function CategoryGrid({
  title,
  description,
  selected,
  onChange,
  subcategories,
  onSubChange,
  className,
}: {
  title: string;
  description?: string;
  selected: string[];
  onChange: (typ: string[]) => void;
  subcategories: CategorySubSelection;
  onSubChange: (next: CategorySubSelection) => void;
  className?: string;
}) {
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((x) => x !== value)
        : [...selected, value],
    );
  }

  const showByt = selected.includes("byt");
  const showDum = selected.includes("dum");
  const expanded = showByt || showDum;

  return (
    <section className={cn("space-y-4", className)} aria-label={title}>
      <div>
        <h2 className="font-display text-xl text-[var(--text-primary)] sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {TYP_OPTIONS.map((cat) => {
          const active = selected.includes(cat.value);
          const Icon = CATEGORY_ICONS[cat.value] ?? MoreHorizontal;

          return (
            <button
              key={cat.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(cat.value)}
              className={cn(
                "group flex min-h-[6.75rem] flex-col items-start justify-between gap-3 rounded-2xl border-2 p-4 text-left shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? "border-slate-900 bg-slate-900/[0.06] shadow-md"
                  : "border-slate-200 bg-[var(--surface-primary)] hover:border-slate-400",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl transition-colors",
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:text-slate-900",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "space-y-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition-opacity duration-300 sm:px-5",
              expanded ? "opacity-100" : "opacity-0",
            )}
          >
            {showByt ? (
              <SubCategoryPills
                label="Dispozice bytů"
                options={BYT_SUBCATEGORIES}
                selected={subcategories.byt}
                onChange={(byt) => onSubChange({ ...subcategories, byt })}
              />
            ) : null}
            {showDum ? (
              <SubCategoryPills
                label="Typ domu"
                options={DUM_SUBCATEGORIES}
                selected={subcategories.dum}
                onChange={(dum) => onSubChange({ ...subcategories, dum })}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
