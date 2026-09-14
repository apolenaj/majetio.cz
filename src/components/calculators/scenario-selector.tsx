"use client";

import * as React from "react";

import { ASSUMPTION_CONFIG_V2026_07 } from "@/config/investment-assumptions";
import { applyScenarioVariant } from "@/domains/investment/scenarios/apply-variant";
import {
  SCENARIO_VARIANT_LABELS,
  sanitizeScenarioName,
  type ScenarioVariantId,
} from "@/domains/investment/scenarios/sanitize-name";
import type { InvestmentCalculatorInputs } from "@/domains/investment/hooks/calculator-inputs";
import { track } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";

const VARIANTS: ScenarioVariantId[] = [
  "conservative",
  "realistic",
  "optimistic",
  "custom",
];

export function ScenarioSelector({
  variant,
  onVariantChange,
  realisticBase,
  inputs,
  onApplyInputs,
  onDuplicate,
  isAuthenticated,
  showPublicNeutralNotice,
}: {
  variant: ScenarioVariantId;
  onVariantChange: (v: ScenarioVariantId) => void;
  /** Frozen realistic baseline for deriving conservative/optimistic. */
  realisticBase: InvestmentCalculatorInputs;
  inputs: InvestmentCalculatorInputs;
  onApplyInputs: (next: InvestmentCalculatorInputs) => void;
  onDuplicate?: (name: string) => void;
  isAuthenticated?: boolean;
  showPublicNeutralNotice?: boolean;
}) {
  const [cloneName, setCloneName] = React.useState("Můj scénář");
  const [cloneError, setCloneError] = React.useState<string | null>(null);
  const [showAdvancedNpv, setShowAdvancedNpv] = React.useState(false);

  function selectVariant(next: ScenarioVariantId) {
    onVariantChange(next);
    track({
      name: "scenario_selected",
      props: {
        variant: next,
        strategy: inputs.strategy,
      },
    });
    if (next === "custom") return;
    onApplyInputs(
      applyScenarioVariant({
        base: realisticBase,
        variant: next,
        customOverride: inputs,
      }),
    );
  }

  function handleDuplicate() {
    const clean = sanitizeScenarioName(cloneName);
    if (!clean || /[<>]/.test(clean)) {
      setCloneError("Neplatný název — HTML není povoleno.");
      return;
    }
    setCloneError(null);
    onDuplicate?.(clean);
  }

  return (
    <Card elevation="flat" className="space-y-4">
      <CardTitle className="text-base">Scénář</CardTitle>

      {showPublicNeutralNotice ? (
        <InlineAlert tone="info" title="Orientační scénář">
          {ASSUMPTION_CONFIG_V2026_07.meta.publicNeutralDisclaimer}
        </InlineAlert>
      ) : null}

      <ButtonGroup aria-label="Volba scénáře">
        {VARIANTS.map((v) => (
          <Button
            key={v}
            type="button"
            size="sm"
            variant={variant === v ? "primary" : "outline"}
            onClick={() => selectVariant(v)}
          >
            {SCENARIO_VARIANT_LABELS[v]}
          </Button>
        ))}
      </ButtonGroup>

      <p className="text-sm text-[var(--text-secondary)]">
        {ASSUMPTION_CONFIG_V2026_07.meta.preTaxDisclaimer}{" "}
        {ASSUMPTION_CONFIG_V2026_07.meta.legalDisclaimer}
      </p>

      {isAuthenticated && onDuplicate ? (
        <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
          <Field
            id="clone-name"
            label="Duplikovat scénář"
            helperText="Název bez HTML — max. 80 znaků"
          >
            <TextInput
              id="clone-name"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
            />
          </Field>
          {cloneError ? (
            <p className="text-sm text-[var(--status-error)]">{cloneError}</p>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={handleDuplicate}>
            Duplikovat scénář
          </Button>
        </div>
      ) : null}

      <div className="border-t border-[var(--border-default)] pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedNpv((v) => !v)}
        >
          {showAdvancedNpv ? "Skrýt" : "Zobrazit"} pokročilé (NPV)
        </Button>
        {showAdvancedNpv ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            DCF/NPV je připravené v enginu (`calculateNpv`) s explicitní
            diskontní sazbou. Preferujeme nominální CF — funkce není součástí
            základního UI.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
