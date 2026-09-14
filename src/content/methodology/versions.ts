/**
 * Public methodology package versioning — Trust by Design.
 * Historical analyses must retain the package version they were computed with.
 * Major public corrections are explicit entries — never silent rewrites.
 */

import { ASSUMPTION_CONFIG_VERSION } from "@/config/investment-assumptions";
import { INVESTMENT_ENGINE_VERSION } from "@/domains/investment/engine";
import { FORMULA_REGISTRY_VERSION } from "@/domains/investment/engine/formulas/registry";
import { VALUATION_CORE_ENGINE_VERSION } from "@/domains/valuation/service/types";

/** Semver-like public package id shown in UI (not every git commit). */
export const METHODOLOGY_PACKAGE_VERSION = "methodology.v2026.07.22" as const;

export type MethodologyComponentStamp = {
  key: string;
  labelCs: string;
  version: string;
};

/** Component versions frozen into the current public package. */
export function currentMethodologyComponentStamps(): MethodologyComponentStamp[] {
  return [
    {
      key: "assumptions",
      labelCs: "Předpoklady (assumption config)",
      version: ASSUMPTION_CONFIG_VERSION,
    },
    {
      key: "investment_engine",
      labelCs: "Investiční engine",
      version: INVESTMENT_ENGINE_VERSION,
    },
    {
      key: "formula_registry",
      labelCs: "Registr formulí",
      version: FORMULA_REGISTRY_VERSION,
    },
    {
      key: "valuation_core",
      labelCs: "Valuační model (core)",
      version: VALUATION_CORE_ENGINE_VERSION,
    },
  ];
}

export type MethodologyHistoryEntry = {
  version: string;
  publishedAt: string; // YYYY-MM-DD
  summaryCs: string;
  /** Major public correction — shown as corrected state, not silent edit. */
  isPublicCorrection?: boolean;
  correctionOfVersion?: string;
  /** Internal note shown on the public page for transparency of corrections. */
  correctionNoteCs?: string;
};

/**
 * Public version history (curated releases + corrections).
 * Oldest → newest; UI shows newest first.
 */
export const METHODOLOGY_PUBLIC_HISTORY: readonly MethodologyHistoryEntry[] = [
  {
    version: "methodology.v2026.07.01",
    publishedAt: "2026-07-01",
    summaryCs:
      "První veřejný balíček metodiky: oddělení nabídkové ceny, modelovaného odhadu a scénářů; limity AI.",
  },
  {
    version: "methodology.v2026.07.15",
    publishedAt: "2026-07-15",
    summaryCs:
      "Doplnění IRR/NOI dokumentace, ARV a Maximum Offer; jasnější confidence / insufficient data.",
  },
  {
    version: "methodology.v2026.07.15.correction1",
    publishedAt: "2026-07-16",
    summaryCs:
      "Veřejná oprava popisu IRR: upřesnění, že historické scénáře se nepřepočítávají při změně textu metodiky.",
    isPublicCorrection: true,
    correctionOfVersion: "methodology.v2026.07.15",
    correctionNoteCs:
      "Opravený veřejný stav (ne tichá změna). Výpočty uložené pod methodology.v2026.07.15 zůstávají s původními engine stampy.",
  },
  {
    version: METHODOLOGY_PACKAGE_VERSION,
    publishedAt: "2026-07-22",
    summaryCs:
      "Verzování balíčku v UI analýz, historie metodiky, reportování inzerátů; bez tiché změny historických výpočtů.",
  },
] as const;

export function getCurrentMethodologyPackageVersion(): string {
  return METHODOLOGY_PACKAGE_VERSION;
}

export function getCurrentMethodologyPublishedAt(): string {
  const current = METHODOLOGY_PUBLIC_HISTORY.find(
    (e) => e.version === METHODOLOGY_PACKAGE_VERSION,
  );
  return current?.publishedAt ?? "2026-07-22";
}

export function listMethodologyHistoryNewestFirst(): MethodologyHistoryEntry[] {
  return [...METHODOLOGY_PUBLIC_HISTORY].reverse();
}

export function findMethodologyHistoryEntry(
  version: string,
): MethodologyHistoryEntry | undefined {
  return METHODOLOGY_PUBLIC_HISTORY.find((e) => e.version === version);
}

/** Deep-link to public history with optional version highlight. */
export function methodologyVersionHref(version?: string | null): string {
  if (!version) return "/metodika/verze";
  return `/metodika/verze#${encodeURIComponent(version)}`;
}
