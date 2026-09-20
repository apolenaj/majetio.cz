/**
 * Veřejné formátování strukturovaných parametrů.
 */

import {
  FEATURE_PARAM_DEFS,
  LAND_UTILITY_KEYS,
  LAND_UTILITY_LABELS,
  UTILITY_STATUS_LABELS,
  applicableFeatureDefs,
  type FeatureDetail,
  type FeatureDetailsMap,
  type FeatureKey,
  type FeaturePresence,
  type LandUtilityKey,
  type UtilityStatus,
  presenceFromDb,
} from "@/domains/properties/parameters/feature-schema";

export type PublicFeatureRow = {
  key: string;
  label: string;
  value: string;
  note: string | null;
};

export type PublicFeatureGroup = {
  id: string;
  title: string;
  rows: PublicFeatureRow[];
};

const GROUP_TITLES: Record<string, string> = {
  outdoor: "Venkovní prostory",
  storage_parking: "Úložné prostory a parkování",
  technical: "Technické vybavení",
  comfort: "Další vybavení",
  utilities: "Sítě a přístup",
};

export function buildPublicFeatureGroups(input: {
  propertyType: string;
  answers: Partial<Record<FeatureKey, boolean | null | undefined>>;
  details?: FeatureDetailsMap | null;
  landUtilities?: Partial<Record<LandUtilityKey, UtilityStatus>> | null;
}): PublicFeatureGroup[] {
  const byGroup = new Map<string, PublicFeatureRow[]>();

  for (const def of applicableFeatureDefs(input.propertyType)) {
    const presence = presenceFromDb(input.answers[def.key]);
    // Nevztažné typy už filtruje applicableFeatureDefs.
    // Historické unset: zobraz „Neuvedeno“ jen u povinných / relevantních.
    const line = formatFeatureLine({
      key: def.key,
      presence,
      detail: input.details?.[def.key],
    });
    if (presence === "unset" && !def.requiredOnPublish) continue;
    const rows = byGroup.get(def.group) ?? [];
    rows.push({
      key: def.key,
      label: line.label,
      value: line.value,
      note: line.note,
    });
    byGroup.set(def.group, rows);
  }

  if (input.propertyType === "LAND") {
    const utilityRows: PublicFeatureRow[] = [];
    for (const key of LAND_UTILITY_KEYS) {
      const status = input.landUtilities?.[key];
      if (!status) {
        utilityRows.push({
          key,
          label: LAND_UTILITY_LABELS[key],
          value: "Neuvedeno",
          note: null,
        });
        continue;
      }
      utilityRows.push({
        key,
        label: LAND_UTILITY_LABELS[key],
        value: UTILITY_STATUS_LABELS[status],
        note:
          status === "in_reach"
            ? "V dosahu neznamená připojení."
            : null,
      });
    }
    if (utilityRows.length) byGroup.set("utilities", utilityRows);
  }

  const order = [
    "outdoor",
    "storage_parking",
    "technical",
    "comfort",
    "utilities",
  ];
  return order
    .filter((id) => (byGroup.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      title: GROUP_TITLES[id] ?? id,
      rows: byGroup.get(id)!,
    }));
}

function formatArea(detail: FeatureDetail | null | undefined): string | null {
  if (!detail) return null;
  if (detail.areaUnknown) return "výměra neuvedena";
  if (detail.areaSqm != null && Number.isFinite(detail.areaSqm) && detail.areaSqm > 0) {
    return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(detail.areaSqm)} m²`;
  }
  return null;
}

export function formatFeaturePresence(presence: FeaturePresence): string {
  if (presence === "yes") return "Ano";
  if (presence === "no") return "Není";
  return "Neuvedeno";
}

export function formatFeatureLine(input: {
  key: FeatureKey;
  presence: FeaturePresence;
  detail?: FeatureDetail | null;
}): { label: string; value: string; note: string | null } {
  const def = FEATURE_PARAM_DEFS.find((item) => item.key === input.key);
  const label = def?.labelCs ?? input.key;
  if (input.presence !== "yes") {
    return {
      label,
      value: formatFeaturePresence(input.presence),
      note: null,
    };
  }

  const parts = ["Ano"];
  const area = formatArea(input.detail);
  if (area) parts.push(area);
  if (input.detail?.count != null && input.detail.count > 0) {
    parts.push(`${input.detail.count}×`);
  }
  if (input.key === "parking" && input.detail?.parkingType) {
    const map = {
      owned: "vlastní",
      reserved: "vyhrazené",
      rented: "pronajaté",
      shared: "společné",
    } as const;
    parts.push(map[input.detail.parkingType]);
  }
  if (input.detail?.includedInPrice === true) {
    parts.push("v ceně");
  } else if (input.detail?.separatePriceCzk != null && input.detail.separatePriceCzk > 0) {
    parts.push(
      `+ ${new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(input.detail.separatePriceCzk)}`,
    );
  }

  return {
    label,
    value: parts.join(" · "),
    note: input.detail?.note?.trim() || null,
  };
}

export function catalogFeatureHighlights(input: {
  answers: Partial<Record<FeatureKey, boolean | null | undefined>>;
  details?: Partial<Record<FeatureKey, FeatureDetail>> | null;
}): string[] {
  const order: FeatureKey[] = [
    "balcony",
    "loggia",
    "terrace",
    "garden",
    "cellar",
    "elevator",
    "parking",
    "garage",
  ];
  const out: string[] = [];
  for (const key of order) {
    if (input.answers[key] !== true) continue;
    const def = FEATURE_PARAM_DEFS.find((item) => item.key === key);
    if (!def) continue;
    const area = formatArea(input.details?.[key]);
    out.push(area ? `${def.labelCs} ${area}` : def.labelCs);
    if (out.length >= 4) break;
  }
  return out;
}

export function answersFromFeatureRow(
  row: Partial<Record<FeatureKey, boolean | null>> | null | undefined,
): Partial<Record<FeatureKey, FeaturePresence>> {
  if (!row) return {};
  const out: Partial<Record<FeatureKey, FeaturePresence>> = {};
  for (const def of FEATURE_PARAM_DEFS) {
    if (def.key in row) {
      out[def.key] = presenceFromDb(row[def.key]);
    }
  }
  return out;
}
