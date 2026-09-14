/**
 * Environmental signal → dimension impact mapping.
 */

import type { LocationScoreDimension } from "@/domains/locations/scoring/types";
import type {
  EnvironmentalImpact,
  EnvironmentalProfile,
  EnvironmentalSignal,
} from "@/domains/locations/scoring/environment/types";

function impactForSignal(signal: EnvironmentalSignal): EnvironmentalImpact[] {
  const impacts: EnvironmentalImpact[] = [];

  switch (signal.type) {
    case "FLOOD_ZONE":
    case "FLOOD_RISK_OVERLAY":
      impacts.push({
        signalId: signal.id,
        dimension: "OWN_USE_FIT",
        adjustment: signal.severity === "material" ? -20 : -10,
        reason: `Záplavové území (${signal.status}) — ověřte pojištění a regulaci.`,
      });
      impacts.push({
        signalId: signal.id,
        dimension: "FLIP_FIT",
        adjustment: signal.severity === "material" ? -15 : -8,
        reason: "Záplavové riziko může prodloužit prodej.",
      });
      break;

    case "PLANNED_CONSTRUCTION":
    case "UNDER_CONSTRUCTION":
      impacts.push({
        signalId: signal.id,
        dimension: "RENTAL_INVESTMENT_FIT",
        adjustment: signal.status === "UNDER_CONSTRUCTION" ? -8 : -4,
        reason: "Výstavba v okolí — dočasná škodlivost / konkurence nabídky.",
      });
      impacts.push({
        signalId: signal.id,
        dimension: "OWN_USE_FIT",
        adjustment: signal.status === "UNDER_CONSTRUCTION" ? -12 : -5,
        reason: "Stavební ruch v okolí — ověřte hluk a dopravu.",
      });
      break;

    case "TRANSIT_PROJECT":
    case "METRO_EXTENSION":
      if (signal.status === "PLANNED" || signal.status === "APPROVED") {
        impacts.push({
          signalId: signal.id,
          dimension: "RENTAL_INVESTMENT_FIT",
          adjustment: 8,
          reason: "Plánovaná dopravní infrastruktura — potenciální zlepšení dostupnosti.",
        });
        impacts.push({
          signalId: signal.id,
          dimension: "FLIP_FIT",
          adjustment: 6,
          reason: "Plánovaná doprava může zvýšit atraktivitu při prodeji.",
        });
      } else if (signal.status === "UNDER_CONSTRUCTION") {
        impacts.push({
          signalId: signal.id,
          dimension: "OWN_USE_FIT",
          adjustment: -6,
          reason: "Výstavba dopravní infrastruktury — dočasné omezení.",
        });
      } else if (signal.status === "OPERATIONAL") {
        impacts.push({
          signalId: signal.id,
          dimension: "RENTAL_INVESTMENT_FIT",
          adjustment: 12,
          reason: "Nová dopravní infrastruktura v provozu.",
        });
      }
      break;

    case "ZONING_CHANGE":
      impacts.push({
        signalId: signal.id,
        dimension: "FLIP_FIT",
        adjustment: 0,
        reason: "Změna územního plánu — ověřte dopad na hodnotu (informativní).",
      });
      break;
  }

  return impacts;
}

export function computeEnvironmentalImpacts(
  profile: EnvironmentalProfile | null,
): EnvironmentalImpact[] {
  if (!profile) return [];
  return profile.signals.flatMap(impactForSignal);
}

export function sumAdjustmentsForDimension(
  impacts: EnvironmentalImpact[],
  dimension: LocationScoreDimension,
): { total: number; reasons: string[] } {
  const relevant = impacts.filter((i) => i.dimension === dimension);
  return {
    total: relevant.reduce((s, i) => s + i.adjustment, 0),
    reasons: relevant.map((i) => i.reason),
  };
}
