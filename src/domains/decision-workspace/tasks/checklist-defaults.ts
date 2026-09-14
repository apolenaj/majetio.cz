import type { PropertyDecisionTaskType } from "@prisma/client";

export type ChecklistSuggestionContext = {
  propertyType: string | null;
  condition: string | null;
  risk: string | null;
  /** e.g. Pronájem, Rekonstrukce */
  tags: string[];
  hasRenovationEstimate: boolean;
};

export type ChecklistSuggestion = {
  type: PropertyDecisionTaskType;
  title: string;
  reason: string;
};

/**
 * Default checklist proposals from property type + risks.
 * Pure — no I/O. Does not auto-create until user accepts / seeds.
 */
export function suggestDecisionTasks(
  ctx: ChecklistSuggestionContext,
): ChecklistSuggestion[] {
  const out: ChecklistSuggestion[] = [
    {
      type: "VIEWING",
      title: "Domluvit prohlídku",
      reason: "Základní ověření stavu na místě.",
    },
    {
      type: "LEGAL_CHECK",
      title: "Právní kontrola dokumentů",
      reason: "Kupní smlouva, výpis z katastru, věcná břemena.",
    },
    {
      type: "DOCUMENTATION",
      title: "Shromáždit podklady k financování",
      reason: "Příprava na hypotéku / Finanční pas.",
    },
  ];

  const type = (ctx.propertyType ?? "").toUpperCase();
  if (type === "APARTMENT" || type.includes("BYT")) {
    out.push({
      type: "SVJ",
      title: "Získat stanovy a zápisy SVJ",
      reason: "Byt — ověřit fond oprav, dluhy jednotky a plánované investice.",
    });
  }

  if (type === "HOUSE" || type.includes("DŮM") || type.includes("DUM")) {
    out.push({
      type: "NEIGHBORS",
      title: "Ověřit přístup a sousedské vztahy",
      reason: "Dům — příjezd, hranice pozemku, případné spory.",
    });
  }

  const needsTech =
    ctx.condition === "NEEDS_RENOVATION" ||
    ctx.risk === "high" ||
    ctx.risk === "critical" ||
    ctx.hasRenovationEstimate ||
    ctx.tags.some((t) => /rekonstruk|renovat|flip/i.test(t));

  if (needsTech) {
    out.push({
      type: "TECHNICAL_INSPECTION",
      title: "Zajistit technickou prohlídku",
      reason:
        ctx.risk === "high" || ctx.risk === "critical"
          ? "Vysoké riziko / rekonstrukce — doporučená technická kontrola."
          : "Stav nemovitosti vyžaduje odborné posouzení.",
    });
  }

  if (ctx.hasRenovationEstimate || ctx.condition === "NEEDS_RENOVATION") {
    out.push({
      type: "RENOVATION_QUOTE",
      title: "Získat nabídku na rekonstrukci",
      reason: "Porovnat odhad CapEx s realitou trhu.",
    });
  }

  if (ctx.tags.some((t) => /pronájem|investic|výnos|vynos/i.test(t))) {
    out.push({
      type: "FINANCING",
      title: "Ověřit financovatelnost a LTV",
      reason: "Investiční záměr — sladit s Finančním pasem.",
    });
  }

  // Dedupe by type (keep first)
  const seen = new Set<string>();
  return out.filter((s) => {
    if (seen.has(s.type)) return false;
    seen.add(s.type);
    return true;
  });
}

export const TASK_STATUS_LABELS_CS: Record<string, string> = {
  PENDING: "Čeká",
  IN_PROGRESS: "Probíhá",
  DONE: "Hotovo",
  CANCELLED: "Zrušeno",
};

export const TASK_TYPE_LABELS_CS: Record<string, string> = {
  VIEWING: "Prohlídka",
  LEGAL_CHECK: "Právo",
  SVJ: "SVJ",
  TECHNICAL_INSPECTION: "Technická",
  FINANCING: "Financování",
  RENOVATION_QUOTE: "Rekonstrukce",
  DOCUMENTATION: "Dokumenty",
  NEIGHBORS: "Sousedé",
  CUSTOM: "Vlastní",
};
