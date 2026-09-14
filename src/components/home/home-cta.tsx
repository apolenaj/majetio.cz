import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";

export function HomeCta() {
  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-ink)] py-16 text-[var(--color-canvas)] sm:py-20">
      <Container className="max-w-3xl text-center">
        <p className="text-sm font-medium tracking-wide text-[var(--color-sand)]">
          {brand.claims.short}
        </p>
        <h2 className="mt-3 font-display text-2xl sm:text-3xl">
          {brand.claims.secondary}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
          Připravujeme analýzu, která má smysl. Zatím si můžete projít metodiku a způsob,
          jakým Majetio uvažuje o rozhodnutí o koupi.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink
            href="/analyza"
            variant="secondary"
            className="border-transparent bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-white"
          >
            Analyzovat nemovitost
          </ButtonLink>
          <ButtonLink
            href="/metodika"
            variant="ghost"
            className="text-[var(--color-canvas)] hover:bg-white/10"
          >
            Metodika
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
