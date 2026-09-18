"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";

import { InfoTooltip } from "@/components/overlays/tooltip";
import {
  FilterAccordion,
  filterInputClassName,
} from "@/components/property/search/filter-accordion";
import { Label } from "@/components/forms/field";

const ROI_TOOLTIP =
  "Očekávaná roční návratnost investice vypočítaná z poměru čistého ročního nájmu a celkové pořizovací ceny nemovitosti (včetně případné rekonstrukce).";

const CASHFLOW_TOOLTIP =
  "Odhadovaný čistý měsíční zisk z pronájmu po odečtení předpokládané splátky hypotéky, příspěvků do fondu oprav a dalších provozních nákladů.";

function LabelWithInfo({
  htmlFor,
  children,
  infoLabel,
  info,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  infoLabel: string;
  info: string;
}) {
  return (
    <div className="mb-1.5 flex min-w-0 items-center gap-0.5">
      <Label htmlFor={htmlFor} className="mb-0 text-xs">
        {children}
      </Label>
      <InfoTooltip
        label={infoLabel}
        content={info}
        className="size-7 shrink-0 text-[var(--text-muted)]"
      />
    </div>
  );
}

export function InvestmentFilter({
  roiOd,
  cashflowOd,
  rekonstrukceOd,
  rekonstrukceDo,
  onChange,
}: {
  roiOd?: number;
  cashflowOd?: number;
  rekonstrukceOd?: number;
  rekonstrukceDo?: number;
  onChange: (patch: {
    roiOd?: number;
    cashflowOd?: number;
    rekonstrukceOd?: number;
    rekonstrukceDo?: number;
  }) => void;
}) {
  return (
    <FilterAccordion
      title="Investiční analýza"
      description="Prémiové metriky pro výnosové filtry"
      defaultOpen
      className="border-[color-mix(in_srgb,var(--action-accent)_28%,var(--border-default))] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--action-accent)_6%,var(--surface-primary)),var(--surface-primary))]"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--action-accent)]/12 px-2 py-0.5 text-[0.65rem] font-medium text-[var(--action-accent)]">
          <Sparkles className="size-3" aria-hidden />
          Premium
        </span>
      }
    >
      <div className="space-y-5">
        <div className="min-w-0">
          <LabelWithInfo htmlFor="roi-od" infoLabel="Vysvětlení ROI" info={ROI_TOOLTIP}>
            ROI (%)
          </LabelWithInfo>
          <input
            id="roi-od"
            name="roi-od"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={roiOd ?? ""}
            placeholder="např. 5"
            className={filterInputClassName}
            onChange={(e) =>
              onChange({
                roiOd:
                  e.target.value === "" ? undefined : Number(e.target.value),
                cashflowOd,
                rekonstrukceOd,
                rekonstrukceDo,
              })
            }
          />
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Minimální požadovaná roční návratnost
          </p>
        </div>

        <div className="min-w-0">
          <LabelWithInfo
            htmlFor="cashflow-od"
            infoLabel="Vysvětlení cashflow"
            info={CASHFLOW_TOOLTIP}
          >
            Cashflow (Kč/měsíc)
          </LabelWithInfo>
          <input
            id="cashflow-od"
            name="cashflow-od"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={cashflowOd ?? ""}
            placeholder="např. 5000"
            className={filterInputClassName}
            onChange={(e) =>
              onChange({
                roiOd,
                cashflowOd:
                  e.target.value === "" ? undefined : Number(e.target.value),
                rekonstrukceOd,
                rekonstrukceDo,
              })
            }
          />
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Minimální měsíční cashflow
          </p>
        </div>

        <div className="min-w-0">
          <Label className="text-xs">Cena rekonstrukce (Kč)</Label>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              name="rekonstrukce-od"
              type="number"
              inputMode="numeric"
              min={0}
              step={10000}
              value={rekonstrukceOd ?? ""}
              placeholder="Od"
              aria-label="Cena rekonstrukce od"
              className={filterInputClassName}
              onChange={(e) =>
                onChange({
                  roiOd,
                  cashflowOd,
                  rekonstrukceOd:
                    e.target.value === "" ? undefined : Number(e.target.value),
                  rekonstrukceDo,
                })
              }
            />
            <span className="text-sm text-[var(--text-muted)]" aria-hidden>
              –
            </span>
            <input
              name="rekonstrukce-do"
              type="number"
              inputMode="numeric"
              min={0}
              step={10000}
              value={rekonstrukceDo ?? ""}
              placeholder="Do"
              aria-label="Cena rekonstrukce do"
              className={filterInputClassName}
              onChange={(e) =>
                onChange({
                  roiOd,
                  cashflowOd,
                  rekonstrukceOd,
                  rekonstrukceDo:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      </div>
    </FilterAccordion>
  );
}
