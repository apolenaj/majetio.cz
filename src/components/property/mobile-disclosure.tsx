"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function useIsLargeScreen(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

/**
 * Progressive disclosure: mobile shows heavy blocks behind <details>;
 * desktop always shows content. Children render once (no double mount).
 */
export function MobileDisclosure({
  title,
  children,
  className,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const isLg = useIsLargeScreen();

  if (isLg) {
    return <div className={className}>{children}</div>;
  }

  return (
    <details className={cn("group", className)} open={defaultOpen || undefined}>
      <summary className="cursor-pointer list-none rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          {title}
          <span className="text-[var(--text-muted)] group-open:hidden" aria-hidden>
            Zobrazit
          </span>
          <span className="hidden text-[var(--text-muted)] group-open:inline" aria-hidden>
            Skrýt
          </span>
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
