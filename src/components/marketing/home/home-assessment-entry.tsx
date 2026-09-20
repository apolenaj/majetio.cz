"use client";

import { useState } from "react";

import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";

/**
 * Compact homepage entry: URL + continue opens the full inquiry form (step 2).
 * First click is not a successful submission.
 */
export function HomeAssessmentEntry() {
  const [step, setStep] = useState<1 | 2>(1);
  const [listingUrl, setListingUrl] = useState("");

  if (step === 2) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Doplňte údaje k poptávce
          </p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline"
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
    <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
      <div>
        <h2 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)] sm:text-[2rem]">
          Máte vybranou nemovitost?
        </h2>
        <p className="mt-2 max-w-md text-base text-[var(--text-secondary)]">
          Vložte odkaz na nabídku. Pokračováním otevřete formulář poptávky —
          nejde o odeslání ani platbu.
        </p>
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          setStep(2);
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Odkaz na inzerát</span>
          <input
            type="url"
            name="listingUrl"
            value={listingUrl}
            onChange={(e) => setListingUrl(e.target.value)}
            placeholder="https://… odkaz na inzerát"
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--action-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            autoComplete="url"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--action-primary)] px-6 text-sm font-medium text-white"
        >
          Pokračovat
        </button>
      </form>
    </div>
  );
}
