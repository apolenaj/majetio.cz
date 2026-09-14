import type { Metadata } from "next";

import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button-link";
import { buildPageMetadata } from "@/domains/seo/metadata";

/**
 * Page metadata with hreflang + canonical (INTERNATIONAL_SEO).
 * Delegates to central `buildPageMetadata`.
 */
export function preparePageMeta(input: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  marketCode?: string;
  siteOrigin?: string | null;
  ogImage?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  } | null;
}): Metadata {
  return buildPageMetadata(input);
}

/** Honest placeholder for routes that exist but have no engine yet. */
export function PreparingPage({
  title,
  description,
  breadcrumbs,
  primaryHref = "/jak-to-funguje",
  primaryLabel = "Jak to funguje",
}: {
  title: string;
  description: string;
  breadcrumbs?: { href?: string; label: string }[];
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <InlineAlert tone="info" title="Připravujeme">
        Tato část má připravenou strukturu a navigaci. Funkce se doplní v dalších fázích —
        záměrně zde nejsou falešné výpočty ani živá data.
      </InlineAlert>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>
        <ButtonLink href="/cenik" variant="secondary">
          Zobrazit ceník
        </ButtonLink>
      </div>
    </Container>
  );
}

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Container width="article" className="py-12 sm:py-16">
      <PageHeader title={title} description={description} />
      <div className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </Container>
  );
}
