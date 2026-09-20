"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, MapPin, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchMode = "koupit" | "pronajmout" | "investovat";

const MODES: Array<{ id: SearchMode; label: string }> = [
  { id: "koupit", label: "Koupit" },
  { id: "pronajmout", label: "Pronajmout" },
  { id: "investovat", label: "Investovat" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Byt nebo dům" },
  { value: "byt", label: "Byt" },
  { value: "dum", label: "Dům" },
  { value: "pozemek", label: "Pozemek" },
  { value: "komerce", label: "Komerční" },
];

const PRICE_OPTIONS = [
  { value: "", label: "Cena do" },
  { value: "3000000", label: "3 mil. Kč" },
  { value: "5000000", label: "5 mil. Kč" },
  { value: "8000000", label: "8 mil. Kč" },
  { value: "12000000", label: "12 mil. Kč" },
  { value: "20000000", label: "20 mil. Kč" },
];

const fieldClass =
  "flex h-12 w-full items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-primary)] focus-within:border-[var(--action-accent)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]";

export function HomeSearchPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("koupit");
  const [typ, setTyp] = useState("");
  const [lokalita, setLokalita] = useState("");
  const [cenaDo, setCenaDo] = useState("");

  function buildHref(extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (mode === "pronajmout") params.set("nabidka", "pronajem");
    else params.set("nabidka", "prodej");
    if (mode === "investovat") {
      params.set("razeni", "hruby-vynos");
      params.set("jen-vypoctene", "1");
    }
    if (typ) params.set("typ", typ);
    if (lokalita.trim()) params.set("lokalita", lokalita.trim());
    if (cenaDo) params.set("cena-do", cenaDo);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/nemovitosti?${qs}` : "/nemovitosti";
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildHref());
  }

  return (
    <div className="relative z-10 -mt-6 sm:-mt-10">
      <form
        onSubmit={onSubmit}
        className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-card)] sm:p-5"
        aria-label="Vyhledávání nemovitostí"
      >
        <div
          className="flex flex-wrap gap-1 border-b border-[var(--border-default)] pb-3"
          role="tablist"
          aria-label="Režim hledání"
        >
          {MODES.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(item.id)}
                className={cn(
                  "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-[var(--action-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                )}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-3 h-0.5 rounded-full bg-[var(--action-accent)]" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr_1fr_auto_auto]">
          <label className={fieldClass}>
            <Building2 className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <span className="sr-only">Typ nemovitosti</span>
            <select
              name="typ"
              value={typ}
              onChange={(e) => setTyp(e.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldClass}>
            <MapPin className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <span className="sr-only">Místo nebo lokalita</span>
            <input
              name="lokalita"
              value={lokalita}
              onChange={(e) => setLokalita(e.target.value)}
              placeholder="Místo nebo lokalita"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-muted)]"
              autoComplete="address-level2"
            />
          </label>

          <label className={fieldClass}>
            <Wallet className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <span className="sr-only">Cena do</span>
            <select
              name="cena-do"
              value={cenaDo}
              onChange={(e) => setCenaDo(e.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none"
            >
              {PRICE_OPTIONS.map((option) => (
                <option key={option.value || "any"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--action-accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--action-accent-hover)]"
          >
            Hledat nemovitosti
          </button>

          <Link
            href={buildHref()}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--background-primary)]"
          >
            Podrobné filtry
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            href="/nemovitosti?nabidka=prodej&razeni=hruby-vynos&jen-vypoctene=1"
            className="font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
          >
            Investiční filtry
          </Link>
          <Link
            href="/ucet/oblibene"
            className="text-[var(--text-secondary)] underline-offset-2 hover:underline"
          >
            Uložené nabídky
          </Link>
          <Link
            href="/sluzby/analyza-pred-koupi#poptavka"
            className="text-[var(--text-muted)] underline-offset-2 hover:underline"
          >
            Už máte vybráno? Nechte si nemovitost posoudit.
          </Link>
        </div>
      </form>
    </div>
  );
}
