"use client";

import * as React from "react";

import type { PropertyScenarioDemo } from "@/content/demo-property-financial";
import { CurrencyInput } from "@/components/forms/inputs";
import { Field } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/navigation/tabs";
import { formatCzk } from "@/lib/format";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const NEU = "Nutno ověřit";

type Assumptions = {
  rentMonthlyCzk: number | null;
  costsMonthlyCzk: number | null;
  equityCzk: number | null;
};

/**
 * Scenario switcher — preset demos + client-only custom assumptions (never persisted to DB).
 */
export function ScenarioSwitcher({
  scenarios,
  isAuthenticated,
  returnPath,
}: {
  scenarios: PropertyScenarioDemo[];
  isAuthenticated: boolean;
  returnPath: string;
}) {
  const relevant = scenarios.filter((s) => s.relevant);
  const defaultId = relevant[0]?.id ?? "long_term_rent";
  const [active, setActive] = React.useState(String(defaultId));

  function onTabChange(next: string) {
    setActive(next);
    track({
      name: "scenario_changed",
      props: { scenario_id: next, is_demo: true },
    });
  }

  const customBase = relevant.find((s) => s.id === "custom");
  const [assumptions, setAssumptions] = React.useState<Assumptions>(() => ({
    rentMonthlyCzk: customBase?.assumptionDefaults?.rentMonthlyCzk ?? null,
    costsMonthlyCzk: customBase?.assumptionDefaults?.costsMonthlyCzk ?? null,
    equityCzk: customBase?.assumptionDefaults?.equityCzk ?? null,
  }));

  if (relevant.length === 0) {
    return (
      <section aria-labelledby="scenarios-heading">
        <h2
          id="scenarios-heading"
          className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
        >
          Investiční scénáře
        </h2>
        <Card className="mt-5" padding="lg" variant="muted">
          <p className="text-sm text-[var(--text-secondary)]">
            Scénáře: <strong>{NEU}</strong>. Pro tuto nabídku zatím nejsou
            připravené relevantní demonstrační scénáře.
          </p>
        </Card>
      </section>
    );
  }

  const derivedCf =
    assumptions.rentMonthlyCzk != null && assumptions.costsMonthlyCzk != null
      ? assumptions.rentMonthlyCzk - assumptions.costsMonthlyCzk
      : null;

  return (
    <section aria-labelledby="scenarios-heading">
      <h2
        id="scenarios-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Investiční scénáře
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Přepínejte mezi relevantními strategiemi. Vlastní scénář upravuje jen
        dočasné předpoklady v prohlížeči — databázi nepřepisuje.
      </p>

      <Tabs value={active} onValueChange={onTabChange} className="mt-5">
        <TabsList className="flex h-auto min-h-11 w-full flex-wrap justify-start">
          {relevant.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="flex-none">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {relevant.map((scenario) => (
          <TabsContent key={scenario.id} value={scenario.id}>
            {scenario.id === "custom" ? (
              <CustomScenarioPanel
                isAuthenticated={isAuthenticated}
                returnPath={returnPath}
                assumptions={assumptions}
                onChange={setAssumptions}
                derivedCf={derivedCf}
                benefit={scenario.benefit}
                risk={scenario.risk}
              />
            ) : (
              <ScenarioCard scenario={scenario} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function ScenarioCard({ scenario }: { scenario: PropertyScenarioDemo }) {
  return (
    <Card padding="lg" elevation="raised">
      <CardHeader>
        <CardTitle>{scenario.label}</CardTitle>
        <CardDescription>Demonstrační scénář — ne investiční doporučení</CardDescription>
      </CardHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            Hlavní benefit
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {scenario.benefit || NEU}
          </p>
        </div>
        <div>
          <p className="text-caption uppercase tracking-wide text-[var(--status-warning)]">
            Riziko
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {scenario.risk || NEU}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--border-default)] pt-4">
        <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
          Požadovaný kapitál
        </p>
        <p className="mt-1 font-metric text-lg font-semibold text-[var(--text-primary)]">
          {scenario.capitalRequiredCzk != null
            ? formatCzk(scenario.capitalRequiredCzk)
            : NEU}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {scenario.capitalLabel || NEU}
        </p>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {scenario.metrics.length === 0 ? (
          <li className="text-sm text-[var(--text-muted)]">Metriky: {NEU}</li>
        ) : (
          scenario.metrics.map((m) => (
            <li
              key={m.label}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2"
            >
              <p className="text-xs text-[var(--text-muted)]">{m.label}</p>
              <p className="font-metric text-sm font-semibold text-[var(--text-primary)]">
                {m.value || NEU}
              </p>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

function CustomScenarioPanel({
  isAuthenticated,
  returnPath,
  assumptions,
  onChange,
  derivedCf,
  benefit,
  risk,
}: {
  isAuthenticated: boolean;
  returnPath: string;
  assumptions: Assumptions;
  onChange: (next: Assumptions) => void;
  derivedCf: number | null;
  benefit: string;
  risk: string;
}) {
  if (!isAuthenticated) {
    return (
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Vlastní scénář</CardTitle>
          <CardDescription>
            Úprava vstupů je dostupná po přihlášení — hodnoty se neukládají do DB.
          </CardDescription>
        </CardHeader>
        <InlineAlert tone="warning" title="Vyžaduje přihlášení">
          Přihlaste se, abyste mohli dočasně upravit nájem, náklady a kapitál pro
          tuto stránku.
        </InlineAlert>
        <ButtonLink href={buildLoginUrl(returnPath)} className="mt-4" size="sm">
          Přihlásit se
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card padding="lg" elevation="raised">
      <CardHeader>
        <CardTitle>Vlastní scénář</CardTitle>
        <CardDescription>
          {benefit} Změny zůstávají jen v této relaci prohlížeče.
        </CardDescription>
      </CardHeader>

      <InlineAlert tone="info" title="Nepřepisuje databázi">
        User assumptions jsou lokální. Po obnovení stránky se vrátí výchozí demo
        hodnoty.
      </InlineAlert>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field id="custom-rent" label="Nájem / měsíc">
          <CurrencyInput
            value={assumptions.rentMonthlyCzk}
            onValueChange={(rentMonthlyCzk) =>
              onChange({ ...assumptions, rentMonthlyCzk })
            }
          />
        </Field>
        <Field id="custom-costs" label="Náklady / měsíc">
          <CurrencyInput
            value={assumptions.costsMonthlyCzk}
            onValueChange={(costsMonthlyCzk) =>
              onChange({ ...assumptions, costsMonthlyCzk })
            }
          />
        </Field>
        <Field id="custom-equity" label="Vlastní kapitál">
          <CurrencyInput
            value={assumptions.equityCzk}
            onValueChange={(equityCzk) =>
              onChange({ ...assumptions, equityCzk })
            }
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
          <p className="text-xs text-[var(--text-muted)]">Orientační CF (nájem − náklady)</p>
          <p
            className={cn(
              "mt-1 font-metric text-xl font-semibold",
              derivedCf == null
                ? "text-[var(--text-muted)]"
                : derivedCf >= 0
                  ? "text-[var(--investment-positive)]"
                  : "text-[var(--investment-negative)]",
            )}
          >
            {derivedCf != null ? formatCzk(derivedCf, { signed: true }) : NEU}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
          <p className="text-xs text-[var(--status-warning)]">Riziko</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{risk || NEU}</p>
        </div>
      </div>
    </Card>
  );
}
