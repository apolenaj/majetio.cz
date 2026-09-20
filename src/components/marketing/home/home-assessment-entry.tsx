"use client";

import { useState } from "react";

import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";

/**
 * Reference-style assessment CTA: URL + CTA opens the full inquiry (not a submission).
 */
export function HomeAssessmentEntry() {
  const [step, setStep] = useState<1 | 2>(1);
  const [listingUrl, setListingUrl] = useState("");

  if (step === 2) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Doplňte údaje k nezávazné poptávce
          </p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-[var(--text-muted)] underline-offset-2 hover:underline"
          >
            Změnit odkaz
          </button>
        </div>
        <PropertyAuditInquiryForm
          id="home-posoudit"
          prefill={{ listingUrl: listingUrl.trim() || undefined }}
          chrome="fields"
          className="border-0 bg-transparent p-0 shadow-none sm:p-0"
        />
      </div>
    );
  }

  return (
    <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
      <div>
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-[var(--text-primary)]">
          Máte vybranou nemovitost?
        </h2>
        <p className="mt-2 max-w-md text-base text-[var(--text-secondary)]">
          Pošlete nám odkaz a zjistěte možnosti posouzení.
        </p>
      </div>
      <form
        className="flex flex-col gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          setStep(2);
        }}
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Odkaz na inzerát</span>
            <input
              type="url"
              name="listingUrl"
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
              placeholder="Odkaz na inzerát (např. https://…)"
              className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-white px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--action-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              autoComplete="url"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--action-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--action-primary-hover)]"
          >
            Poptat posouzení
          </button>
        </div>
        <p className="text-sm text-[var(--text-muted)]">Nezávazná poptávka.</p>
      </form>
    </div>
  );
}
