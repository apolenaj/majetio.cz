import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";
import { preparePageMeta } from "@/components/content/page-helpers";
import { STRATEGIES } from "@/config/navigation";
import { DEMO_PROPERTIES } from "@/content/demo-properties";
import { isDemoPropertyContentAllowed } from "@/lib/demo-content-gate";
import { enforcePublicSearchRateLimit } from "@/lib/security/public-search-guard";

export async function generateMetadata(): Promise<Metadata> {
  return preparePageMeta({
    title: "Hledat",
    description: "Interní vyhledávání v obsahu Majetio. Neindexuje se.",
    path: "/hledat",
    noIndex: true,
  });
}

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const guard = await enforcePublicSearchRateLimit();
  if (!guard.ok) {
    return (
      <Container className="py-10 sm:py-14">
        <EmptyState
          title="Příliš mnoho požadavků"
          description={`Zkuste to znovu za ${guard.retryAfterSec} s.`}
        />
      </Container>
    );
  }

  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const properties =
    query && isDemoPropertyContentAllowed()
      ? DEMO_PROPERTIES.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.location.toLowerCase().includes(query),
        )
      : [];
  const strategies = query
    ? STRATEGIES.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query),
      )
    : [];

  const hasResults = properties.length > 0 || strategies.length > 0;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="Hledání"
        description="Vyhledávání v demonstračním obsahu a strategiích. Osobní údaje do dotazu nevkládejte."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Hledat" }]}
      />

      <form className="mb-8" action="/hledat" method="get">
        <label htmlFor="q" className="sr-only">
          Hledaný výraz
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          className="h-11 w-full max-w-xl rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3"
          placeholder="Např. vinohrady, pronájem…"
        />
      </form>

      {!query ? (
        <EmptyState
          title="Zadejte hledaný výraz"
          description="Prohledáme demonstrační nemovitosti, strategie a připravený obsah."
        />
      ) : !hasResults ? (
        <EmptyState
          title="Nic jsme nenašli"
          description={`Pro „${q}“ nejsou v demo obsahu žádné výsledky.`}
        />
      ) : (
        <div className="space-y-8">
          {properties.length > 0 ? (
            <section aria-labelledby="res-prop">
              <h2 id="res-prop" className="font-display text-xl">
                Nemovitosti (demo)
              </h2>
              <ul className="mt-3 space-y-2">
                {properties.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      className="text-[var(--text-link)] underline-offset-2 hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {strategies.length > 0 ? (
            <section aria-labelledby="res-strat">
              <h2 id="res-strat" className="font-display text-xl">
                Strategie
              </h2>
              <ul className="mt-3 space-y-2">
                {strategies.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/strategie/${s.slug}`}
                      className="text-[var(--text-link)] underline-offset-2 hover:underline"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Container>
  );
}
