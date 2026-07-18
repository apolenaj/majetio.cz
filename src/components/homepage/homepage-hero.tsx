import { HeroDemoVisual } from "@/components/homepage/hero-demo-visual";
import { QuickAnalysisEntry } from "@/components/homepage/quick-analysis-entry";
import { TrackedButtonLink } from "@/components/homepage/tracked";
import { Container } from "@/components/ui/container";
import type { resolveHomepageHero } from "@/config/homepage";

type HeroCopy = ReturnType<typeof resolveHomepageHero>;

/**
 * Homepage hero — product claim, CTAs above the fold, demo visual, quick analysis entry.
 * Receives resolved experiment copy for future A/B without forking the layout.
 */
export function HomepageHero({
  hero,
  experimentVariant = "control",
}: {
  hero: HeroCopy;
  experimentVariant?: string;
}) {
  return (
    <section
      className="relative overflow-x-clip border-b border-[var(--border-default)]"
      aria-labelledby="homepage-hero-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(11,31,51,0.08),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgb(31,111,84,0.06),transparent_50%)]"
      />

      <Container className="relative py-10 sm:py-14 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="motion-fade-in min-w-0">
            <p className="text-overline text-[var(--action-premium)]">{hero.overline}</p>
            <h1
              id="homepage-hero-heading"
              className="text-display-l mt-3 max-w-xl text-[var(--text-primary)]"
            >
              {hero.headline}
            </h1>
            <p className="mt-4 max-w-xl text-[length:var(--text-body-l)] leading-relaxed text-[var(--text-secondary)]">
              {hero.subheadline}
            </p>

            <div className="mt-7 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedButtonLink
                href={hero.primaryCta.href}
                size="lg"
                className="w-full sm:w-auto"
                event={{
                  name: "hero_primary_cta_clicked",
                  props: { href: hero.primaryCta.href, variant: experimentVariant },
                }}
              >
                {hero.primaryCta.label}
              </TrackedButtonLink>
              <TrackedButtonLink
                href={hero.secondaryCta.href}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                event={{
                  name: "hero_secondary_cta_clicked",
                  props: { href: hero.secondaryCta.href, variant: experimentVariant },
                }}
              >
                {hero.secondaryCta.label}
              </TrackedButtonLink>
            </div>
            <p className="mt-3">
              <TrackedButtonLink
                href={hero.tertiaryCta.href}
                variant="link"
                size="sm"
                event={{
                  name: "primary_cta_clicked",
                  props: {
                    label: hero.tertiaryCta.label,
                    href: hero.tertiaryCta.href,
                    location: "homepage_hero_tertiary",
                  },
                }}
              >
                {hero.tertiaryCta.label}
              </TrackedButtonLink>
            </p>

            <QuickAnalysisEntry className="mt-8" />
          </div>

          <div className="min-w-0 lg:order-none lg:pt-2" aria-hidden={false}>
            <HeroDemoVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
