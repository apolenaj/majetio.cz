"use client";

import { useState } from "react";

import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";

export function HomeAssessmentEntry() {
  const [step, setStep] = useState<1 | 2>(1);
  const [listingUrl, setListingUrl] = useState("");

  if (step === 2) {
    return (
      <div className="rounded-[6px] border border-[var(--border-default)] bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
    <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-8">
      <div>
        <h2 className="home-heading text-[clamp(1.5rem,2.4vw,2rem)]">
          Máte vybranou nemovitost?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Pošlete nám odkaz a zjistěte možnosti posouzení.
        </p>
      </div>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setStep(2);
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Odkaz na inzerát</span>
            <input
              type="url"
              name="listingUrl"
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
              placeholder="Odkaz na inzerát (např. https://…)"
              className="h-11 w-full rounded-[4px] border border-[var(--border-default)] bg-white px-3.5 text-sm outline-none focus:border-[var(--action-accent)] focus:ring-2 focus:ring-[var(--focus-ring)]"
              autoComplete="url"
            />
          </label>
          <button type="submit" className="home-btn-primary shrink-0">
            Poptat posouzení
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Nezávazná poptávka.</p>
      </form>
    </div>
  );
}
