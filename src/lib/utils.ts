import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {
  formatAreaSqm,
  formatCzk,
  formatCzkPerSqm,
  formatEur,
  formatMonthlyCzk,
  formatPercent,
  formatPercentPoints,
  formatRangeCzk,
  formatYearlyCzk,
  parseLocalizedNumber,
} from "@/lib/format";
