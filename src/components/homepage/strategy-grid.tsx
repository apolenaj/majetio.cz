import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { STRATEGIES } from "@/config/navigation";
import { homepageContent } from "@/content/homepage";

/**
 * Strategy overview linking to strategy detail pages.
 */
export function StrategyGrid() {
  const copy = homepageContent.strategies;

  return (
    <Section aria-labelledby="strategies-heading">
      <Container>
        <h2 id="strategies-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STRATEGIES.map((strategy) => (
            <li key={strategy.slug}>
              <Link
                href={`/strategie/${strategy.slug}`}
                className="block rounded-[var(--radius-md)] border border-transparent py-3 transition-colors hover:border-[var(--border-default)] hover:bg-[var(--background-secondary)] hover:px-3"
              >
                <h3 className="font-display text-lg text-[var(--text-primary)]">
                  {strategy.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {strategy.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
