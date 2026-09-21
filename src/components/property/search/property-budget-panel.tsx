"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function PropertyBudgetPanel() {
  const [funds, setFunds] = useState("");
  const [monthly, setMonthly] = useState("");

  return (
    <section className="properties-budget" aria-labelledby="budget-heading">
      <div className="properties-budget-copy">
        <h2 id="budget-heading">Co se vejde do mého rozpočtu?</h2>
        <p>Spočítejte si orientačně, jakou nemovitost můžete pořídit.</p>
      </div>
      <form
        className="properties-budget-form"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label>
          <span>Vlastní prostředky</span>
          <input
            value={funds}
            inputMode="numeric"
            placeholder="např. 1 500 000"
            onChange={(e) => setFunds(e.target.value)}
          />
        </label>
        <label>
          <span>Splátka nejvýše / měsíc</span>
          <input
            value={monthly}
            inputMode="numeric"
            placeholder="např. 25 000"
            onChange={(e) => setMonthly(e.target.value)}
          />
        </label>
        <button type="submit" className="properties-budget-cta">
          Spočítat
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}
