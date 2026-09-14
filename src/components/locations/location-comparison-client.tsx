"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { LocationSegmentSwitcher } from "@/components/locations/charts/location-segment-switcher";
import type { LocationComparisonClientProps } from "@/components/locations/types";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { trackLocation } from "@/domains/locations/analytics/events";
import { locationHref } from "@/domains/locations/seo/location-urls";
import {
  buildPropertySearchHref,
  EMPTY_PROPERTY_URL_STATE,
} from "@/domains/properties/search/url-state";
import { cn } from "@/lib/utils";

export function LocationComparisonClient({
  availableSlugs,
  initialSlugs,
  initialSegmentKey,
  segments,
  comparison,
  matchScores,
  passportGoalLabel,
}: LocationComparisonClientProps) {
  const router = useRouter();
  const [picked, setPicked] = React.useState<string[]>(
    initialSlugs.length >= 2 ? initialSlugs : ["praha", "brno"],
  );
  const [segmentKey, setSegmentKey] = React.useState(initialSegmentKey);

  React.useEffect(() => {
    if (!comparison) return;
    trackLocation({
      name: "location_comparison_viewed",
      props: {
        location_count: comparison.locations.length,
        segment_bucket: comparison.segment.propertyType,
        has_match: Boolean(matchScores && Object.keys(matchScores).length > 0),
      },
    });
  }, [comparison, matchScores]);

  function applyComparison(nextSlugs: string[], nextSegment: string) {
    const params = new URLSearchParams();
    for (const slug of nextSlugs.slice(0, 3)) {
      params.append("l", slug);
    }
    params.set("segment", nextSegment);
    router.push(`/lokality/porovnani?${params.toString()}`);
  }

  function toggleSlug(slug: string) {
    const next = picked.includes(slug)
      ? picked.filter((s) => s !== slug)
      : picked.length < 3
        ? [...picked, slug]
        : picked;
    if (next.length >= 2) {
      setPicked(next);
      applyComparison(next, segmentKey);
    }
  }

  const bestSlug = pickBestMatchSlug(matchScores);

  return (
    <div className="space-y-8">
      <Card padding="md">
        <h2 className="font-display text-lg text-[var(--text-primary)]">
          Vyberte lokality (2–3)
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {availableSlugs.map((loc) => {
            const active = picked.includes(loc.slug);
            return (
              <button
                key={loc.slug}
                type="button"
                onClick={() => toggleSlug(loc.slug)}
                className={
                  active
                    ? "rounded-full border border-[var(--action-accent)] bg-[var(--action-accent)] px-3 py-1.5 text-sm text-[var(--text-inverse)]"
                    : "rounded-full border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]"
                }
              >
                {loc.name}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
            Segment pro srovnatelné metriky
          </p>
          <LocationSegmentSwitcher
            segments={segments}
            value={segmentKey}
            onChange={(key) => {
              setSegmentKey(key);
              if (picked.length >= 2) applyComparison(picked, key);
            }}
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Porovnáváme vždy stejný segment — byty s byty, domy s domy. Asking a
            transakční ceny zůstávají oddělené.
          </p>
        </div>

        {passportGoalLabel ? (
          <p className="mt-4 rounded-md bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            Finanční pas: cíl „{passportGoalLabel}“. Lepší shoda je zvýrazněna níže.
          </p>
        ) : null}
      </Card>

      {comparison ? (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="py-3 pr-4 text-left font-medium text-[var(--text-muted)]">
                    Metrika
                  </th>
                  {comparison.locations.map((loc) => {
                    const isBest = bestSlug === loc.slug;
                    return (
                      <th
                        key={loc.slug}
                        className={cn(
                          "py-3 px-4 text-left font-display text-base text-[var(--text-primary)]",
                          isBest && "bg-[var(--surface-secondary)]",
                        )}
                      >
                        <a
                          href={locationHref(loc.slug)}
                          className="text-[var(--text-link)] hover:underline"
                        >
                          {loc.publicLabel}
                        </a>
                        {matchScores?.[loc.slug] != null ? (
                          <span
                            className={cn(
                              "mt-1 block text-xs font-sans font-normal",
                              isBest
                                ? "text-[var(--status-success)]"
                                : "text-[var(--text-muted)]",
                            )}
                          >
                            Shoda s cílem: {Math.round(matchScores[loc.slug]!)}
                            {isBest ? " · lepší shoda" : ""}
                          </span>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.metricKey} className="border-b border-[var(--border-default)]">
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">
                      {row.label}
                      <span className="ml-1 text-xs text-[var(--text-muted)]">
                        ({row.unit})
                      </span>
                    </td>
                    {row.values.map((val, i) => {
                      const slug = comparison.locations[i]?.slug;
                      return (
                        <td
                          key={`${row.metricKey}-${slug}`}
                          className={cn(
                            "py-3 px-4 font-metric font-medium text-[var(--text-primary)]",
                            bestSlug === slug && "bg-[var(--surface-secondary)]",
                          )}
                        >
                          {val ?? "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Období: {comparison.periodLabel} · Segment: {comparison.segment.label} ·{" "}
              <a
                href={comparison.methodologyHref}
                className="text-[var(--text-link)] hover:underline"
              >
                Metodika
              </a>
            </p>
          </div>

          {/* Mobile stacked cards */}
          <div className="space-y-4 md:hidden">
            {comparison.locations.map((loc, locIdx) => {
              const isBest = bestSlug === loc.slug;
              return (
                <Card
                  key={loc.slug}
                  padding="md"
                  className={cn(isBest && "ring-2 ring-[var(--action-accent)]")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={locationHref(loc.slug)}
                      className="font-display text-lg text-[var(--text-link)] hover:underline"
                    >
                      {loc.publicLabel}
                    </a>
                    {isBest && matchScores?.[loc.slug] != null ? (
                      <span className="rounded-md bg-[var(--action-accent)] px-2 py-0.5 text-xs text-[var(--text-inverse)]">
                        Lepší shoda
                      </span>
                    ) : null}
                  </div>
                  {matchScores?.[loc.slug] != null ? (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Shoda s cílem Finančního pasu: {Math.round(matchScores[loc.slug]!)}
                    </p>
                  ) : null}
                  <dl className="mt-4 space-y-2">
                    {comparison.rows.map((row) => (
                      <div
                        key={`${loc.slug}-${row.metricKey}`}
                        className="flex justify-between gap-3 border-b border-[var(--border-default)] pb-2 text-sm"
                      >
                        <dt className="text-[var(--text-secondary)]">
                          {row.label}
                          <span className="ml-1 text-xs text-[var(--text-muted)]">
                            ({row.unit})
                          </span>
                        </dt>
                        <dd className="font-metric font-medium text-[var(--text-primary)]">
                          {row.values[locIdx] ?? "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              );
            })}
            <p className="text-xs text-[var(--text-muted)]">
              Období: {comparison.periodLabel} · Segment: {comparison.segment.label}
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          Vyberte alespoň dvě lokality pro srovnání.
        </p>
      )}

      {comparison ? (
        <div className="flex flex-wrap gap-3">
          {comparison.locations.map((loc) => (
            <ButtonLink
              key={loc.slug}
              variant="secondary"
              href={buildPropertySearchHref({
                ...EMPTY_PROPERTY_URL_STATE,
                lokalita: loc.publicLabel,
              })}
            >
              Nemovitosti — {loc.name}
            </ButtonLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function pickBestMatchSlug(
  scores: Record<string, number> | null | undefined,
): string | null {
  if (!scores) return null;
  let best: string | null = null;
  let bestVal = -Infinity;
  for (const [slug, score] of Object.entries(scores)) {
    if (score > bestVal) {
      bestVal = score;
      best = slug;
    }
  }
  return best;
}
