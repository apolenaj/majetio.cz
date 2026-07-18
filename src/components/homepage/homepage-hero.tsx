import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { HeroDemoVisual } from "@/components/homepage/hero-demo-visual";
import { QuickAnalysisEntry } from "@/components/homepage/quick-analysis-entry";
import { homepageContent } from "@/content/homepage";

/**
 * Homepage hero — product claim, CTAs above the fold, demo visual, quick analysis entry.
 */
export function HomepageHero() {
  const { hero } = homepageContent;

  return (
    <section
      className="relative overflow-x-clip border-b border-[var(--border-default)]"
      aria-labelledby="homepage-hero-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(11,31,51,0.08),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(31,111,84,0.06),transparent_50%)]"
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

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={hero.primaryCta.href} size="lg">
                {hero.primaryCta.label}
              </ButtonLink>
              <ButtonLink href={hero.secondaryCta.href} variant="secondary" size="lg">
                {hero.secondaryCta.label}
              </ButtonLink>
            </div>
            <p className="mt-3">
              <ButtonLink href={hero.tertiaryCta.href} variant="link" size="sm">
                {hero.tertiaryCta.label}
              </ButtonLink>
            </p>

            <QuickAnalysisEntry className="mt-8" />
          </div>

          <div className="min-w-0 lg:pt-2">
            <HeroDemoVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
