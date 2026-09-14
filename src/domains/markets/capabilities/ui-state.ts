/**
 * UI-facing capability states (Rules 139–146).
 * Plugin layer keeps FULL/BETA/LIMITED/MANUAL_ONLY/NOT_AVAILABLE;
 * UI collapses to FULL | LIMITED | UNAVAILABLE.
 */

import type { CapabilityStatus } from "@/domains/markets/types";

export const UI_CAPABILITY_STATES = ["FULL", "LIMITED", "UNAVAILABLE"] as const;
export type UiCapabilityState = (typeof UI_CAPABILITY_STATES)[number];

export function toUiCapabilityState(
  status: CapabilityStatus,
): UiCapabilityState {
  switch (status) {
    case "FULL":
    case "BETA":
      return "FULL";
    case "LIMITED":
    case "MANUAL_ONLY":
      return "LIMITED";
    case "NOT_AVAILABLE":
    default:
      return "UNAVAILABLE";
  }
}

/** Polite copy — never a raw crash / "Nemáme data". */
export function capabilityUnavailableMessage(input: {
  capability: string;
  marketCode: string;
  locale?: string;
  state: UiCapabilityState;
}): { title: string; body: string } {
  const locale = input.locale ?? "cs";
  const cap = input.capability.replace(/_/g, " ").toLowerCase();
  if (locale.startsWith("cs")) {
    if (input.state === "LIMITED") {
      return {
        title: "Funkce je omezená",
        body: `${cap} je na trhu ${input.marketCode} dostupná jen v omezeném režimu. Výsledky berte jako orientační.`,
      };
    }
    return {
      title: "Funkce zatím není dostupná",
      body: `${cap} pro trh ${input.marketCode} zatím nenabízíme. Pracujeme na rozšíření — mezitím můžete prohlížet nabídky a ostatní dostupné nástroje.`,
    };
  }
  if (input.state === "LIMITED") {
    return {
      title: "Limited availability",
      body: `${cap} is only partially available in market ${input.marketCode}. Treat outputs as orientational.`,
    };
  }
  return {
    title: "Not available in this market yet",
    body: `${cap} is not offered for ${input.marketCode} yet. You can still browse listings and use other available tools.`,
  };
}
