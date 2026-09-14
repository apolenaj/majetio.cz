import Link from "next/link";

import { ExternalLink as ExternalIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EXTERNAL_REL = "noopener noreferrer" as const;

export type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Paid / affiliate placement — shows Sponsored badge. */
  sponsored?: boolean;
  showIcon?: boolean;
};

/**
 * External link with mandatory noopener noreferrer.
 * Use `sponsored` for paid placements — never mix into organic scores.
 */
export function ExternalLink({
  href,
  children,
  className,
  sponsored = false,
  showIcon = true,
}: ExternalLinkProps) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      {sponsored ? <SponsoredLinkBadge /> : null}
      <a
        href={href}
        target="_blank"
        rel={EXTERNAL_REL}
        className="inline-flex items-center gap-1 font-medium text-[var(--text-link)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        data-sponsored={sponsored ? "true" : undefined}
      >
        <span>{children}</span>
        {showIcon ? (
          <ExternalIcon className="size-3.5 shrink-0" aria-hidden />
        ) : null}
        <span className="sr-only"> (otevírá se v novém okně)</span>
      </a>
    </span>
  );
}

export function SponsoredLinkBadge({ className }: { className?: string }) {
  return (
    <Badge tone="warning" className={cn("gap-1", className)}>
      Sponzorováno
    </Badge>
  );
}

/**
 * Visually separates organic ranking/score from commercial promotion.
 */
export function OrganicVsSponsoredSplit({
  organic,
  sponsored,
  className,
}: {
  organic: React.ReactNode;
  sponsored?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8", className)}>
      <section aria-labelledby="organic-results-heading" className="space-y-3">
        <h2
          id="organic-results-heading"
          className="text-h4 font-medium text-[var(--text-primary)]"
        >
          Organické výsledky
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--text-muted)]">
          Pořadí a skóre vychází z metodiky Majetio — ne z placeného umístění.
        </p>
        {organic}
      </section>
      {sponsored ? (
        <section
          aria-labelledby="sponsored-results-heading"
          className="space-y-3 border-t border-[var(--border-default)] pt-8"
          data-testid="sponsored-external-block"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="sponsored-results-heading"
              className="text-h4 font-medium text-[var(--text-primary)]"
            >
              Sponzorované odkazy
            </h2>
            <SponsoredLinkBadge />
          </div>
          <p className="text-[var(--text-caption)] text-[var(--text-muted)]">
            Placené umístění neovlivňuje Majetio skóre, valuaci ani organické
            doporučení.
          </p>
          {sponsored}
        </section>
      ) : null}
    </div>
  );
}

/** Safe internal Link helper when you need consistent focus styles. */
export function TrustTextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-[var(--text-link)] underline-offset-2 hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
