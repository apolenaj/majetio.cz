/** Lightweight client-side MVP math for standalone calculator pages. */

export function parseAmount(value: string): number {
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function monthlyAnnuity(
  principal: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const months = Math.round(termYears * 12);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const factor = (1 + r) ** months;
  return (principal * r * factor) / (factor - 1);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type CashFlowInput = {
  rent: number;
  fees: number;
  reserveFund: number;
  insurance: number;
  maintenance: number;
  management: number;
  mortgage: number;
  vacancyPct: number;
};

export function computeCashFlow(input: CashFlowInput) {
  const vacancyLoss = input.rent * (clamp(input.vacancyPct, 0, 100) / 100);
  const effectiveRent = input.rent - vacancyLoss;
  const opex =
    input.fees +
    input.reserveFund +
    input.insurance +
    input.maintenance +
    input.management;
  const monthly = effectiveRent - opex - input.mortgage;
  const annual = monthly * 12;
  const grossYield =
    input.rent > 0 && effectiveRent >= 0
      ? ((input.rent * 12) / Math.max(input.rent * 12 + opex * 12, 1)) * 100
      : 0;
  // Gross yield needs purchase price — caller can override; here return opex ratio helpers
  return {
    effectiveRent,
    vacancyLoss,
    opex,
    monthly,
    annual,
    comment:
      monthly > 0
        ? "Model ukazuje kladnou měsíční bilanci."
        : monthly === 0
          ? "Model je na nule — bez rezervy na výkyvy."
          : "Model ukazuje zápornou bilanci — zkontrolujte náklady nebo nájem.",
  };
}

export function computeYield(params: {
  price: number;
  rentMonthly: number;
  opexMonthly: number;
}) {
  const annualRent = params.rentMonthly * 12;
  const annualOpex = params.opexMonthly * 12;
  const netIncome = annualRent - annualOpex;
  const gross = params.price > 0 ? (annualRent / params.price) * 100 : 0;
  const net = params.price > 0 ? (netIncome / params.price) * 100 : 0;
  return { annualRent, annualOpex, netIncome, gross, net };
}

export function computePayback(investment: number, annualNetProfit: number) {
  if (investment <= 0 || annualNetProfit <= 0) {
    return { years: null as number | null, comment: "Pro výpočet potřebujete kladný roční zisk." };
  }
  const years = investment / annualNetProfit;
  return {
    years,
    comment:
      years <= 15
        ? "Orientačně atraktivní návratnost v modelovém scénáři."
        : years <= 25
          ? "Středně dlouhá návratnost — ověřte riziko a růst nájmu."
          : "Dlouhá návratnost — zvažte cenu, náklady nebo strategii.",
  };
}

export function computeMaxOffer(params: {
  rentMonthly: number;
  opexMonthly: number;
  targetYieldPct: number;
}) {
  const annualNet = (params.rentMonthly - params.opexMonthly) * 12;
  const y = params.targetYieldPct / 100;
  const maxPrice = y > 0 ? annualNet / y : 0;
  return {
    annualNet,
    maxPrice,
    comment:
      maxPrice > 0
        ? "Cena nad tímto limitem nesplní cílový čistý výnos v modelu."
        : "Doplňte nájem, náklady a cílový výnos.",
  };
}

const RENO_RATE: Record<string, { low: number; base: number; high: number }> = {
  cosmetic: { low: 2500, base: 4000, high: 5500 },
  standard: { low: 7000, base: 11000, high: 15000 },
  full: { low: 16000, base: 22000, high: 30000 },
};

export function computeRenovation(params: {
  type: keyof typeof RENO_RATE;
  areaSqm: number;
  contingencyPct: number;
}) {
  const rate = RENO_RATE[params.type] ?? RENO_RATE.standard!;
  const area = Math.max(params.areaSqm, 0);
  const low = rate.low * area;
  const base = rate.base * area;
  const high = rate.high * area;
  const contingency = base * (clamp(params.contingencyPct, 0, 40) / 100);
  const total = base + contingency;
  return {
    low,
    base,
    high,
    contingency,
    total,
    rate,
    comment: "Orientační pásmo — finální rozpočet závisí na stavu a lokalitě.",
  };
}
