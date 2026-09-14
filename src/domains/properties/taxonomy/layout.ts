/**
 * Dual layout model (Prompt 17.3).
 * Analytics: bedrooms / bathrooms (canonical).
 * UI: market-local notation (CZ 3+kk, EN "3 bed", …).
 */

export type LayoutNotationSystem =
  | "CZ_DISPOSITION" // 3+kk, 2+1
  | "BEDROOM_COUNT" // "3 bedroom"
  | "STUDIO_FLAG"
  | "GENERIC";

export type CanonicalLayout = {
  /** Analytic bedrooms (studio → 0). */
  bedrooms: number | null;
  bathrooms: number | null;
  /** Extra rooms beyond bedrooms when known (CZ +1 vs +kk). */
  additionalRooms: number | null;
  kitchenKind: "kk" | "separate" | "unknown" | null;
  /** True for studio / garsonka. */
  isStudio: boolean;
};

export type LocalizedLayoutDisplay = {
  notationSystem: LayoutNotationSystem;
  /** Exact string for UI (e.g. 3+kk or "3 bed"). */
  label: string;
  locale: string;
};

const CZ_DISP_RE = /^(\d+)\s*\+\s*(kk|\d+)$/i;
const BED_RE = /^(\d+)\s*[-\s]?(?:bed|bedroom|br)s?$/i;

/**
 * Parse CZ disposition or bedroom strings into canonical layout.
 */
export function parseLayoutToCanonical(
  raw: string | null | undefined,
): CanonicalLayout | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();

  if (/^(studio|garsonka|garsoni[eé]ra)$/i.test(value)) {
    return {
      bedrooms: 0,
      bathrooms: null,
      additionalRooms: null,
      kitchenKind: "kk",
      isStudio: true,
    };
  }

  const cz = value.replace(/\s+/g, "").match(CZ_DISP_RE);
  if (cz) {
    const rooms = Number(cz[1]);
    const second = cz[2]!.toLowerCase();
    if (second === "kk") {
      return {
        bedrooms: Math.max(0, rooms - 1),
        bathrooms: null,
        additionalRooms: 0,
        kitchenKind: "kk",
        isStudio: rooms <= 1,
      };
    }
    const add = Number(second);
    return {
      bedrooms: Math.max(0, rooms - 1),
      bathrooms: null,
      additionalRooms: Number.isFinite(add) ? add : null,
      kitchenKind: "separate",
      isStudio: false,
    };
  }

  const bed = value.match(BED_RE);
  if (bed) {
    const n = Number(bed[1]);
    return {
      bedrooms: n,
      bathrooms: null,
      additionalRooms: null,
      kitchenKind: "unknown",
      isStudio: n === 0,
    };
  }

  return null;
}

export function formatLayoutForMarket(input: {
  layout: CanonicalLayout;
  notationSystem: LayoutNotationSystem;
  locale: string;
  bathrooms?: number | null;
}): LocalizedLayoutDisplay {
  const baths = input.bathrooms ?? input.layout.bathrooms;

  if (input.notationSystem === "CZ_DISPOSITION") {
    if (input.layout.isStudio || input.layout.bedrooms === 0) {
      return {
        notationSystem: "CZ_DISPOSITION",
        label: "1+kk",
        locale: input.locale,
      };
    }
    const totalRooms = (input.layout.bedrooms ?? 0) + 1;
    if (input.layout.kitchenKind === "separate") {
      const add = input.layout.additionalRooms ?? 1;
      return {
        notationSystem: "CZ_DISPOSITION",
        label: `${totalRooms}+${add}`,
        locale: input.locale,
      };
    }
    return {
      notationSystem: "CZ_DISPOSITION",
      label: `${totalRooms}+kk`,
      locale: input.locale,
    };
  }

  if (input.notationSystem === "BEDROOM_COUNT") {
    const beds = input.layout.bedrooms ?? 0;
    const bedLabel =
      beds === 0
        ? "Studio"
        : beds === 1
          ? "1 bedroom"
          : `${beds} bedrooms`;
    const bathLabel =
      baths != null
        ? baths === 1
          ? ", 1 bath"
          : `, ${baths} baths`
        : "";
    return {
      notationSystem: "BEDROOM_COUNT",
      label: `${bedLabel}${bathLabel}`,
      locale: input.locale,
    };
  }

  if (input.notationSystem === "STUDIO_FLAG" && input.layout.isStudio) {
    return {
      notationSystem: "STUDIO_FLAG",
      label: "Studio",
      locale: input.locale,
    };
  }

  return {
    notationSystem: "GENERIC",
    label:
      input.layout.bedrooms != null
        ? `${input.layout.bedrooms} bed`
        : "—",
    locale: input.locale,
  };
}

/**
 * Prefer explicit bedroom/bathroom counts; fall back to parsing layout string.
 */
export function resolveCanonicalLayout(input: {
  layoutString?: string | null;
  bedroomsCount?: number | null;
  bathroomsCount?: number | null;
}): CanonicalLayout {
  if (input.bedroomsCount != null || input.bathroomsCount != null) {
    return {
      bedrooms: input.bedroomsCount ?? null,
      bathrooms: input.bathroomsCount ?? null,
      additionalRooms: null,
      kitchenKind: "unknown",
      isStudio: (input.bedroomsCount ?? 1) === 0,
    };
  }
  return (
    parseLayoutToCanonical(input.layoutString) ?? {
      bedrooms: null,
      bathrooms: null,
      additionalRooms: null,
      kitchenKind: null,
      isStudio: false,
    }
  );
}
