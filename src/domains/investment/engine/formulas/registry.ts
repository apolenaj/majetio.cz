/**
 * Central formula registry — explainability for UI (no black-box metrics).
 */

export const FORMULA_REGISTRY_VERSION = "1.3.0";

export type FormulaDefinition = {
  /** Stable machine key (snake_case). */
  key: string;
  /** Human name (CS). */
  name: string;
  /** Semver of this formula definition (independent of engine build). */
  formulaVersion: string;
  /** What the metric means. */
  description: string;
  /** Text representation for UI explainability (CS, Unicode math ok). */
  formulaText: string;
  /** Optional English formula for docs. */
  formulaTextEn?: string;
  /** Input field keys this formula depends on. */
  dependsOn?: readonly string[];
  /** Output unit hint for UI. */
  unit?:
    | "money"
    | "ratio"
    | "percent_points"
    | "months"
    | "years"
    | "dimensionless";
};

const definitions = [
  {
    key: "total_acquisition_cost",
    name: "Celkové pořizovací náklady",
    formulaVersion: "1.0.0",
    description:
      "Součet kupní ceny a všech jednorázových pořizovacích nákladů. Chybějící položky se nepočítají jako nula — do součtu nevstupují.",
    formulaText:
      "Celkové pořizovací náklady = Kupní cena + Náklady na pořízení + Rekonstrukce + Vybavení + Poplatky",
    formulaTextEn:
      "Total Acquisition Cost = Purchase Price + Acquisition Costs + Renovation + Initial Furnishing + Fees",
    dependsOn: [
      "purchasePrice",
      "acquisitionCosts",
      "renovation",
      "initialFurnishing",
      "fees",
    ],
    unit: "money",
  },
  {
    key: "annuity_payment",
    name: "Anuitní hypoteční splátka",
    formulaVersion: "1.0.0",
    description:
      "Měsíční anuita z jistiny, nominální roční sazby a splatnosti. RPSN/APR se pro výpočet splátky nepoužívá — slouží jen ke srovnání nákladovosti. Při nulové sazbě = jistina / počet měsíců.",
    formulaText:
      "Splátka = Jistina × r × (1+r)^n / ((1+r)^n − 1); r = nominální sazba / 12; n = roky × 12. Při r = 0: Splátka = Jistina / n",
    formulaTextEn:
      "Payment = P × r(1+r)^n / ((1+r)^n − 1); r = nominal/12. If r = 0: P / n. APR is not an input to this formula.",
    dependsOn: ["loanPrincipal", "nominalInterestRate", "termYears"],
    unit: "money",
  },
  {
    key: "monthly_debt_service",
    name: "Měsíční debt service",
    formulaVersion: "1.0.0",
    description: "Měsíční obsluha dluhu — obvykle anuitní splátka.",
    formulaText: "Měsíční DS = Anuitní splátka",
    formulaTextEn: "Monthly Debt Service = Annuity Payment",
    dependsOn: ["annuity_payment"],
    unit: "money",
  },
  {
    key: "annual_debt_service",
    name: "Roční debt service",
    formulaVersion: "1.0.0",
    description: "Roční obsluha dluhu = 12 × měsíční splátka.",
    formulaText: "Roční DS = 12 × Měsíční DS",
    formulaTextEn: "Annual Debt Service = 12 × Monthly DS",
    dependsOn: ["monthly_debt_service"],
    unit: "money",
  },
  {
    key: "dscr",
    name: "DSCR",
    formulaVersion: "1.0.0",
    description:
      "Debt Service Coverage Ratio = NOI / roční debt service. Měří, kolikrát provozní zisk pokryje splátky.",
    formulaText: "DSCR = NOI / Roční debt service",
    formulaTextEn: "DSCR = NOI / Annual Debt Service",
    dependsOn: ["noi", "annual_debt_service"],
    unit: "dimensionless",
  },
  {
    key: "potential_gross_income",
    name: "Potential Gross Income (PGI)",
    formulaVersion: "1.0.0",
    description:
      "Potenciální hrubý roční příjem při plné obsazenosti (smluvní / tržní nájem × 12, pokud je zadán měsíčně).",
    formulaText: "PGI = Roční nájem při 100% obsazenosti",
    formulaTextEn: "PGI = Annual rent at full occupancy",
    dependsOn: ["monthlyRent", "annualRent"],
    unit: "money",
  },
  {
    key: "vacancy_loss",
    name: "Ztráta z neobsazenosti",
    formulaVersion: "1.0.0",
    description: "Část PGI ztracená vlivem vacancy rate.",
    formulaText: "Vacancy Loss = PGI × míra neobsazenosti",
    formulaTextEn: "Vacancy Loss = PGI × Vacancy Rate",
    dependsOn: ["potential_gross_income", "vacancyRate"],
    unit: "money",
  },
  {
    key: "effective_gross_income",
    name: "Effective Gross Income (EGI)",
    formulaVersion: "1.0.0",
    description: "Hrubý příjem po zohlednění neobsazenosti.",
    formulaText: "EGI = PGI − Vacancy Loss",
    formulaTextEn: "EGI = PGI − Vacancy Loss",
    dependsOn: ["potential_gross_income", "vacancy_loss"],
    unit: "money",
  },
  {
    key: "operating_expenses",
    name: "Provozní náklady (Opex)",
    formulaVersion: "1.0.0",
    description:
      "Součet nákladů majitele: správa, údržba, pojištění, daň, SVJ (náklad majitele), platform fees. Zálohy SVJ se do NOI opex nepočítají (sledují se zvlášť).",
    formulaText:
      "Opex = Správa + Údržba + Pojištění + Daň + SVJ (majitel) + Platform fees",
    formulaTextEn:
      "Opex = Management + Maintenance + Insurance + Tax + SVJ owner cost + Platform fees",
    dependsOn: [
      "propertyManagement",
      "maintenance",
      "insurance",
      "propertyTax",
      "svjOwnerCost",
      "platformFees",
    ],
    unit: "money",
  },
  {
    key: "noi",
    name: "Net Operating Income (NOI)",
    formulaVersion: "1.0.0",
    description:
      "Čistý provozní výnos = EGI − provozní náklady. Nezahrnuje debt service ani CapEx.",
    formulaText: "NOI = EGI − Opex",
    formulaTextEn: "NOI = EGI − Operating Expenses",
    dependsOn: ["effective_gross_income", "operating_expenses"],
    unit: "money",
  },
  {
    key: "gross_yield",
    name: "Hrubý výnos",
    formulaVersion: "1.1.0",
    description:
      "EGI (nebo PGI, pokud není vacancy) dělený Total Acquisition Cost.",
    formulaText: "Hrubý výnos = EGI / Celkové pořizovací náklady",
    formulaTextEn: "Gross Yield = EGI / Total Acquisition Cost",
    dependsOn: ["effective_gross_income", "total_acquisition_cost"],
    unit: "ratio",
  },
  {
    key: "net_yield",
    name: "Čistý výnos",
    formulaVersion: "1.1.0",
    description:
      "NOI dělený Total Acquisition Cost (pevný denominator — ne kupní cena samotná).",
    formulaText: "Čistý výnos = NOI / Celkové pořizovací náklady",
    formulaTextEn: "Net Yield = NOI / Total Acquisition Cost",
    dependsOn: ["noi", "total_acquisition_cost"],
    unit: "ratio",
  },
  {
    key: "cap_rate",
    name: "Cap Rate",
    formulaVersion: "1.0.0",
    description:
      "NOI / hodnota nemovitosti (default = Total Acquisition Cost, pokud není zadána tržní hodnota).",
    formulaText: "Cap Rate = NOI / Hodnota nemovitosti",
    formulaTextEn: "Cap Rate = NOI / Property Value",
    dependsOn: ["noi", "propertyValue"],
    unit: "ratio",
  },
  {
    key: "monthly_cash_flow_unlevered",
    name: "Měsíční CF (unlevered)",
    formulaVersion: "1.0.0",
    description: "Měsíční provozní cash flow bez dluhu = NOI / 12.",
    formulaText: "Měsíční CF (unlevered) = NOI / 12",
    formulaTextEn: "Monthly CF (unlevered) = NOI / 12",
    dependsOn: ["noi"],
    unit: "money",
  },
  {
    key: "annual_cash_flow_unlevered",
    name: "Roční CF (unlevered)",
    formulaVersion: "1.0.0",
    description: "Roční provozní cash flow bez dluhu = NOI.",
    formulaText: "Roční CF (unlevered) = NOI",
    formulaTextEn: "Annual CF (unlevered) = NOI",
    dependsOn: ["noi"],
    unit: "money",
  },
  {
    key: "monthly_cash_flow",
    name: "Měsíční CF (leveraged)",
    formulaVersion: "1.1.0",
    description: "Měsíční CF po debt service = NOI/12 − měsíční DS.",
    formulaText:
      "Měsíční CF (leveraged) = NOI/12 − Měsíční debt service",
    formulaTextEn:
      "Monthly CF (leveraged) = NOI/12 − Monthly Debt Service",
    dependsOn: ["noi", "monthly_debt_service"],
    unit: "money",
  },
  {
    key: "annual_cash_flow_leveraged",
    name: "Roční CF (leveraged)",
    formulaVersion: "1.0.0",
    description: "Roční CF po debt service = NOI − roční DS.",
    formulaText: "Roční CF (leveraged) = NOI − Roční debt service",
    formulaTextEn: "Annual CF (leveraged) = NOI − Annual Debt Service",
    dependsOn: ["noi", "annual_debt_service"],
    unit: "money",
  },
  {
    key: "equity_required",
    name: "Požadovaný vlastní kapitál",
    formulaVersion: "1.0.0",
    description:
      "Equity = Total Acquisition Cost − jistina úvěru (chybějící úvěr = celá TAC).",
    formulaText: "Equity = Celkové pořizovací náklady − Jistina úvěru",
    formulaTextEn: "Equity = Total Acquisition Cost − Loan Principal",
    dependsOn: ["total_acquisition_cost", "loanPrincipal"],
    unit: "money",
  },
  {
    key: "ltv",
    name: "LTV (loan-to-value)",
    formulaVersion: "1.1.0",
    description: "Výše úvěru vůči hodnotě nemovitosti (default TAC).",
    formulaText: "LTV = Jistina úvěru / Hodnota nemovitosti",
    formulaTextEn: "LTV = Loan Principal / Property Value",
    dependsOn: ["loanPrincipal", "propertyValue"],
    unit: "ratio",
  },
  {
    key: "cash_on_cash",
    name: "Cash-on-cash výnos",
    formulaVersion: "1.1.0",
    description:
      "Roční leveraged cash flow dělené požadovaným vlastním kapitálem.",
    formulaText: "CoC = Roční CF (leveraged) / Equity",
    formulaTextEn: "Cash-on-Cash = Annual Leveraged CF / Equity Required",
    dependsOn: ["annual_cash_flow_leveraged", "equity_required"],
    unit: "ratio",
  },
  {
    key: "price_per_sqm",
    name: "Cena za m²",
    formulaVersion: "1.0.0",
    description: "Kupní cena (nebo zvolená základna) dělená užitnou plochou.",
    formulaText: "Kč/m² = Kupní cena / Užitná plocha",
    formulaTextEn: "Price per m² = Purchase Price / Usable Area",
    dependsOn: ["purchasePrice", "usableAreaSqm"],
    unit: "money",
  },
  {
    key: "amortization_schedule",
    name: "Amortizační tabulka",
    formulaVersion: "1.0.0",
    description:
      "Měsíční rozklad anuitní splátky na úrok a jistinu až do splatnosti nebo horizontu držby.",
    formulaText:
      "Úrok_m = Zůstatek × r; Jistina_m = Splátka − Úrok_m; Zůstatek' = Zůstatek − Jistina_m",
    formulaTextEn:
      "Interest = Balance × r; Principal = Payment − Interest; Balance' = Balance − Principal",
    dependsOn: ["loanPrincipal", "nominalInterestRate", "termYears"],
    unit: "money",
  },
  {
    key: "holding_projection",
    name: "Projekce cash flow (holding period)",
    formulaVersion: "1.0.0",
    description:
      "Roční řada CF 1–30 let s růstem nájmu, inflací opex a appreciation hodnoty.",
    formulaText:
      "Nájem_t = Nájem_0 × (1+g_r)^t; Opex_t = Opex_0 × (1+g_e)^t; Hodnota_t = Hodnota_0 × (1+g_a)^t",
    formulaTextEn:
      "Rent_t = Rent_0×(1+g_r)^t; Opex_t = Opex_0×(1+g_e)^t; Value_t = Value_0×(1+g_a)^t",
    dependsOn: [
      "holdYears",
      "appreciationRate",
      "rentGrowthRate",
      "expenseInflationRate",
    ],
    unit: "money",
  },
  {
    key: "net_sale_proceeds",
    name: "Čistý výnos z prodeje (exit)",
    formulaVersion: "1.0.0",
    description:
      "Sale Price minus selling costs minus outstanding loan balance at exit.",
    formulaText:
      "Net Sale Proceeds = Prodejní cena − Náklady prodeje − Zůstatek úvěru",
    formulaTextEn:
      "Net Sale Proceeds = Sale Price − Selling Costs − Outstanding Loan Balance",
    dependsOn: ["salePrice", "sellingCosts", "outstandingLoanBalance"],
    unit: "money",
  },
  {
    key: "irr",
    name: "IRR (vnitřní výnosové procento)",
    formulaVersion: "1.0.0",
    description:
      "Diskontní sazba, při které NPV equity cash flow řady = 0. Při nekonvergenci vrací null + důvod.",
    formulaText: "NPV(IRR) = Σ CF_t / (1+IRR)^t = 0",
    formulaTextEn: "Solve NPV(IRR) = 0 over the equity cash-flow series",
    dependsOn: ["equityCashFlows"],
    unit: "ratio",
  },
  {
    key: "equity_multiple",
    name: "Equity Multiple",
    formulaVersion: "1.0.0",
    description:
      "Součet všech kladných equity distribucí (vč. exitu) dělený počáteční equity investicí.",
    formulaText: "Equity Multiple = Σ kladných CF / |počáteční equity|",
    formulaTextEn: "Equity Multiple = Total Distributions / Initial Equity",
    dependsOn: ["equityCashFlows"],
    unit: "dimensionless",
  },
  {
    key: "payback_period",
    name: "Doba návratnosti",
    formulaVersion: "1.0.0",
    description:
      "První okamžik (v letech, lineární interpolace), kdy kumulativní equity CF ≥ 0.",
    formulaText: "Payback = rok, kdy kumulativní CF překročí 0",
    formulaTextEn: "Payback = first time cumulative CF crosses zero",
    dependsOn: ["equityCashFlows"],
    unit: "years",
  },
  {
    key: "flip_gross_profit",
    name: "Flip — hrubý zisk",
    formulaVersion: "1.0.0",
    description: "Prodejní cena minus celkové náklady flipu (pořízení + capex + holding + prodej).",
    formulaText: "Hrubý zisk = Prodejní cena − Celkové náklady flipu",
    formulaTextEn: "Gross Profit = Sale Price − Total Flip Cost",
    dependsOn: ["salePrice", "totalFlipCost"],
    unit: "money",
  },
  {
    key: "flip_cost_margin",
    name: "Flip — marže z nákladů",
    formulaVersion: "1.0.0",
    description: "Hrubý zisk / celkové náklady flipu.",
    formulaText: "Marže = Hrubý zisk / Celkové náklady flipu",
    formulaTextEn: "Cost Margin = Gross Profit / Total Flip Cost",
    dependsOn: ["flip_gross_profit", "totalFlipCost"],
    unit: "ratio",
  },
  {
    key: "canonical_scenarios",
    name: "Kanonické scénáře (Base / Konzervativní / Optimistický)",
    formulaVersion: "1.0.0",
    description:
      "Z Base vstupů odvodí Konzervativní (vyšší sazba/náklady, nižší nájem) a Optimistický dle pevných rozptylů.",
    formulaText:
      "Konzervativní = Base ± Δ (sazba↑, opex↑, nájem↓); Optimistický = Base ± Δ (opačně)",
    formulaTextEn:
      "Conservative/Optimistic derived from Base via fixed spreads on rate, opex, rent",
    dependsOn: ["baseCase", "canonicalSpreads"],
    unit: "dimensionless",
  },
  {
    key: "sensitivity_1way",
    name: "1-way citlivost",
    formulaVersion: "1.0.0",
    description: "Změna jedné vstupní veličiny a dopad na cílovou metriku (např. roční CF).",
    formulaText: "Metric(x + Δ) pro Δ ∈ {Δ1…Δn}",
    formulaTextEn: "Metric(x+Δ) across a one-dimensional shock grid",
    dependsOn: ["baseCase", "factor", "steps"],
    unit: "dimensionless",
  },
  {
    key: "sensitivity_2way",
    name: "2-way citlivost",
    formulaVersion: "1.0.0",
    description: "Mřížka dopadu dvou faktorů (např. úrok × nájem) na metriku.",
    formulaText: "Metric(x+Δi, y+Δj) — 2D grid",
    formulaTextEn: "Two-factor sensitivity grid",
    dependsOn: ["baseCase", "factorA", "factorB"],
    unit: "dimensionless",
  },
  {
    key: "break_even_occupancy",
    name: "Break-even obsazenost",
    formulaVersion: "1.0.0",
    description:
      "Obsazenost, při které NOI pokryje roční debt service (leveraged CF ≈ 0 před růsty).",
    formulaText: "BE occ = (Opex + Roční DS) / PGI",
    formulaTextEn: "BE occupancy = (Opex + Annual DS) / PGI",
    dependsOn: ["pgi", "opex", "annualDebtService"],
    unit: "ratio",
  },
  {
    key: "break_even_interest_rate",
    name: "Break-even úroková sazba",
    formulaVersion: "1.0.0",
    description: "Nominální sazba, při které je roční leveraged CF ≈ 0.",
    formulaText: "Hledej r: NOI − DS(r) ≈ 0",
    formulaTextEn: "Solve r such that NOI − DS(r) ≈ 0",
    dependsOn: ["noi", "loanPrincipal", "termYears"],
    unit: "ratio",
  },
  {
    key: "break_even_purchase_price",
    name: "Break-even kupní cena",
    formulaVersion: "1.0.0",
    description:
      "Maximální pořizovací základna (TAC) pro požadovaný čistý výnos = NOI / targetNetYield.",
    formulaText: "BE cena = NOI / cílový čistý výnos",
    formulaTextEn: "BE price = NOI / target net yield",
    dependsOn: ["noi", "targetNetYield"],
    unit: "money",
  },
  {
    key: "stress_test",
    name: "Stresové scénáře",
    formulaVersion: "1.0.0",
    description:
      "Předdefinované šoky: úrok +2 p.b., nájem −10 %, náklady ↑, kombinovaný šok.",
    formulaText: "Stress_i = Base(shocked inputs_i)",
    formulaTextEn: "Evaluate base case under named macro shocks",
    dependsOn: ["baseCase"],
    unit: "dimensionless",
  },
  {
    key: "risk_flags",
    name: "Risk flags",
    formulaVersion: "1.0.0",
    description: "Automatická varování stability (negativní CF, vysoké LTV, nízké DSCR…).",
    formulaText: "Flag pokud metrika překročí práh",
    formulaTextEn: "Emit flags when metrics cross risk thresholds",
    dependsOn: ["baseMetrics"],
    unit: "dimensionless",
  },
  {
    key: "confidence_score",
    name: "Confidence score vstupů",
    formulaVersion: "1.0.0",
    description:
      "0–100 dle provenance polí (market_data / verified_listing / user_estimate / default).",
    formulaText: "Score = vážený průměr kvality vstupů",
    formulaTextEn: "Weighted average of input provenance quality",
    dependsOn: ["fieldProvenance"],
    unit: "dimensionless",
  },
] as const satisfies readonly FormulaDefinition[];

export type FormulaKey = (typeof definitions)[number]["key"];

const byKey: Record<string, FormulaDefinition> = Object.fromEntries(
  definitions.map((d) => [d.key, d]),
);

export const FORMULA_REGISTRY: readonly FormulaDefinition[] = definitions;

export function getFormula(key: string): FormulaDefinition | undefined {
  return byKey[key];
}

export function requireFormula(key: FormulaKey | string): FormulaDefinition {
  const found = getFormula(key);
  if (!found) {
    throw new Error(`Unknown formula key: ${key}`);
  }
  return found;
}

export function listFormulaKeys(): FormulaKey[] {
  return definitions.map((d) => d.key);
}
