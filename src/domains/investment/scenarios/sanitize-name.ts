/**
 * Sanitize scenario names — strip HTML / control chars (XSS / injection protection).
 */

import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const TAGS = /<\/?[^>]+>/g;
const SCRIPTISH = /javascript:|data:text\/html/gi;

export function sanitizeScenarioName(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(TAGS, "")
    .replace(SCRIPTISH, "")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export const scenarioNameSchema = z
  .string()
  .min(1, "Název je povinný")
  .max(120)
  .transform(sanitizeScenarioName)
  .refine((v) => v.length >= 1, "Název je povinný")
  .refine((v) => !/[<>]/.test(v), "Název nesmí obsahovat HTML");

export type ScenarioVariantId =
  | "conservative"
  | "realistic"
  | "optimistic"
  | "custom";

export const SCENARIO_VARIANT_LABELS: Record<ScenarioVariantId, string> = {
  conservative: "Konzervativní",
  realistic: "Realistický",
  optimistic: "Optimistický",
  custom: "Vlastní",
};

export function toPrismaVariant(
  id: ScenarioVariantId,
): "CONSERVATIVE" | "REALISTIC" | "OPTIMISTIC" | "CUSTOM" {
  switch (id) {
    case "conservative":
      return "CONSERVATIVE";
    case "realistic":
      return "REALISTIC";
    case "optimistic":
      return "OPTIMISTIC";
    case "custom":
      return "CUSTOM";
  }
}
