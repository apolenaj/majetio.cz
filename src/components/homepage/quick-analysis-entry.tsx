"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Field, TextInput } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { homepageContent } from "@/content/homepage";
import { track } from "@/lib/analytics/events";
import {
  buildAnalysisEntryHref,
  validateListingUrl,
} from "@/lib/listing-url";
import { cn } from "@/lib/utils";

type EntryMode = "url" | "manual";

function errorMessageForReason(
  reason: "invalid" | "blocked" | "unsupported",
): string {
  const copy = homepageContent.quickAnalysis;
  if (reason === "blocked") return copy.urlErrorBlocked;
  if (reason === "unsupported") return copy.urlErrorUnsupported;
  return copy.urlErrorInvalid;
}

/**
 * Fast path into analysis: validated listing URL or manual entry redirect.
 * Progressive enhancement: without JS the form GETs /analyza/nova.
 * Does not fetch remote content (SSRF-safe).
 */
export function QuickAnalysisEntry({ className }: { className?: string }) {
  const router = useRouter();
  const copy = homepageContent.quickAnalysis;
  const [mode, setMode] = React.useState<EntryMode>("url");
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [pending, setPending] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);

    const result = validateListingUrl(url);
    track({
      name: "quick_analysis_submitted",
      props: { entry: "url", valid: result.ok },
    });

    if (!result.ok) {
      setError(errorMessageForReason(result.reason));
      return;
    }

    setPending(true);
    router.push(buildAnalysisEntryHref({ source: "url", listingUrl: result.url }));
  }

  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 sm:p-5",
        className,
      )}
      id="rychla-analyza"
    >
      <h2 className="font-display text-lg text-[var(--text-primary)] sm:text-xl">
        {copy.title}
      </h2>
      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{copy.description}</p>

      <div
        className="mt-4 flex gap-1 rounded-[var(--radius-md)] bg-[var(--background-secondary)] p-1"
        role="tablist"
        aria-label="Způsob zadání"
      >
        {(
          [
            { id: "url" as const, label: copy.urlTab },
            { id: "manual" as const, label: copy.manualTab },
          ] as const
        ).map((tab) => {
          const selected = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`quick-analysis-tab-${tab.id}`}
              aria-controls={`quick-analysis-panel-${tab.id}`}
              className={cn(
                "min-h-10 flex-1 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
                selected
                  ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-[var(--shadow-raised)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
              onClick={() => {
                setMode(tab.id);
                setError(undefined);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {mode === "url" ? (
        <form
          className="mt-4 space-y-3"
          action="/analyza/nova"
          method="get"
          onSubmit={onSubmit}
          noValidate
          role="tabpanel"
          id="quick-analysis-panel-url"
          aria-labelledby="quick-analysis-tab-url"
        >
          <input type="hidden" name="source" value="url" />
          <Field
            id="homepage-listing-url"
            label={copy.urlLabel}
            helperText={error ? undefined : copy.urlHelper}
            error={error}
            required
          >
            <TextInput
              type="url"
              name="listingUrl"
              inputMode="url"
              autoComplete="url"
              placeholder={copy.urlPlaceholder}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(undefined);
              }}
            />
          </Field>
          <Button type="submit" fullWidth loading={pending} size="lg">
            {copy.urlSubmit}
          </Button>
          <p className="text-xs text-[var(--text-muted)]">{copy.nextStepNote}</p>
        </form>
      ) : (
        <div
          className="mt-4 space-y-3"
          role="tabpanel"
          id="quick-analysis-panel-manual"
          aria-labelledby="quick-analysis-tab-manual"
        >
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            {copy.manualHeading}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">{copy.manualDescription}</p>
          <ButtonLink
            href={buildAnalysisEntryHref({ source: "manual" })}
            fullWidth
            size="lg"
            onClick={() =>
              track({
                name: "quick_analysis_submitted",
                props: { entry: "manual", valid: true },
              })
            }
          >
            {copy.manualCta}
          </ButtonLink>
          <p className="text-xs text-[var(--text-muted)]">{copy.nextStepNote}</p>
        </div>
      )}

      <noscript>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Bez JavaScriptu odešlete URL formulářem výše — validaci dokončí další krok.
        </p>
      </noscript>
    </div>
  );
}
