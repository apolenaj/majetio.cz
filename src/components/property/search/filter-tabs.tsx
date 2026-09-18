"use client";

import {
  SEARCH_CONTEXT_TABS,
  type SearchContextTab,
} from "@/domains/properties/search/url-state";
import { cn } from "@/lib/utils";

export function FilterTabs({
  value,
  onChange,
  className,
}: {
  value: SearchContextTab;
  onChange: (tab: SearchContextTab) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn("border-b border-[var(--border-default)]", className)}
      aria-label="Kontext vyhledávání"
    >
      <div
        role="tablist"
        className="-mb-px flex gap-1 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SEARCH_CONTEXT_TABS.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-colors",
                  active ? "bg-[var(--text-primary)]" : "bg-transparent",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
