"use client";

import { useState, useTransition } from "react";

import { submitPropertyAuditInquiryAction } from "@/lib/leads/property-audit-actions";
import { cn } from "@/lib/utils";

const PURPOSE_OPTIONS = [
  { value: "bydleni", label: "Vlastní bydlení" },
  { value: "pronajem", label: "Pronájem" },
  { value: "rekonstrukce", label: "Rekonstrukce" },
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

const INITIAL: FormState = {
  listingUrl: "",
  propertyType: "Byt",
  locality: "",
  purpose: "pronajem",
  email: "",
  phone: "",
  note: "",
  companyWebsite: "",
  consent: false,
};

export function PropertyAuditInquiryForm({
  className,
  id = "posoudit",
  caseStudySlug,
}: {
  className?: string;
  id?: string;
  caseStudySlug?:
    | "byt-dlouhodoby-pronajem"
    | "dum-pred-rekonstrukci"
    | "mensi-bytovy-dum";
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
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
        listingUrl: form.listingUrl,
        propertyType: form.propertyType,
        locality: form.locality,
        purpose: form.purpose,
        email: form.email,
        phone: form.phone,
        note: form.note,
        companyWebsite: form.companyWebsite,
        caseStudySlug,
        consent: form.consent ? true : undefined,
      });
      if (!result.ok) {
        setSuccessId(null);
        setError(result.error);
        return;
      }
      setSuccessId(result.correlationId);
      setForm(INITIAL);
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
        Posoudit moji nemovitost
      </h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Pošlete odkaz na inzerát nebo základní údaje. Automatické načtení inzerátu
        zatím není dostupné — podklady doplníme při zpracování. Odesláním
        nevzniká objednávka ani platba.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 block space-y-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Odkaz na inzerát{" "}
            <span className="font-normal text-[var(--text-muted)]">
              (nepovinné)
            </span>
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

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Účel
          </span>
          <select
            name="purpose"
            value={form.purpose}
            onChange={(e) =>
              update(
                "purpose",
                e.target.value as FormState["purpose"],
              )
            }
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
            required
          >
            {PURPOSE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            E-mail
          </span>
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
            <span className="font-normal text-[var(--text-muted)]">
              (nepovinné)
            </span>
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
            Poznámka
          </span>
          <textarea
            name="note"
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2.5 text-sm"
          />
        </label>

        {/* Honeypot */}
        <label className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          Web společnosti
          <input
            type="text"
            name="companyWebsite"
            value={form.companyWebsite}
            onChange={(e) => update("companyWebsite", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-1"
          required
        />
        <span>
          Souhlasím se zpracováním údajů pro vyřízení této nezávazné poptávky.
          Podrobnosti v{" "}
          <a
            href="/ochrana-soukromi"
            className="underline underline-offset-2 hover:text-[var(--text-primary)]"
          >
            ochraně soukromí
          </a>
          .
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-[var(--status-danger-border,var(--border-strong))] bg-[var(--status-danger-bg,transparent)] px-3 py-2 text-sm text-[var(--action-destructive)]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--action-primary-hover)] disabled:opacity-60"
      >
        {pending ? "Odesílám…" : "Odeslat k posouzení"}
      </button>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Po odeslání vás budeme kontaktovat ohledně podkladů a termínu. Případné
        financování řešíme samostatně až po analýze.
      </p>
    </form>
  );
}
