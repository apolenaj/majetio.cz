"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Heart, MapPin, Wallet } from "lucide-react";

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
  "flex h-12 w-full items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--brand-warm-white,#fcfbf8)] px-3.5 text-sm text-[var(--text-primary)] focus-within:border-[var(--action-accent)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]";

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
    <div className="relative z-10">
      <form
        onSubmit={onSubmit}
        className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white px-4 py-4 shadow-[var(--shadow-card)] sm:px-5 sm:py-4"
        aria-label="Vyhledávání nemovitostí"
      >
        <div
          className="flex flex-wrap gap-1 border-b border-[var(--border-default)] pb-2.5"
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
                  "relative rounded-sm px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-[var(--action-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                )}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-2.5 -bottom-2.5 h-0.5 rounded-full bg-[var(--action-accent)]" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 grid gap-2.5 lg:grid-cols-[1fr_1.3fr_1fr_auto_auto]">
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
            <span className="sr-only">Město nebo lokalita</span>
            <input
              name="lokalita"
              value={lokalita}
              onChange={(e) => setLokalita(e.target.value)}
              placeholder="Město nebo lokalita"
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
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--background-primary)]"
          >
            Podrobné filtry
          </Link>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0.5 text-sm">
        <Link
          href="/nemovitosti?nabidka=prodej&razeni=hruby-vynos&jen-vypoctene=1"
          className="font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
        >
          Investiční filtry
        </Link>
        <span className="text-[var(--border-strong)]" aria-hidden>
          |
        </span>
        <Link
          href="/ucet/oblibene"
          className="inline-flex items-center gap-1.5 font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
        >
          <Heart className="size-3.5" aria-hidden />
          Uložené nabídky
        </Link>
      </div>
    </div>
  );
}
