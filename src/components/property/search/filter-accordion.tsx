"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function FilterSection({
  title,
  description,
  children,
  className,
  badge,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg text-[var(--text-primary)]">
            {title}
          </h3>
          {badge}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function FilterAccordion({
  title,
  description,
  defaultOpen = true,
  children,
  className,
  badge,
  collapsible = true,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
  /** When false, renders as a static FilterSection card. */
  collapsible?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  if (!collapsible) {
    return (
      <FilterSection
        title={title}
        description={description}
        className={className}
        badge={badge}
      >
        {children}
      </FilterSection>
    );
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--background-secondary)]/60"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base text-[var(--text-primary)]">
              {title}
            </h3>
            {badge}
          </div>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-[var(--border-default)] px-5 py-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export const filterInputClassName =
  "h-11 w-full min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-primary)] shadow-sm placeholder:text-[var(--text-muted)] transition-[box-shadow,border-color] focus-visible:border-[var(--border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]/30";
