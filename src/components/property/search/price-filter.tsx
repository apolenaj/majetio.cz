"use client";

import * as React from "react";

import { DualRangeSlider } from "@/components/property/search/dual-range-slider";
import {
  FilterAccordion,
  filterInputClassName,
} from "@/components/property/search/filter-accordion";
import { Label } from "@/components/forms/field";

export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 20_000_000;
export const PRICE_FILTER_STEP = 100_000;

function formatCzkCompact(value: number): string {
  if (value >= 1_000_000) {
    const mil = value / 1_000_000;
    return `${Number.isInteger(mil) ? mil : mil.toFixed(1)} mil. Kč`;
  }
  return `${new Intl.NumberFormat("cs-CZ").format(value)} Kč`;
}

export function PriceFilter({
  cenaOd,
  cenaDo,
  onChange,
}: {
  cenaOd?: number;
  cenaDo?: number;
  onChange: (next: { cenaOd?: number; cenaDo?: number }) => void;
}) {
  const sliderMin = cenaOd ?? PRICE_FILTER_MIN;
  const sliderMax = cenaDo ?? PRICE_FILTER_MAX;

  function commitInputs(odRaw: string, doRaw: string) {
    const parse = (raw: string) => {
      const cleaned = raw.replace(/\s/g, "");
      if (!cleaned) return undefined;
      const n = Number(cleaned);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    let od = parse(odRaw);
    let max = parse(doRaw);
    if (od != null && max != null && od > max) {
      [od, max] = [max, od];
    }
    onChange({ cenaOd: od, cenaDo: max });
  }

  return (
    <FilterAccordion
      title="Cena"
      description="Rozsah kupní ceny — posuvník nebo přesná čísla"
      defaultOpen
    >
      <div className="space-y-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="min-w-0">
            <Label htmlFor="cena-od" className="text-xs">
              Cena od
            </Label>
            <input
              id="cena-od"
              name="cena-od"
              inputMode="numeric"
              value={cenaOd ?? ""}
              placeholder="0"
              className={filterInputClassName}
              onChange={(e) =>
                onChange({
                  cenaOd: e.target.value === "" ? undefined : Number(e.target.value.replace(/\s/g, "")) || undefined,
                  cenaDo,
                })
              }
              onBlur={(e) =>
                commitInputs(e.target.value, String(cenaDo ?? ""))
              }
            />
          </div>
          <span
            className="mb-3 text-sm text-[var(--text-muted)]"
            aria-hidden
          >
            –
          </span>
          <div className="min-w-0">
            <Label htmlFor="cena-do" className="text-xs">
              Cena do
            </Label>
            <input
              id="cena-do"
              name="cena-do"
              inputMode="numeric"
              value={cenaDo ?? ""}
              placeholder="Bez limitu"
              className={filterInputClassName}
              onChange={(e) =>
                onChange({
                  cenaOd,
                  cenaDo:
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value.replace(/\s/g, "")) || undefined,
                })
              }
              onBlur={(e) =>
                commitInputs(String(cenaOd ?? ""), e.target.value)
              }
            />
          </div>
        </div>

        <div>
          <DualRangeSlider
            min={PRICE_FILTER_MIN}
            max={PRICE_FILTER_MAX}
            step={PRICE_FILTER_STEP}
            valueMin={sliderMin}
            valueMax={sliderMax}
            ariaLabelMin="Cena od"
            ariaLabelMax="Cena do"
            onChange={({ min, max }) => {
              onChange({
                cenaOd: min <= PRICE_FILTER_MIN ? undefined : min,
                cenaDo: max >= PRICE_FILTER_MAX ? undefined : max,
              });
            }}
          />
          <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
            <span>{formatCzkCompact(sliderMin)}</span>
            <span>{formatCzkCompact(sliderMax)}</span>
          </div>
        </div>
      </div>
    </FilterAccordion>
  );
}
