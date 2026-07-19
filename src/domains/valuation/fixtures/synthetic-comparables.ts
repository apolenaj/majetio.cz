/**
 * Synthetic comparable datasets for valuation tests (Prompt 10 Part 5).
 * Three scenarios: dense Praha apartment market, sparse village house, extreme outlier.
 */

import type { ComparableCandidate, ValuationSubject } from "../service/types";

const daysAgo = (days: number) => {
  const d = new Date("2026-07-19T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
};

function apt(
  partial: Partial<ComparableCandidate> &
    Pick<ComparableCandidate, "id" | "priceCzk" | "usableArea">,
): ComparableCandidate {
  return {
    layout: "3+kk",
    condition: "GOOD",
    floor: 2,
    floorsTotal: 5,
    hasBalcony: false,
    hasElevator: true,
    city: "Praha",
    district: "Vinohrady",
    region: "Hlavní město Praha",
    latitude: 50.0755,
    longitude: 14.448,
    pricePerSqm: null,
    observedAt: daysAgo(30),
    isTransaction: true,
    ...partial,
  };
}

/** Subject: typical Praha 3+kk apartment. */
export const SYNTH_PRAHA_SUBJECT: ValuationSubject = {
  id: "synth-praha-subject",
  propertyType: "APARTMENT",
  usableArea: 72,
  layout: "3+kk",
  condition: "GOOD",
  floor: 3,
  floorsTotal: 5,
  hasBalcony: true,
  hasElevator: true,
  city: "Praha",
  district: "Vinohrady",
  region: "Hlavní město Praha",
  latitude: 50.075,
  longitude: 14.447,
};

/**
 * Dense Praha cluster (~90k Kč/m²) — enough comps for CALCULATED.
 * Includes one extreme outlier (luxury penthouse ppsqm) that selection must exclude.
 */
export const SYNTH_PRAHA_COMPS: ComparableCandidate[] = [
  apt({ id: "p-01", usableArea: 70, priceCzk: 6_300_000, latitude: 50.0752, longitude: 14.4472, observedAt: daysAgo(10) }),
  apt({ id: "p-02", usableArea: 74, priceCzk: 6_650_000, latitude: 50.0758, longitude: 14.4485, observedAt: daysAgo(18) }),
  apt({ id: "p-03", usableArea: 68, priceCzk: 6_100_000, latitude: 50.0748, longitude: 14.446, observedAt: daysAgo(25) }),
  apt({ id: "p-04", usableArea: 72, priceCzk: 6_480_000, floor: 4, hasBalcony: true, latitude: 50.076, longitude: 14.449, observedAt: daysAgo(12) }),
  apt({ id: "p-05", usableArea: 76, priceCzk: 6_850_000, latitude: 50.0745, longitude: 14.45, observedAt: daysAgo(40) }),
  apt({ id: "p-06", usableArea: 71, priceCzk: 6_200_000, district: "Vršovice", latitude: 50.068, longitude: 14.46, observedAt: daysAgo(22) }),
  apt({ id: "p-07", usableArea: 69, priceCzk: 6_050_000, district: "Žižkov", latitude: 50.083, longitude: 14.45, observedAt: daysAgo(35) }),
  apt({ id: "p-08", usableArea: 73, priceCzk: 6_550_000, latitude: 50.0755, longitude: 14.4478, observedAt: daysAgo(8) }),
  /** Extreme outlier — ~350k Kč/m² vs ~90k cluster */
  apt({
    id: "p-outlier-extreme",
    usableArea: 80,
    priceCzk: 28_000_000,
    layout: "3+kk",
    latitude: 50.0751,
    longitude: 14.4475,
    observedAt: daysAgo(5),
  }),
];

/** Subject: village house with sparse market. */
export const SYNTH_VILLAGE_SUBJECT: ValuationSubject = {
  id: "synth-village-house",
  propertyType: "HOUSE",
  usableArea: 140,
  layout: "5+1",
  condition: "AVERAGE",
  floor: null,
  floorsTotal: 2,
  hasBalcony: false,
  hasElevator: false,
  city: "Nová Ves",
  district: null,
  region: "Středočeský kraj",
  latitude: 49.9,
  longitude: 14.1,
};

/** Only 1–2 distant / weak comps → INSUFFICIENT_DATA expected. */
export const SYNTH_VILLAGE_COMPS: ComparableCandidate[] = [
  {
    id: "v-01",
    usableArea: 120,
    layout: "4+1",
    condition: "GOOD",
    floor: null,
    floorsTotal: 2,
    hasBalcony: false,
    hasElevator: false,
    city: "Nová Ves",
    district: null,
    region: "Středočeský kraj",
    latitude: 49.901,
    longitude: 14.102,
    priceCzk: 4_200_000,
    pricePerSqm: null,
    observedAt: daysAgo(90),
    isTransaction: true,
  },
  {
    id: "v-02",
    usableArea: 160,
    layout: "5+1",
    condition: "NEEDS_RENOVATION",
    floor: null,
    floorsTotal: 2,
    city: "Jiná Ves",
    district: null,
    region: "Středočeský kraj",
    latitude: 50.2,
    longitude: 14.5,
    priceCzk: 3_800_000,
    pricePerSqm: null,
    observedAt: daysAgo(200),
    isTransaction: false,
    hasBalcony: false,
    hasElevator: false,
  },
];

export const SYNTH_AS_OF = new Date("2026-07-19T12:00:00.000Z");
