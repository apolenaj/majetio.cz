"use client";

import { CalendarDays, Heart, Share2 } from "lucide-react";

import { FinancingSummary } from "@/components/financing/financing-summary";
import { formatCzk } from "@/lib/format";

export type SellerCardProfile = {
  mode: "demo" | "live";
  displayName: string;
  company: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  initials: string;
  demoBadge?: string;
};

export const DEMO_SELLER_PROFILE: SellerCardProfile = {
  mode: "demo",
  displayName: "Adam Vzorový",
  company: "Ukázková realitní kancelář",
  role: "Realitní makléř",
  email: "adam@majetio-demo.example",
  phone: "+420 XXX XXX XXX",
  initials: "AV",
  demoBadge: "Ukázkový profil — fiktivní údaje",
};

export function PropertySellerCard({
  profile,
  askingPriceCzk,
  propertyUrl,
  onSave,
  onShare,
  savedLabel = "Uložit",
}: {
  profile: SellerCardProfile;
  askingPriceCzk?: number | null;
  propertyUrl?: string | null;
  onSave?: () => void;
  onShare?: () => void;
  savedLabel?: string;
}) {
  const isDemo = profile.mode === "demo";

  function demoContact(kind: "email" | "phone" | "tour" | "viewing") {
    window.alert(
      kind === "viewing"
        ? "Domluvení prohlídky je v ukázkovém režimu nedostupné. Kontakt je fiktivní."
        : "Toto je ukázkový kontakt. E-mail ani telefon neodesílají zprávy a nevytvářejí poptávku.",
    );
  }

  return (
    <aside className="seller-card is-sticky rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-[0_8px_28px_rgba(8,45,69,0.06)]">
      {isDemo && profile.demoBadge ? (
        <p className="mb-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-900">
          {profile.demoBadge}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--pd-teal-soft,#f4fafa)] font-display text-lg font-semibold text-[var(--pd-navy,#0b3550)]"
          aria-hidden
        >
          {profile.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--text-primary)]">
            {profile.displayName}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">{profile.role}</p>
          {profile.company ? (
            <p className="truncate text-xs text-[var(--text-muted)]">
              {profile.company}
            </p>
          ) : null}
        </div>
      </div>

      {askingPriceCzk != null && askingPriceCzk > 0 ? (
        <div className="mt-4 border-t border-[var(--border-default)] pt-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Cena nemovitosti
          </p>
          <p className="font-metric text-2xl text-[var(--pd-navy,#0b3550)]">
            {formatCzk(askingPriceCzk)}
          </p>
          <FinancingSummary
            propertyPriceCzk={askingPriceCzk}
            propertyUrl={propertyUrl}
            variant="compact"
            sourceContext="property_detail"
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--action-primary)] px-4 text-sm font-semibold text-white"
          onClick={() => (isDemo ? demoContact("tour") : undefined)}
        >
          Kontaktovat
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border-default)] px-4 text-sm font-semibold text-[var(--text-primary)]"
          onClick={() => (isDemo ? demoContact("viewing") : undefined)}
        >
          <CalendarDays className="size-4" aria-hidden />
          Domluvit prohlídku
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-3 py-2 text-xs font-medium"
          onClick={onSave}
        >
          <Heart className="size-3.5" aria-hidden />
          {savedLabel}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-3 py-2 text-xs font-medium"
          onClick={onShare}
        >
          <Share2 className="size-3.5" aria-hidden />
          Sdílet
        </button>
      </div>

      {isDemo ? (
        <div className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
          <p>E-mail: {profile.email} (neaktivní)</p>
          <p>Telefon: {profile.phone} (neaktivní)</p>
        </div>
      ) : (
        <div className="mt-4 space-y-1 text-xs text-[var(--text-secondary)]">
          {profile.email ? <p>{profile.email}</p> : null}
          {profile.phone ? <p>{profile.phone}</p> : null}
        </div>
      )}
    </aside>
  );
}
