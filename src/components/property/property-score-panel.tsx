import type { PropertyMatchScore } from "@/domains/properties/service/match-score";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricValue } from "@/components/data-display/metric-card";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

export function PropertyScorePanel({
  majetioScore,
  matchScore,
  isAuthenticated,
}: {
  majetioScore: number | null;
  matchScore: PropertyMatchScore | null;
  isAuthenticated: boolean;
}) {
  const majetioMissing = majetioScore == null || Number.isNaN(majetioScore);

  return (
    <section
      aria-labelledby="scores-heading"
      className="grid gap-4 lg:grid-cols-2"
    >
      <h2 id="scores-heading" className="sr-only">
        Skóre a shoda s profilem
      </h2>

      <Card className="border-[var(--border-default)]">
        <CardHeader>
          <CardTitle>Majetio skóre</CardTitle>
          <CardDescription>
            Orientační souhrn kvality nabídky — není investičním doporučením.
          </CardDescription>
        </CardHeader>
        {majetioMissing ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Skóre zatím nelze určit.
          </p>
        ) : (
          <div className="flex items-end gap-4">
            <div>
              <MetricValue value={majetioScore} size="xl" />
              <p className="text-sm text-[var(--text-muted)]">z 100</p>
            </div>
            <div className="mb-1 h-2 flex-1 overflow-hidden rounded-full bg-[var(--background-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--action-accent)]"
                style={{ width: `${Math.min(100, Math.max(0, majetioScore))}%` }}
                aria-hidden
              />
            </div>
          </div>
        )}
      </Card>

      <Card
        className={cn(
          "border-2",
          "border-[color-mix(in_srgb,var(--action-premium)_55%,var(--border-default))]",
          "bg-[color-mix(in_srgb,var(--action-premium)_6%,var(--surface-primary))]",
        )}
      >
        <CardHeader>
          <p className="text-[var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--action-premium)]">
            Shoda s Finančním pasem
          </p>
          <CardTitle>Match Score</CardTitle>
          <CardDescription>
            Rule-based shoda s vašimi preferencemi — odděleně od Majetio skóre.
          </CardDescription>
        </CardHeader>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Přihlaste se a doplňte Finanční pas pro personalizovanou shodu.
            </p>
            <ButtonLink href="/ucet/financni-profil" size="sm" variant="secondary">
              Doplnit Finanční pas
            </ButtonLink>
          </div>
        ) : !matchScore?.profileComplete ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Doplňte Finanční pas (rozpočet, lokalita nebo typ), abychom spočítali
              shodu.
            </p>
            <ButtonLink href="/ucet/financni-profil" size="sm" variant="secondary">
              Doplnit Finanční pas
            </ButtonLink>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end gap-4">
              <div>
                <MetricValue value={`${matchScore.score} %`} size="xl" />
                <p className="text-sm text-[var(--text-muted)]">shoda s profilem</p>
              </div>
            </div>
            {matchScore.reasons.length > 0 ? (
              <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                {matchScore.reasons.slice(0, 4).map((reason) => (
                  <li
                    key={reason.code}
                    className={
                      reason.tone === "positive"
                        ? "text-[var(--status-success)]"
                        : reason.tone === "warning"
                          ? "text-[var(--status-warning)]"
                          : undefined
                    }
                  >
                    {reason.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </Card>
    </section>
  );
}
