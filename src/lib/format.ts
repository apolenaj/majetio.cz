/**
 * Czech-first financial formatting for Majetio UI.
 * Always use these helpers instead of ad-hoc toLocaleString in components.
 *
 * International surfaces (Prompt 17.2): prefer `@/domains/i18n`
 * (`formatMoneyMajor`, `formatInstantForTimezone`, …).
 */

const numberCs = (options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("cs-CZ", options);

export function formatCzk(
  amount: number,
  options?: { maximumFractionDigits?: number; signed?: boolean },
): string {
  const formatted = numberCs({
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: 0,
  }).format(amount);

  if (options?.signed && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatEur(
  amount: number,
  options?: { maximumFractionDigits?: number },
): string {
  return numberCs({
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}

export function formatPercent(
  value: number,
  options?: { maximumFractionDigits?: number; signed?: boolean },
): string {
  const digits = options?.maximumFractionDigits ?? 1;
  const formatted = numberCs({
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);

  if (options?.signed && value > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/** Pass ratio already as percent points (e.g. 5.4 → 5,4 %). */
export function formatPercentPoints(
  points: number,
  options?: { maximumFractionDigits?: number; signed?: boolean },
): string {
  return formatPercent(points / 100, options);
}

export function formatCzkPerSqm(amount: number): string {
  return `${formatCzk(amount)}/m²`;
}

export function formatMonthlyCzk(amount: number, signed = true): string {
  return `${formatCzk(amount, { signed })} měsíčně`;
}

export function formatYearlyCzk(amount: number, signed = false): string {
  return `${formatCzk(amount, { signed })} ročně`;
}

export function formatRangeCzk(low: number, high: number): string {
  return `${formatCzk(low)} – ${formatCzk(high)}`;
}

export function formatAreaSqm(area: number, digits = 0): string {
  return `${numberCs({ maximumFractionDigits: digits }).format(area)} m²`;
}

/** Czech date+time for “naposledy uloženo” and concurrency UI. */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Parse Czech-ish numeric input (spaces, comma decimal) to number. */
export function parseLocalizedNumber(raw: string): number | null {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/Kč|EUR|%|m²/gi, "")
    .replace(",", ".")
    .trim();
  if (!cleaned || cleaned === "-" || cleaned === "+") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}
