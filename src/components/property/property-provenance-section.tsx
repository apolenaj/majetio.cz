import type {
  PublicFieldConflict,
  PublicSourceFreshness,
} from "@/domains/properties/service/dto";
import { PropertySourceFreshness } from "@/components/property/property-source-freshness";
import { InlineAlert } from "@/components/feedback/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_STALE_AFTER_DAYS,
  evaluatePropertyFreshness,
} from "@/lib/properties/freshness";

const NEU = "Neuvedeno";

/**
 * Provenance: sources, staleness warning, field conflicts without false precision.
 */
export function PropertyProvenanceSection({
  sources,
  lastSeenAt,
  freshness,
  fieldConflicts,
}: {
  sources: PublicSourceFreshness[];
  lastSeenAt: string | null;
  freshness: string | null;
  fieldConflicts: PublicFieldConflict[];
}) {
  const seenDate = lastSeenAt ? new Date(lastSeenAt) : null;
  const freshnessEval =
    seenDate && !Number.isNaN(seenDate.getTime())
      ? evaluatePropertyFreshness({ lastSeenAt: seenDate })
      : null;

  const daysSince =
    freshnessEval?.daysSinceSeen ??
    (seenDate
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - seenDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : null);

  const showStaleWarning =
    freshness === "STALE" ||
    freshness === "UNAVAILABLE" ||
    (daysSince != null && daysSince >= DEFAULT_STALE_AFTER_DAYS);

  return (
    <section aria-labelledby="provenance-heading">
      <h2
        id="provenance-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Zdroj a aktuálnost dat
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Provenance bez lhaní — konflikty ukazujeme jako rozsahy, ne jako jednu
        „správnou“ hodnotu.
      </p>

      {showStaleWarning ? (
        <InlineAlert
          className="mt-5"
          tone="warning"
          title="Stale data — ověření zastaralé"
        >
          {daysSince != null
            ? `Dostupnost nabídky nebyla v posledních ${daysSince} dnech ověřena.`
            : "Dostupnost nabídky nebyla v posledních dnech ověřena."}
        </InlineAlert>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h3">Zdroje</CardTitle>
            <CardDescription>
              Počet zdrojů:{" "}
              {sources.length > 0 ? sources.length : NEU}
            </CardDescription>
          </CardHeader>
          <PropertySourceFreshness
            sources={sources}
            lastSeenAt={lastSeenAt}
            freshness={freshness}
          />
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h3">Konflikty v datech</CardTitle>
            <CardDescription>
              Kde se zdroje neshodují, ukazujeme rozsah — ne falešnou přesnost.
            </CardDescription>
          </CardHeader>
          {fieldConflicts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Žádný konflikt mezi zdroji není evidován.
            </p>
          ) : (
            <ul className="space-y-3">
              {fieldConflicts.map((c) => (
                <li
                  key={c.fieldKey}
                  className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[var(--text-primary)]">
                      {c.label}
                    </p>
                    <Badge tone="warning">Konflikt</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {c.display}
                  </p>
                  {c.values.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                      {c.values.map((v, i) => (
                        <li key={`${c.fieldKey}-${i}`}>
                          {v.value}
                          {v.sourceLabel ? ` · ${v.sourceLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
