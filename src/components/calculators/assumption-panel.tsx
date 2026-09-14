"use client";

import * as React from "react";

import { Field } from "@/components/forms/field";
import {
  CurrencyInput,
  NumberInput,
  PercentageInput,
} from "@/components/forms/inputs";
import { RangeSlider } from "@/components/forms/range-slider";
import { Button } from "@/components/ui/button";
import {
  ASSUMPTION_CATEGORY_LABELS,
  ASSUMPTION_FIELDS_BY_CATEGORY,
  FIELD_LABELS,
  isFieldModified,
  type AssumptionCategory,
  type OverridableField,
} from "@/domains/investment/hooks/assumption-baseline";
import type { InvestmentCalculatorInputs } from "@/domains/investment/hooks/calculator-inputs";
import {
  PROVENANCE_LABELS,
  type UiProvenanceSource,
} from "@/domains/investment/hooks/strategy";
import { formatCzk, formatPercentPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AssumptionSheet } from "./assumption-sheet";

const MONEY_FIELDS = new Set<OverridableField>([
  "purchasePrice",
  "equity",
  "loanAmount",
  "monthlyRent",
  "annualOpex",
  "acquisitionCosts",
  "renovation",
  "initialFurnishing",
  "fees",
  "repairFundAnnual",
]);

const PERCENT_FIELDS = new Set<OverridableField>([
  "interestRatePp",
  "vacancyPp",
  "appreciationPp",
  "rentGrowthPp",
  "expenseInflationPp",
  "sellingCostPp",
]);

const CATEGORIES: AssumptionCategory[] = [
  "income",
  "opex",
  "financing",
  "growth",
  "exit",
  "renovation",
];

function formatBaseline(field: OverridableField, value: number | null): string {
  if (value == null) return "Neuvedeno";
  if (MONEY_FIELDS.has(field)) return formatCzk(value);
  if (PERCENT_FIELDS.has(field)) return formatPercentPoints(value);
  return String(value);
}

function AssumptionFieldRow({
  field,
  inputs,
  baseline,
  provenance,
  onChange,
}: {
  field: OverridableField;
  inputs: InvestmentCalculatorInputs;
  baseline: Pick<InvestmentCalculatorInputs, OverridableField>;
  provenance: UiProvenanceSource;
  onChange: (field: OverridableField, value: number | null) => void;
}) {
  const modified = isFieldModified(field, inputs, baseline);
  const value = inputs[field];
  const baselineValue = baseline[field];
  const id = `assumption-${field}`;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border-default)] p-3",
        modified && "border-[var(--status-warning)]",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {FIELD_LABELS[field]}
        </span>
        {modified ? (
          <span className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--status-warning)_18%,white)] px-2 py-0.5 text-[var(--text-caption)] font-medium text-[var(--status-warning)]">
            Upraveno
          </span>
        ) : null}
        <span className="text-[var(--text-caption)] text-[var(--text-muted)]">
          {PROVENANCE_LABELS[provenance]}
        </span>
      </div>

      {field === "interestRatePp" || field === "vacancyPp" ? (
        <RangeSlider
          id={id}
          min={0}
          max={field === "vacancyPp" ? 30 : 15}
          step={0.05}
          value={typeof value === "number" ? value : 0}
          displayValue={
            typeof value === "number" ? formatPercentPoints(value) : "—"
          }
          aria-label={FIELD_LABELS[field]}
          onValueChange={(v) => onChange(field, v)}
        />
      ) : MONEY_FIELDS.has(field) ? (
        <CurrencyInput
          id={id}
          value={typeof value === "number" ? value : null}
          onValueChange={(v) => onChange(field, v)}
        />
      ) : PERCENT_FIELDS.has(field) ? (
        <PercentageInput
          id={id}
          value={typeof value === "number" ? value : null}
          onValueChange={(v) => onChange(field, v)}
        />
      ) : (
        <NumberInput
          id={id}
          value={typeof value === "number" ? value : null}
          suffix={
            field === "termYears" || field === "holdYears" ? "let" : undefined
          }
          onValueChange={(v) =>
            onChange(field, v == null ? null : Math.round(v))
          }
        />
      )}

      <p className="mt-2 text-[var(--text-caption)] text-[var(--text-secondary)]">
        Odhad Majetio: {formatBaseline(field, baselineValue)}
        {modified && typeof value === "number"
          ? ` vs. Váš scénář: ${formatBaseline(field, value)}`
          : null}
      </p>
    </div>
  );
}

export function AssumptionPanel({
  open,
  onOpenChange,
  inputs,
  baseline,
  modifiedCount,
  getProvenance,
  onFieldChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: InvestmentCalculatorInputs;
  baseline: Pick<InvestmentCalculatorInputs, OverridableField>;
  modifiedCount: number;
  getProvenance: (field: OverridableField) => UiProvenanceSource;
  onFieldChange: (field: OverridableField, value: number | null) => void;
  onReset: () => void;
}) {
  const [category, setCategory] = React.useState<AssumptionCategory>("income");

  return (
    <AssumptionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Předpoklady scénáře"
      description="Upravte vstupy podle kategorií. Upravená pole jsou označená."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            type="button"
            size="sm"
            variant={category === c ? "primary" : "outline"}
            onClick={() => setCategory(c)}
          >
            {ASSUMPTION_CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-[var(--text-secondary)]">
          {modifiedCount > 0
            ? `Upraveno polí: ${modifiedCount}`
            : "Žádné uživatelské úpravy"}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={modifiedCount === 0}
          onClick={onReset}
        >
          Obnovit výchozí hodnoty
        </Button>
      </div>

      <Field id={`cat-${category}`} label={ASSUMPTION_CATEGORY_LABELS[category]}>
        <div className="space-y-3">
          {ASSUMPTION_FIELDS_BY_CATEGORY[category].map((field) => (
            <AssumptionFieldRow
              key={field}
              field={field}
              inputs={inputs}
              baseline={baseline}
              provenance={getProvenance(field)}
              onChange={onFieldChange}
            />
          ))}
        </div>
      </Field>
    </AssumptionSheet>
  );
}
