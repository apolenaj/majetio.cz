/** Czech formatting helpers for marketing case studies (CZK major units). */

export function formatCzk(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatPct(value: number, digits = 1): string {
  return `${new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

export function formatSignedCzk(amount: number): string {
  const abs = formatCzk(Math.abs(amount));
  if (amount > 0) return `+${abs}`;
  if (amount < 0) return `−${abs}`;
  return abs;
}
