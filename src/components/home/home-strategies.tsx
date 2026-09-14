import Link from "next/link";

import { Container } from "@/components/ui/container";
import { STRATEGIES } from "@/config/navigation";

export function HomeStrategies() {
  return (
    <section
      className="border-y border-[var(--color-line)] bg-[var(--color-surface)] py-16 sm:py-20"
      aria-labelledby="strategies-heading"
    >
      <Container>
        <h2
          id="strategies-heading"
          className="font-display text-2xl text-[var(--color-ink)] sm:text-3xl"
        >
          Hlavní strategie
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">
          Stejná nemovitost, jiný záměr — Majetio hodnotí podle vaší strategie.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STRATEGIES.map((strategy) => (
            <li key={strategy.slug}>
              <Link
                href={`/strategie/${strategy.slug}`}
                className="block rounded-md border border-transparent py-1 transition-colors hover:border-[var(--color-line)] hover:bg-[var(--color-canvas)] hover:px-3"
              >
                <h3 className="font-display text-lg text-[var(--color-ink)]">
                  {strategy.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {strategy.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
