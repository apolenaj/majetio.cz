import Link from "next/link";
import { BookOpen } from "lucide-react";

import {
  findMethodologyHistoryEntry,
  getCurrentMethodologyPackageVersion,
  methodologyVersionHref,
} from "@/content/methodology/versions";
import { cn } from "@/lib/utils";

export type MethodologyAttributionProps = {
  /** Frozen package version from a historical analysis; omit = current. */
  methodologyPackageVersion?: string | null;
  calculationEngineVersion?: string | null;
  formulaRegistryVersion?: string | null;
  assumptionConfigVersion?: string | null;
  valuationEngineVersion?: string | null;
  className?: string;
  /** Compact single-line for footers. */
  compact?: boolean;
};

/**
 * Every analysis surface should point at the methodology package version
 * that produced the numbers — including historical stamps.
 */
export function MethodologyAttribution({
  methodologyPackageVersion,
  calculationEngineVersion,
  formulaRegistryVersion,
  assumptionConfigVersion,
  valuationEngineVersion,
  className,
  compact = false,
}: MethodologyAttributionProps) {
  const version =
    methodologyPackageVersion?.trim() || getCurrentMethodologyPackageVersion();
  const entry = findMethodologyHistoryEntry(version);
  const isHistorical =
    Boolean(methodologyPackageVersion) &&
    methodologyPackageVersion !== getCurrentMethodologyPackageVersion();
  const href = methodologyVersionHref(version);

  if (compact) {
    return (
      <p
        className={cn(
          "inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--text-caption)] text-[var(--text-muted)]",
          className,
        )}
        data-methodology-version={version}
      >
        <BookOpen className="size-3.5 shrink-0" aria-hidden />
        <span>
          Metodika:{" "}
          <Link
            href={href}
            className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            {version}
          </Link>
          {entry?.publishedAt ? (
            <span className="text-[var(--text-muted)]">
              {" "}
              · {entry.publishedAt}
            </span>
          ) : null}
          {isHistorical ? (
            <span className="ml-1 text-[var(--text-secondary)]">
              (historická verze)
            </span>
          ) : null}
        </span>
      </p>
    );
  }

  return (
    <aside
      aria-label="Verze metodiky"
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--text-secondary)]",
        className,
      )}
      data-methodology-version={version}
    >
      <p className="flex flex-wrap items-center gap-1.5">
        <BookOpen className="size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
        <span>
          Analýza vychází z metodiky{" "}
          <Link
            href={href}
            className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            {version}
          </Link>
          {entry?.publishedAt ? (
            <span className="text-[var(--text-muted)]">
              {" "}
              (aktualizace {entry.publishedAt})
            </span>
          ) : null}
          .
        </span>
      </p>
      {isHistorical ? (
        <p className="mt-1 text-[var(--text-caption)] text-[var(--text-muted)]">
          Historický výpočet — čísla odpovídají metodě z doby uložení, ne
          aktuálnímu balíčku.
        </p>
      ) : null}
      {(calculationEngineVersion ||
        formulaRegistryVersion ||
        assumptionConfigVersion ||
        valuationEngineVersion) && (
        <ul className="mt-2 space-y-0.5 text-[var(--text-caption)] text-[var(--text-muted)]">
          {valuationEngineVersion ? (
            <li>Valuační model: {valuationEngineVersion}</li>
          ) : null}
          {calculationEngineVersion ? (
            <li>Investiční engine: {calculationEngineVersion}</li>
          ) : null}
          {formulaRegistryVersion ? (
            <li>Formule: {formulaRegistryVersion}</li>
          ) : null}
          {assumptionConfigVersion ? (
            <li>Předpoklady: {assumptionConfigVersion}</li>
          ) : null}
        </ul>
      )}
      <p className="mt-2">
        <Link
          href="/metodika/verze"
          className="text-[var(--text-caption)] font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Historie verzí metodiky
        </Link>
      </p>
    </aside>
  );
}
