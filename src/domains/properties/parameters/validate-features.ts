/**
 * Validace strukturovaných parametrů při publikaci a ukládání.
 */

import { z } from "zod";

import {
  FEATURE_PARAM_DEFS,
  applicableFeatureDefs,
  requiredFeatureKeys,
  type FeatureAnswers,
  type FeatureDetail,
  type FeatureDetailsMap,
  type FeatureKey,
  type FeaturePresence,
  type LandUtilityKey,
  type UtilityStatus,
  LAND_UTILITY_KEYS,
  LAND_UTILITY_LABELS,
} from "@/domains/properties/parameters/feature-schema";

const presenceSchema = z.enum(["yes", "no", "unset"]);

const detailSchema = z
  .object({
    areaSqm: z.number().positive().max(100_000).nullable().optional(),
    areaUnknown: z.boolean().optional(),
    count: z.number().int().positive().max(50).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
    cellarType: z.enum(["room", "cage", "other"]).nullable().optional(),
    parkingType: z
      .enum(["owned", "reserved", "rented", "shared"])
      .nullable()
      .optional(),
    includedInPrice: z.boolean().nullable().optional(),
    separatePriceCzk: z.number().nonnegative().max(1e9).nullable().optional(),
    garageKind: z
      .enum(["separate", "in_building", "collective"])
      .nullable()
      .optional(),
    gardenUse: z.enum(["private", "shared", "exclusive"]).nullable().optional(),
    barrierBuilding: presenceSchema.nullable().optional(),
    barrierUnit: presenceSchema.nullable().optional(),
  })
  .strict();

export type FeatureValidationIssue = {
  code: string;
  field: string;
  message: string;
  labelCs: string;
};

export function parseFeaturePresence(raw: unknown): FeaturePresence {
  if (raw === "yes" || raw === "true" || raw === true || raw === "1") return "yes";
  if (raw === "no" || raw === "false" || raw === false || raw === "0") return "no";
  return "unset";
}

/** Czech decimal comma → number; empty → null. Never treat blank as 0. */
export function parseLocalizedPositiveNumber(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const text = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function collectAnswersFromForm(
  formData: FormData,
  propertyType: string,
): { answers: FeatureAnswers; details: FeatureDetailsMap } {
  const answers: FeatureAnswers = {};
  const details: FeatureDetailsMap = {};
  for (const def of applicableFeatureDefs(propertyType)) {
    const presence = parseFeaturePresence(formData.get(`feature_${def.key}`));
    answers[def.key] = presence;
    if (presence !== "yes") continue;

    const detail: FeatureDetail = {};
    const areaUnknown = formData.get(`feature_${def.key}_areaUnknown`) === "on";
    if (areaUnknown) {
      detail.areaUnknown = true;
      detail.areaSqm = null;
    } else {
      detail.areaSqm = parseLocalizedPositiveNumber(
        formData.get(`feature_${def.key}_areaSqm`),
      );
    }
    const count = parseLocalizedPositiveNumber(
      formData.get(`feature_${def.key}_count`),
    );
    if (count != null) detail.count = Math.round(count);
    const note = String(formData.get(`feature_${def.key}_note`) ?? "").trim();
    if (note) detail.note = note.slice(0, 500);

    if (def.key === "cellar") {
      const cellarType = String(formData.get(`feature_${def.key}_cellarType`) ?? "");
      if (cellarType === "room" || cellarType === "cage" || cellarType === "other") {
        detail.cellarType = cellarType;
      }
    }
    if (def.key === "parking") {
      const parkingType = String(formData.get(`feature_${def.key}_parkingType`) ?? "");
      if (
        parkingType === "owned" ||
        parkingType === "reserved" ||
        parkingType === "rented" ||
        parkingType === "shared"
      ) {
        detail.parkingType = parkingType;
      }
      detail.includedInPrice =
        formData.get(`feature_${def.key}_includedInPrice`) === "yes"
          ? true
          : formData.get(`feature_${def.key}_includedInPrice`) === "no"
            ? false
            : null;
      detail.separatePriceCzk = parseLocalizedPositiveNumber(
        formData.get(`feature_${def.key}_separatePriceCzk`),
      );
    }
    if (def.key === "garage") {
      const garageKind = String(formData.get(`feature_${def.key}_garageKind`) ?? "");
      if (
        garageKind === "separate" ||
        garageKind === "in_building" ||
        garageKind === "collective"
      ) {
        detail.garageKind = garageKind;
      }
      detail.includedInPrice =
        formData.get(`feature_${def.key}_includedInPrice`) === "yes"
          ? true
          : formData.get(`feature_${def.key}_includedInPrice`) === "no"
            ? false
            : null;
    }
    if (def.key === "garden") {
      const gardenUse = String(formData.get(`feature_${def.key}_gardenUse`) ?? "");
      if (
        gardenUse === "private" ||
        gardenUse === "shared" ||
        gardenUse === "exclusive"
      ) {
        detail.gardenUse = gardenUse;
      }
    }

    const parsed = detailSchema.safeParse(detail);
    details[def.key] = parsed.success ? parsed.data : detail;
  }
  return { answers, details };
}

export function validateFeaturesForPublish(input: {
  propertyType: string;
  answers: FeatureAnswers;
  details: FeatureDetailsMap;
  landUtilities?: Partial<Record<LandUtilityKey, UtilityStatus>>;
}): { ok: boolean; issues: FeatureValidationIssue[] } {
  const issues: FeatureValidationIssue[] = [];
  for (const key of requiredFeatureKeys(input.propertyType)) {
    const def = FEATURE_PARAM_DEFS.find((item) => item.key === key)!;
    const presence = input.answers[key] ?? "unset";
    if (presence === "unset") {
      issues.push({
        code: "FEATURE_REQUIRED",
        field: `feature_${key}`,
        labelCs: def.labelCs,
        message: `Doplňte odpověď: ${def.labelCs}.`,
      });
      continue;
    }
    if (presence === "yes" && def.allowsArea) {
      const detail = input.details[key];
      const hasArea =
        detail?.areaUnknown === true ||
        (detail?.areaSqm != null && detail.areaSqm > 0);
      if (!hasArea) {
        issues.push({
          code: "FEATURE_AREA_REQUIRED",
          field: `feature_${key}_areaSqm`,
          labelCs: def.labelCs,
          message: `U položky ${def.labelCs} uveďte plochu, nebo zvolte „Přesnou výměru neznám“.`,
        });
      }
      if (detail?.areaUnknown && !detail.note?.trim()) {
        issues.push({
          code: "FEATURE_NOTE_REQUIRED",
          field: `feature_${key}_note`,
          labelCs: def.labelCs,
          message: `Bez známé výměry u ${def.labelCs} doplňte stručný popis.`,
        });
      }
    }
  }

  if (input.propertyType === "LAND") {
    for (const key of LAND_UTILITY_KEYS) {
      const status = input.landUtilities?.[key];
      if (!status) {
        issues.push({
          code: "UTILITY_REQUIRED",
          field: `utility_${key}`,
          labelCs: LAND_UTILITY_LABELS[key],
          message: `Doplňte stav: ${LAND_UTILITY_LABELS[key]}.`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Mapuje importovanou hodnotu — nerozpoznané zůstane unset, nikdy Ne. */
export function mapImportedPresence(raw: unknown): FeaturePresence {
  if (raw == null || raw === "") return "unset";
  if (typeof raw === "boolean") return raw ? "yes" : "no";
  const text = String(raw).trim().toLowerCase();
  if (["ano", "yes", "true", "1", "y", "ano."].includes(text)) return "yes";
  if (["ne", "no", "false", "0", "n", "není", "neni"].includes(text)) return "no";
  return "unset";
}

export function detailsFromJson(raw: unknown): FeatureDetailsMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const out: FeatureDetailsMap = {};
  for (const def of FEATURE_PARAM_DEFS) {
    const item = source[def.key];
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const parsed = detailSchema.safeParse(item);
    if (parsed.success) out[def.key] = parsed.data;
  }
  return out;
}

export function landUtilitiesFromDetailsJson(
  raw: unknown,
): Partial<Record<LandUtilityKey, UtilityStatus>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const utilities = (raw as Record<string, unknown>).utilities;
  if (!utilities || typeof utilities !== "object" || Array.isArray(utilities)) {
    return {};
  }
  return parseLandUtilitiesFromRecord(utilities as Record<string, unknown>);
}

function parseLandUtilitiesFromRecord(
  record: Record<string, unknown>,
): Partial<Record<LandUtilityKey, UtilityStatus>> {
  const out: Partial<Record<LandUtilityKey, UtilityStatus>> = {};
  const allowed: UtilityStatus[] = [
    "connected",
    "at_boundary",
    "in_reach",
    "none",
    "unknown",
  ];
  for (const key of LAND_UTILITY_KEYS) {
    const raw = String(record[key] ?? "");
    if (allowed.includes(raw as UtilityStatus)) {
      out[key] = raw as UtilityStatus;
    }
  }
  return out;
}

/** Při změně na Ne smaž veřejné podrobnosti. */
export function sanitizeDetailsForAnswers(
  answers: FeatureAnswers,
  details: FeatureDetailsMap,
): FeatureDetailsMap {
  const next: FeatureDetailsMap = {};
  for (const [key, detail] of Object.entries(details) as Array<
    [FeatureKey, FeatureDetail]
  >) {
    if (answers[key] === "yes") next[key] = detail;
  }
  return next;
}

export function parseLandUtilities(
  formData: FormData,
): Partial<Record<LandUtilityKey, UtilityStatus>> {
  const out: Partial<Record<LandUtilityKey, UtilityStatus>> = {};
  const allowed: UtilityStatus[] = [
    "connected",
    "at_boundary",
    "in_reach",
    "none",
    "unknown",
  ];
  for (const key of LAND_UTILITY_KEYS) {
    const raw = String(formData.get(`utility_${key}`) ?? "");
    if (allowed.includes(raw as UtilityStatus)) {
      out[key] = raw as UtilityStatus;
    }
  }
  return out;
}

export function missingRequiredFeatureLabels(input: {
  propertyType: string;
  answers: FeatureAnswers;
}): string[] {
  return requiredFeatureKeys(input.propertyType)
    .filter((key) => (input.answers[key] ?? "unset") === "unset")
    .map(
      (key) =>
        FEATURE_PARAM_DEFS.find((item) => item.key === key)?.labelCs ?? key,
    );
}
