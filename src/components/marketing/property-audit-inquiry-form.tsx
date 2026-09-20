"use client";

import { useState, useTransition } from "react";

import { submitPropertyAuditInquiryAction } from "@/lib/leads/property-audit-actions";
import { formatCzk } from "@/lib/format";
import { cn } from "@/lib/utils";

const PURPOSE_OPTIONS = [
  { value: "bydleni", label: "Vlastní bydlení" },
  { value: "investice", label: "Investice k pronájmu" },
  { value: "jine", label: "Jiné" },
] as const;

const PROPERTY_TYPES = [
  "Byt",
  "Rodinný dům",
  "Bytový dům",
  "Pozemek",
  "Jiné",
] as const;

type FormState = {
  listingUrl: string;
  propertyType: string;
  locality: string;
  purpose: (typeof PURPOSE_OPTIONS)[number]["value"];
  email: string;
  phone: string;
  note: string;
  companyWebsite: string;
  consent: boolean;
};

export type PropertyAuditPrefill = {
  propertyId?: string;
  title?: string;
  listingUrl?: string;
  locality?: string;
  propertyType?: string;
  askingPrice?: number | null;
  currency?: string;
  transactionType?: string;
  layout?: string;
  usableArea?: number | null;
  photoUrl?: string | null;
};

function emptyForm(prefill?: PropertyAuditPrefill): FormState {
  return {
    listingUrl: prefill?.listingUrl ?? "",
    propertyType: prefill?.propertyType ?? "Byt",
    locality: prefill?.locality ?? "",
    purpose: "bydleni",
    email: "",
    phone: "",
    note: "",
    companyWebsite: "",
    consent: false,
  };
}

export function PropertyAuditInquiryForm({
  className,
  id = "posoudit",
  caseStudySlug,
  prefill,
}: {
  className?: string;
  id?: string;
  caseStudySlug?:
    | "byt-dlouhodoby-pronajem"
    | "dum-pred-rekonstrukci"
    | "mensi-bytovy-dum";
  prefill?: PropertyAuditPrefill;
}) {
  const context = prefill ?? {};
  const [form, setForm] = useState<FormState>(() => emptyForm(context));
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitPropertyAuditInquiryAction({
        listingUrl: form.listingUrl || context.listingUrl || "",
        propertyType: form.propertyType,
        locality: form.locality || context.locality || "",
        purpose: form.purpose,
        email: form.email,
        phone: form.phone,
        note: form.note,
        companyWebsite: form.companyWebsite,
        caseStudySlug,
        consent: form.consent ? true : undefined,
        propertyId: context.propertyId,
        title: context.title,
        askingPrice: context.askingPrice ?? undefined,
        currency: context.currency,
        transactionType:
          context.transactionType === "RENT" || context.transactionType === "SALE"
            ? context.transactionType
            : undefined,
        layout: context.layout,
        usableArea: context.usableArea ?? undefined,
      });
      if (!result.ok) {
        setSuccessId(null);
        setError(result.error);
        return;
      }
      setSuccessId(result.correlationId);
      setForm(emptyForm(context));
    });
  }

  if (successId) {
    return (
      <div
        id={id}
        className={cn(
          "rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 sm:p-8",
          className,
        )}
      >
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--action-accent)]">
          Nezávazná poptávka přijata
        </p>
        <h3 className="mt-2 font-display text-2xl text-[var(--text-primary)]">
          Děkujeme — údaje jsme uložili
        </h3>
        <p className="mt-3 text-[var(--text-secondary)]">
          Ozveme se s doplněním podkladů. Reference poptávky:{" "}
          <span className="font-mono text-sm text-[var(--text-primary)]">
            {successId}
          </span>
          . Nejde o objednávku ani platbu.
        </p>
        <button
          type="button"
          className="mt-6 text-sm font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
          onClick={() => setSuccessId(null)}
        >
          Odeslat další poptávku
        </button>
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className={cn(
        "relative rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 sm:p-8",
        className,
      )}
      noValidate
    >
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Nezávazná poptávka
      </p>
      <h3 className="mt-2 font-display text-2xl text-[var(--text-primary)]">
        {context.propertyId ? "Analýza této nemovitosti" : "Posoudit moji nemovitost"}
      </h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {context.propertyId
          ? "Údaje z nabídky už máme — doplňte účel, kontakt a případnou poznámku. Odesláním nevzniká objednávka ani platba."
          : "Pošlete odkaz na inzerát nebo základní údaje. Odesláním nevzniká objednávka ani platba."}
      </p>

      {context.propertyId ? (
        <div className="mt-5 flex gap-3 rounded-xl border border-[var(--border-default)] p-3">
          {context.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={context.photoUrl}
              alt=""
              className="h-16 w-20 rounded object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-medium text-[var(--text-primary)]">
              {context.title ?? "Vybraná nemovitost"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{context.locality}</p>
            {context.askingPrice != null ? (
              <p className="mt-1 font-metric text-sm">
                {formatCzk(context.askingPrice)}
                {context.currency && context.currency !== "CZK"
                  ? ` ${context.currency}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {!context.propertyId ? (
          <>
            <label className="sm:col-span-2 block space-y-1.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Odkaz na inzerát{" "}
                <span className="font-normal text-[var(--text-muted)]">(nepovinné)</span>
              </span>
              <input
                type="url"
                name="listingUrl"
                value={form.listingUrl}
                onChange={(e) => update("listingUrl", e.target.value)}
                placeholder="https://"
                className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
                autoComplete="url"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Typ nemovitosti
              </span>
              <select
                name="propertyType"
                value={form.propertyType}
                onChange={(e) => update("propertyType", e.target.value)}
                className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
                required
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Lokalita
              </span>
              <input
                type="text"
                name="locality"
                value={form.locality}
                onChange={(e) => update("locality", e.target.value)}
                placeholder="Město / městská část"
                className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
                required
                autoComplete="address-level2"
              />
            </label>
          </>
        ) : null}

        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Účel</span>
          <select
            name="purpose"
            value={form.purpose}
            onChange={(e) =>
              update("purpose", e.target.value as FormState["purpose"])
            }
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
            required
          >
            {PURPOSE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">E-mail</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
            required
            autoComplete="email"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Telefon{" "}
            <span className="font-normal text-[var(--text-muted)]">(nepovinné)</span>
          </span>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
            autoComplete="tel"
          />
        </label>

        <label className="sm:col-span-2 block space-y-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Poznámka / podklady
          </span>
          <textarea
            name="note"
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Co už víte, co ověřit, odkaz na dokumenty…"
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Website
          <input
            type="text"
            name="companyWebsite"
            tabIndex={-1}
            autoComplete="off"
            value={form.companyWebsite}
            onChange={(e) => update("companyWebsite", e.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-1"
          required
        />
        <span>
          Souhlasím se zpracováním údajů pro vyřízení této nezávazné poptávky.
        </span>
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-[var(--text-inverse)] disabled:opacity-60"
      >
        {pending ? "Odesílám…" : "Odeslat poptávku"}
      </button>
    </form>
  );
}
