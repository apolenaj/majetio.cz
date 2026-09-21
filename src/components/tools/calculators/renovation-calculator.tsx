"use client";

import { useMemo, useState } from "react";

import {
  RENOVATION_COST_RANGES,
  defaultRenovationSelection,
  estimateRenovation,
  type RenovationItemId,
} from "@/lib/calculators";

import { CalculatorFooterCta, CalculatorShell } from "../calculator-shell";
import {
  BarCompare,
  CrossLinks,
  Disclaimer,
  Kpi,
  MoneyField,
  PercentField,
  moneyText,
} from "./ui";

export function RenovationCalculator() {
  const [area, setArea] = useState(72);
  const [kind, setKind] = useState<"byt" | "dum">("byt");
  const [condition, setCondition] = useState<"light" | "partial" | "full">("partial");
  const [selected, setSelected] = useState<RenovationItemId[]>(
    defaultRenovationSelection("partial", "byt"),
  );
  const [reserve, setReserve] = useState(15);

  const estimate = useMemo(
    () => estimateRenovation({ areaSqm: area, kind, selected, reservePct: reserve }),
    [area, kind, selected, reserve],
  );

  function applyPreset(nextKind: "byt" | "dum", nextCondition: "light" | "partial" | "full") {
    setKind(nextKind);
    setCondition(nextCondition);
    setSelected(defaultRenovationSelection(nextCondition, nextKind));
  }

  return (
    <CalculatorShell
      title="Odhad nákladů rekonstrukce"
      description="Orientační modelové pásmo podle plochy a vybraných prací. Nejde o cenovou nabídku stavebních prací."
      badge="Modelové sazby"
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/analyzy-a-kalkulacky", label: "Analýzy a kalkulačky" },
        { label: "Rekonstrukce" },
      ]}
      footer={<CalculatorFooterCta />}
    >
      <div className="calc-layout">
        <section className="calc-panel">
          <h2>Vstupy</h2>
          <div className="calc-inline-actions">
            <button type="button" className="tools-btn-outline" onClick={() => applyPreset("byt", "partial")}>
              Načíst modelový příklad
            </button>
            <button
              type="button"
              className="tools-btn-outline"
              onClick={() => {
                setArea(0);
                setSelected([]);
              }}
            >
              Vymazat
            </button>
          </div>
          <MoneyField label="Plocha m²" value={area} onChange={setArea} />
          <div className="calc-mode">
            <button type="button" className="tools-filter" aria-pressed={kind === "byt"} onClick={() => applyPreset("byt", condition)}>Byt</button>
            <button type="button" className="tools-filter" aria-pressed={kind === "dum"} onClick={() => applyPreset("dum", condition)}>Dům</button>
          </div>
          <div className="calc-mode">
            {(
              [
                ["light", "Lehké úpravy"],
                ["partial", "Částečná rekonstrukce"],
                ["full", "Kompletní rekonstrukce"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" className="tools-filter" aria-pressed={condition === id} onClick={() => applyPreset(kind, id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="calc-checks">
            {RENOVATION_COST_RANGES.filter((item) => kind === "dum" || !item.houseOnly).map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={(event) => {
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    );
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
          <PercentField label="Rezerva" value={reserve} onChange={setReserve} hint="Výchozí model je 15 %." />
        </section>
        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Střední scénář včetně rezervy</span>
            <strong>{moneyText(estimate.totalWithReserve)}</strong>
            <p>Modelové orientační hodnoty, ne nabídka zhotovitele.</p>
          </div>
          <div className="calc-stats">
            <Kpi label="Nízký scénář" value={moneyText(estimate.low)} />
            <Kpi label="Střední scénář" value={moneyText(estimate.mid)} />
            <Kpi label="Vyšší scénář" value={moneyText(estimate.high)} />
            <Kpi label={`Rezerva ${estimate.reservePct} %`} value={moneyText(estimate.reserveOnMid)} />
          </div>
          <BarCompare
            items={[...estimate.lines]
              .sort((a, b) => b.mid - a.mid)
              .map((line) => ({
                label: line.label,
                value: line.mid,
                display: moneyText(line.mid),
              }))}
          />
          <CrossLinks
            links={[
              {
                href: `/kalkulacky/investicni-vynos`,
                label: "Zahrnout do investičního výpočtu →",
              },
            ]}
          />
          <Disclaimer extra="Nejde o cenovou nabídku stavebních prací." />
        </section>
      </div>
    </CalculatorShell>
  );
}
