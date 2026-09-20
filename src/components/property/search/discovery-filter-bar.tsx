"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import * as React from "react";

import { InfoTooltip, TooltipProvider } from "@/components/overlays/tooltip";
import { ActiveFilterChips } from "@/components/property/search/active-filter-chips";
import { MapFilter } from "@/components/property/search/map-filter";
import { Button } from "@/components/ui/button";
import {
  formulaTooltip,
  SEARCH_FORMULA_KEYS,
} from "@/domains/investment/metrics/search-methodology";
import {
  AMENITY_OPTIONS,
  CASHFLOW_QUICK,
  CONSTRUCTION_OPTIONS,
  DISCOUNT_QUICK,
  FURNISHING_OPTIONS,
  INVESTOR_PRESETS,
  OCCUPANCY_QUICK,
  OFFER_OPTIONS,
  PAYBACK_QUICK,
  RENOVATION_LEVELS,
  RISK_OPTIONS,
  SCORE_QUICK,
  SELLER_OPTIONS,
  YIELD_QUICK,
  type InvestorPreset,
} from "@/domains/properties/search/filter-catalog";
import {
  DISPOZICE_OPTIONS,
  ENERGIE_OPTIONS,
  RAZENI_OPTIONS,
  STAV_OPTIONS,
  TYP_OPTIONS,
  VLASTNICTVI_OPTIONS,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-primary)]";

function layoutLabel(value: string): string {
  if (value === "6plus") return "6+";
  if (value === "atypicky") return "Atypický";
  return value;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function resultCta(count: number, dirty: boolean): string {
  if (dirty) return "Použít filtry";
  if (count === 1) return "Zobrazit 1 nemovitost";
  if (count >= 2 && count <= 4) return `Zobrazit ${count} nemovitosti`;
  return `Zobrazit ${count} nemovitostí`;
}

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-slate-400",
      )}
    >
      {children}
    </button>
  );
}

function RangePair({
  min,
  max,
  minLabel,
  maxLabel,
  onMin,
  onMax,
}: {
  min?: number;
  max?: number;
  minLabel: string;
  maxLabel: string;
  onMin: (value: number | undefined) => void;
  onMax: (value: number | undefined) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs text-[var(--text-muted)]">
        {minLabel}
        <input
          className={cn(inputClass, "mt-1")}
          inputMode="decimal"
          value={min ?? ""}
          onChange={(event) => {
            const next = event.target.value.trim();
            const parsed = Number(next.replace(",", "."));
            onMin(next === "" || !Number.isFinite(parsed) ? undefined : parsed);
          }}
        />
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        {maxLabel}
        <input
          className={cn(inputClass, "mt-1")}
          inputMode="decimal"
          value={max ?? ""}
          onChange={(event) => {
            const next = event.target.value.trim();
            const parsed = Number(next.replace(",", "."));
            onMax(next === "" || !Number.isFinite(parsed) ? undefined : parsed);
          }}
        />
      </label>
    </div>
  );
}

function Menu({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-xl border px-3 text-sm",
          active
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-primary)]",
        )}
      >
        {label}
        <ChevronDown className="size-4 opacity-70" aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-80 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 shadow-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DiscoveryFilterBar({
  draft,
  applied,
  onChange,
  onCommit,
  resultCount,
}: {
  draft: PropertyUrlFilterState;
  applied: PropertyUrlFilterState;
  onChange: (patch: Partial<PropertyUrlFilterState>) => void;
  onCommit: (next?: PropertyUrlFilterState) => void;
  resultCount: number;
}) {
  const [drawer, setDrawer] = React.useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const cta = resultCta(resultCount, dirty);

  function applyPreset(preset: InvestorPreset) {
    const active = Object.entries(preset.patch).every(([key, value]) => {
      const current = draft[key as keyof PropertyUrlFilterState];
      if (Array.isArray(value)) {
        return Array.isArray(current) && value.every((item) => current.includes(item));
      }
      return current === value;
    });
    const cleared: Partial<PropertyUrlFilterState> = { stitky: [] };
    for (const key of Object.keys(preset.patch) as (keyof PropertyUrlFilterState)[]) {
      const value = preset.patch[key];
      (cleared as Record<string, unknown>)[key] = Array.isArray(value) ? [] : undefined;
    }
    const next: PropertyUrlFilterState = active
      ? { ...draft, ...cleared, stranka: 1 }
      : { ...draft, ...preset.patch, stitky: [], stranka: 1 };
    onChange(active ? cleared : { ...preset.patch, stitky: [] });
    onCommit(next);
  }

  const drawerBody = (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-xl">Standardní filtry</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Typ nabídky, stav, vlastnictví a příslušenství.
          </p>
        </header>
        <MapFilter
          selectedRegions={draft.kraje}
          onChange={(kraje) => onChange({ kraje })}
          collapsible
        />
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Typ nabídky
          </p>
          <div className="flex flex-wrap gap-2">
            {OFFER_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={draft.nabidka === option.value}
                onClick={() =>
                  onChange({
                    nabidka: draft.nabidka === option.value ? undefined : option.value,
                  })
                }
              >
                {option.label}
                {"unavailable" in option && option.unavailable ? " · bez dat" : ""}
              </Pill>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Dražba a podíl se uloží do adresy, ale zatím se nefiltrují — chybí zdroj.
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Stav
          </p>
          <div className="flex flex-wrap gap-2">
            {STAV_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={draft.stav.includes(option.value)}
                onClick={() => onChange({ stav: toggle(draft.stav, option.value) })}
              >
                {option.label}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Vlastnictví
          </p>
          <div className="flex flex-wrap gap-2">
            {VLASTNICTVI_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={draft.vlastnictvi.includes(option.value)}
                onClick={() =>
                  onChange({ vlastnictvi: toggle(draft.vlastnictvi, option.value) })
                }
              >
                {option.label}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Typ stavby
          </p>
          <div className="flex flex-wrap gap-2">
            {CONSTRUCTION_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={draft.typStavby.includes(option.value)}
                onClick={() =>
                  onChange({ typStavby: toggle(draft.typStavby, option.value) })
                }
              >
                {option.label}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            PENB
          </p>
          <div className="flex flex-wrap gap-2">
            {ENERGIE_OPTIONS.map((option) => (
              <Pill
                key={option}
                active={draft.energie.includes(option)}
                onClick={() => onChange({ energie: toggle(draft.energie, option) })}
              >
                {option}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Příslušenství
          </p>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={draft.prislusenstvi.includes(option.value)}
                onClick={() =>
                  onChange({
                    prislusenstvi: toggle(draft.prislusenstvi, option.value),
                  })
                }
              >
                {option.label}
              </Pill>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Filtr „Balkon“ = potvrzené Ano. „Bez balkonu“ = potvrzené Ne. Neuvedené
            nabídky nepatří do žádné z těchto skupin.
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Vybavení
          </p>
          <div className="flex flex-wrap gap-2">
            {FURNISHING_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={draft.vybaveni === option.value}
                onClick={() =>
                  onChange({
                    vybaveni: draft.vybaveni === option.value ? undefined : option.value,
                  })
                }
              >
                {option.label}
              </Pill>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Vybavení se ukládá do adresy. Zatím nemá spolehlivý datový sloupec, proto neskrývá nabídky.
          </p>
        </div>
        <RangePair
          min={draft.patroOd}
          max={draft.patroDo}
          minLabel="Patro od"
          maxLabel="Patro do"
          onMin={(patroOd) => onChange({ patroOd })}
          onMax={(patroDo) => onChange({ patroDo })}
        />
        <div className="flex flex-wrap gap-2">
          <Pill active={draft.prizemi === true} onClick={() => onChange({ prizemi: !draft.prizemi })}>
            Přízemí
          </Pill>
          <Pill
            active={draft.posledniPatro === true}
            onClick={() => onChange({ posledniPatro: !draft.posledniPatro })}
          >
            Poslední patro
          </Pill>
        </div>
        <RangePair
          min={draft.rokOd}
          max={draft.rokDo}
          minLabel="Rok výstavby od"
          maxLabel="Rok výstavby do"
          onMin={(rokOd) => onChange({ rokOd })}
          onMax={(rokDo) => onChange({ rokDo })}
        />
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Prodejce
          </p>
          <div className="flex flex-wrap gap-2">
            {SELLER_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={draft.prodejce.includes(option.value)}
                onClick={() => onChange({ prodejce: toggle(draft.prodejce, option.value) })}
              >
                {option.label}
              </Pill>
            ))}
          </div>
        </div>
        <label className="block text-xs text-[var(--text-muted)]">
          Radius v km
          <input
            className={cn(inputClass, "mt-1")}
            inputMode="decimal"
            value={draft.radiusKm ?? ""}
            onChange={(event) => {
              const next = event.target.value.trim();
              onChange({ radiusKm: next === "" ? undefined : Number(next) });
            }}
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Text hledá město, okres, obec i městskou část. Kraje vyberete níže na mapě.
            Stát je zatím Česko a Slovensko. Radius se uloží, ale filtruje až po napojení mapového středu.
          </p>
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <Pill active={draft.ihned === true} onClick={() => onChange({ ihned: !draft.ihned || undefined })}>
            Ihned k nastěhování
          </Pill>
          <Pill
            active={draft.pouzeNove === true}
            onClick={() => onChange({ pouzeNove: !draft.pouzeNove || undefined })}
          >
            Pouze nové nabídky
          </Pill>
          <Pill
            active={draft.pouzeZlevnene === true}
            onClick={() => onChange({ pouzeZlevnene: !draft.pouzeZlevnene || undefined })}
          >
            Pouze zlevněné
          </Pill>
          <Pill
            active={draft.bezRezervovanych === true}
            onClick={() => onChange({ bezRezervovanych: !draft.bezRezervovanych || undefined })}
          >
            Bez rezervovaných
          </Pill>
          <Pill
            active={draft.bezCenyNaVyzadani === true}
            onClick={() =>
              onChange({ bezCenyNaVyzadani: !draft.bezCenyNaVyzadani || undefined })
            }
          >
            Bez ceny na vyžádání
          </Pill>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Po rekonstrukci a v rekonstrukci nemají vlastní stav v datech. Před rekonstrukcí a k demolici
          se filtrují podle stavu nemovitosti. Příznaky bez sloupce se uloží do adresy a nabídky neskryjí.
        </p>
      </section>

      <section className="space-y-5 rounded-2xl border border-[color-mix(in_srgb,var(--action-accent)_35%,var(--border-default))] bg-[color-mix(in_srgb,var(--action-accent)_6%,var(--surface-primary))] p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Investiční filtry</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Odhad není ověřený údaj. Chybějící metrika nabídku neskryje, dokud nezapnete výpočet.
            </p>
          </div>
          <InfoTooltip label="Metodika výnosu" content={formulaTooltip(SEARCH_FORMULA_KEYS.grossYield)} />
        </header>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.jenVypoctene === true}
            onChange={(event) => onChange({ jenVypoctene: event.target.checked || undefined })}
          />
          Pouze nabídky s vypočtenými investičními daty
        </label>
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Odhadované měsíční nájemné
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[0.65rem] text-amber-900">Odhad</span>
          </div>
          <RangePair
            min={draft.najemOd}
            max={draft.najemDo}
            minLabel="Od Kč"
            maxLabel="Do Kč"
            onMin={(najemOd) => onChange({ najemOd })}
            onMax={(najemDo) => onChange({ najemDo })}
          />
          <div className="mt-3">
            <RangePair
              min={draft.najemM2Od}
              max={draft.najemM2Do}
              minLabel="Kč/m² od"
              maxLabel="Kč/m² do"
              onMin={(najemM2Od) => onChange({ najemM2Od })}
              onMax={(najemM2Do) => onChange({ najemM2Do })}
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Hrubý výnos
            <InfoTooltip label="Hrubý výnos" content={formulaTooltip(SEARCH_FORMULA_KEYS.grossYield)} />
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {YIELD_QUICK.map((value) => (
              <Pill key={value} active={draft.roiOd === value} onClick={() => onChange({ roiOd: value })}>
                {value} %+
              </Pill>
            ))}
          </div>
          <RangePair
            min={draft.roiOd}
            max={draft.vynosDo}
            minLabel="Od %"
            maxLabel="Do %"
            onMin={(roiOd) => onChange({ roiOd })}
            onMax={(vynosDo) => onChange({ vynosDo })}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Čistý výnos
            <InfoTooltip label="Čistý výnos" content={formulaTooltip(SEARCH_FORMULA_KEYS.netYield)} />
          </div>
          <RangePair
            min={draft.cistyVynosOd}
            max={draft.cistyVynosDo}
            minLabel="Od %"
            maxLabel="Do %"
            onMin={(cistyVynosOd) => onChange({ cistyVynosOd })}
            onMax={(cistyVynosDo) => onChange({ cistyVynosDo })}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Cashflow
            <InfoTooltip label="Cashflow" content={formulaTooltip(SEARCH_FORMULA_KEYS.cashflow)} />
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {CASHFLOW_QUICK.map((value) => (
              <Pill
                key={value}
                active={draft.cashflowOd === value}
                onClick={() => onChange({ cashflowOd: value })}
              >
                ≥ {new Intl.NumberFormat("cs-CZ").format(value)} Kč
              </Pill>
            ))}
          </div>
          <RangePair
            min={draft.cashflowOd}
            max={draft.cashflowDo}
            minLabel="Od Kč/měs."
            maxLabel="Do Kč/měs."
            onMin={(cashflowOd) => onChange({ cashflowOd })}
            onMax={(cashflowDo) => onChange({ cashflowDo })}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Cash-on-cash
            <InfoTooltip label="Cash-on-cash" content={formulaTooltip(SEARCH_FORMULA_KEYS.cashOnCash)} />
          </div>
          <RangePair
            min={draft.cocOd}
            max={draft.cocDo}
            minLabel="Od %"
            maxLabel="Do %"
            onMin={(cocOd) => onChange({ cocOd })}
            onMax={(cocDo) => onChange({ cocDo })}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Návratnost
            <InfoTooltip label="Návratnost" content={formulaTooltip(SEARCH_FORMULA_KEYS.payback)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {PAYBACK_QUICK.map((value) => (
              <Pill
                key={value}
                active={draft.navratnostDo === value}
                onClick={() => onChange({ navratnostDo: value, navratnostOd: undefined })}
              >
                do {value} let
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Rekonstrukce
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            {RENOVATION_LEVELS.map((option) => (
              <Pill
                key={option.value}
                active={draft.urovenRekonstrukce.includes(option.value)}
                onClick={() =>
                  onChange({
                    urovenRekonstrukce: toggle(draft.urovenRekonstrukce, option.value),
                  })
                }
              >
                {option.label}
              </Pill>
            ))}
          </div>
          <RangePair
            min={draft.rekonstrukceOd}
            max={draft.rekonstrukceDo}
            minLabel="Náklady od"
            maxLabel="Náklady do"
            onMin={(rekonstrukceOd) => onChange({ rekonstrukceOd })}
            onMax={(rekonstrukceDo) => onChange({ rekonstrukceDo })}
          />
          <label className="mt-3 block text-xs text-[var(--text-muted)]">
            Výnos po rekonstrukci od %
            <input
              className={cn(inputClass, "mt-1")}
              inputMode="decimal"
              value={draft.vynosPoRekonstrukci ?? ""}
              onChange={(event) => {
                const next = event.target.value.trim();
                onChange({
                  vynosPoRekonstrukci: next === "" ? undefined : Number(next.replace(",", ".")),
                });
              }}
            />
          </label>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            All-in cost
            <InfoTooltip label="All-in cost" content={formulaTooltip(SEARCH_FORMULA_KEYS.allIn)} />
          </div>
          <RangePair
            min={draft.allInOd}
            max={draft.allInDo}
            minLabel="Od Kč"
            maxLabel="Do Kč"
            onMin={(allInOd) => onChange({ allInOd })}
            onMax={(allInDo) => onChange({ allInDo })}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Diskont vůči odhadu hodnoty
          </p>
          <div className="flex flex-wrap gap-2">
            {DISCOUNT_QUICK.map((value) => (
              <Pill
                key={value}
                active={draft.diskontOd === value}
                onClick={() => onChange({ diskontOd: value })}
              >
                {value} %+ pod odhadem
              </Pill>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 80, label: "80+ velmi vysoká" },
            { value: 65, label: "65+ vysoká" },
            { value: 45, label: "45+ střední" },
          ].map((option) => (
            <Pill
              key={option.value}
              active={draft.poptavkaOd === option.value}
              onClick={() => onChange({ poptavkaOd: option.value })}
            >
              {option.label}
            </Pill>
          ))}
        </div>
        <RangePair
          min={draft.poptavkaOd}
          max={draft.poptavkaDo}
          minLabel="Poptávka od"
          maxLabel="Poptávka do"
          onMin={(poptavkaOd) => onChange({ poptavkaOd })}
          onMax={(poptavkaDo) => onChange({ poptavkaDo })}
        />
        <p className="text-xs text-[var(--text-muted)]">
          80–100 velmi vysoká, 65–79 vysoká, 45–64 střední, 0–44 nízká. Bez dat zůstává skóre prázdné.
        </p>
        <div className="flex flex-wrap gap-2">
          {OCCUPANCY_QUICK.map((value) => (
            <Pill
              key={value}
              active={draft.obsazenostOd === value}
              onClick={() => onChange({ obsazenostOd: value })}
            >
              Odhadovaná obsazenost {value} %+
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {RISK_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              active={draft.riziko.includes(option.value)}
              onClick={() => onChange({ riziko: toggle(draft.riziko, option.value) })}
            >
              Riziko {option.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SCORE_QUICK.map((value) => (
            <Pill
              key={value}
              active={draft.scoreOd === value}
              onClick={() => onChange({ scoreOd: value })}
            >
              Majetio Score {value}+
            </Pill>
          ))}
        </div>
        <label className="block text-xs text-[var(--text-muted)]">
          Data confidence od %
          <input
            className={cn(inputClass, "mt-1")}
            inputMode="decimal"
            value={draft.duveraOd ?? ""}
            onChange={(event) => {
              const next = event.target.value.trim();
              onChange({ duveraOd: next === "" ? undefined : Number(next) });
            }}
          />
          <span className="mt-1 block">
            90–100 vysoká, 70–89 dobrá, 50–69 omezená, pod 50 nízká. Vyjadřuje kvalitu vstupů, ne výnos.
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 90, label: "Vysoká 90+" },
            { value: 70, label: "Dobrá 70+" },
            { value: 50, label: "Omezená 50+" },
          ].map((option) => (
            <Pill
              key={option.value}
              active={draft.duveraOd === option.value}
              onClick={() => onChange({ duveraOd: option.value })}
            >
              {option.label}
            </Pill>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="sticky top-16 z-30 -mx-4 border-b border-[var(--border-default)] bg-[color-mix(in_srgb,var(--background-primary)_92%,white)] px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onCommit();
          }}
        >
          <Menu label="Lokalita" active={Boolean(draft.lokalita || draft.kraje.length)}>
            <label className="text-xs text-[var(--text-muted)]">
              Přesná lokalita
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.lokalita ?? ""}
                onChange={(event) =>
                  onChange({ lokalita: event.target.value.trim() || undefined })
                }
                placeholder="Praha, Brno-střed…"
              />
            </label>
          </Menu>
          <Menu label="Typ nemovitosti" active={draft.typ.length > 0}>
            <div className="flex flex-wrap gap-2">
              {TYP_OPTIONS.filter((option) => option.value !== "dum-na-klic").map((option) => (
                <Pill
                  key={option.value}
                  active={draft.typ.includes(option.value)}
                  onClick={() => onChange({ typ: toggle(draft.typ, option.value) })}
                >
                  {option.label}
                </Pill>
              ))}
            </div>
          </Menu>
          <Menu label="Dispozice" active={draft.dispozice.length > 0}>
            <div className="flex flex-wrap gap-2">
              {DISPOZICE_OPTIONS.map((option) => (
                <Pill
                  key={option}
                  active={draft.dispozice.includes(option)}
                  onClick={() => onChange({ dispozice: toggle(draft.dispozice, option) })}
                >
                  {layoutLabel(option)}
                </Pill>
              ))}
            </div>
          </Menu>
          <Menu label="Cena" active={draft.cenaOd != null || draft.cenaDo != null}>
            <RangePair
              min={draft.cenaOd}
              max={draft.cenaDo}
              minLabel="Cena od"
              maxLabel="Cena do"
              onMin={(cenaOd) => onChange({ cenaOd })}
              onMax={(cenaDo) => onChange({ cenaDo })}
            />
            <div className="mt-3">
              <RangePair
                min={draft.cenaM2Od}
                max={draft.cenaM2Do}
                minLabel="Kč/m² od"
                maxLabel="Kč/m² do"
                onMin={(cenaM2Od) => onChange({ cenaM2Od })}
                onMax={(cenaM2Do) => onChange({ cenaM2Do })}
              />
            </div>
          </Menu>
          <Menu
            label="Plocha"
            active={draft.plochaOd != null || draft.plochaDo != null || draft.pozemekOd != null}
          >
            <RangePair
              min={draft.plochaOd}
              max={draft.plochaDo}
              minLabel="Užitná od"
              maxLabel="Užitná do"
              onMin={(plochaOd) => onChange({ plochaOd })}
              onMax={(plochaDo) => onChange({ plochaDo })}
            />
            <div className="mt-3">
              <RangePair
                min={draft.plochaCelkovaOd}
                max={draft.plochaCelkovaDo}
                minLabel="Celková od"
                maxLabel="Celková do"
                onMin={(plochaCelkovaOd) => onChange({ plochaCelkovaOd })}
                onMax={(plochaCelkovaDo) => onChange({ plochaCelkovaDo })}
              />
            </div>
            <div className="mt-3">
              <RangePair
                min={draft.pozemekOd}
                max={draft.pozemekDo}
                minLabel="Pozemek od"
                maxLabel="Pozemek do"
                onMin={(pozemekOd) => onChange({ pozemekOd })}
                onMax={(pozemekDo) => onChange({ pozemekDo })}
              />
            </div>
          </Menu>
          <Menu label="Výnos" active={draft.roiOd != null}>
            <div className="flex flex-wrap gap-2">
              {YIELD_QUICK.map((value) => (
                <Pill key={value} active={draft.roiOd === value} onClick={() => onChange({ roiOd: value })}>
                  {value} %+
                </Pill>
              ))}
            </div>
          </Menu>
          <Button type="button" variant="secondary" onClick={() => setDrawer(true)}>
            <SlidersHorizontal className="size-4" aria-hidden />
            <span className="md:hidden">Filtry</span>
            <span className="hidden md:inline">Více filtrů</span>
          </Button>
          <label className="ml-auto hidden min-w-48 text-xs text-[var(--text-muted)] lg:block">
            Řazení
            <select
              className={cn(inputClass, "mt-1")}
              value={draft.razeni ?? "newest"}
              onChange={(event) => {
                const razeni = event.target.value as PropertyUrlFilterState["razeni"];
                const next = { ...draft, razeni, stranka: 1 };
                onChange({ razeni });
                onCommit(next);
              }}
            >
              {RAZENI_OPTIONS.map((option) => (
                <option key={option.sort} value={option.sort}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="hidden md:inline-flex">
            {cta}
          </Button>
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {INVESTOR_PRESETS.map((preset) => {
            const active = Object.entries(preset.patch).every(([key, value]) => {
              const current = draft[key as keyof PropertyUrlFilterState];
              if (Array.isArray(value)) {
                return Array.isArray(current) && value.every((item) => current.includes(item));
              }
              return current === value;
            });
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.description}
                aria-pressed={active}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-[color-mix(in_srgb,var(--action-accent)_40%,var(--border-default))] bg-[var(--surface-primary)]",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <ActiveFilterChips state={applied} className="mt-2" />
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Zavřít filtry"
            onClick={() => setDrawer(false)}
          />
          <div className="relative flex h-full w-full max-w-5xl flex-col bg-[var(--background-primary)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
              <h2 className="font-display text-lg">Filtry</h2>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Zavřít">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{drawerBody}</div>
            <div className="sticky bottom-0 border-t border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  onCommit();
                  setDrawer(false);
                }}
              >
                {cta}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-default)] bg-[var(--surface-primary)] p-3 md:hidden">
        <Button type="button" className="w-full" onClick={() => onCommit()}>
          {cta}
        </Button>
      </div>
    </TooltipProvider>
  );
}
