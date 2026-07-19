"use client";

import { X } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import {
  buildPropertySearchHref,
  getActiveFilterChips,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import { cn } from "@/lib/utils";

export function ActiveFilterChips({
  state,
  className,
}: {
  state: PropertyUrlFilterState;
  className?: string;
}) {
  const chips = getActiveFilterChips(state);
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => {
        const next = { ...state, ...chip.clear, stranka: 1 };
        return (
          <Link
            key={chip.id}
            href={buildPropertySearchHref(next)}
            className="inline-flex max-w-full items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-2 py-1 text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)]"
          >
            <span className="truncate">{chip.label}</span>
            <X className="size-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="sr-only">Odstranit filtr {chip.label}</span>
          </Link>
        );
      })}
      <ButtonLink href="/nemovitosti" variant="ghost" size="sm" className="h-8 px-2 text-xs">
        Vymazat vše
      </ButtonLink>
    </div>
  );
}
