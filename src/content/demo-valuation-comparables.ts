/**
 * Demo comparable pool for the valuation engine (Prompt 10 Part 4).
 * Synthetic market observations — not live listings. Used until DB comps exist.
 */

import type { ComparableCandidate } from "@/domains/valuation/service/types";

export type DemoComparableMeta = {
  candidate: ComparableCandidate;
  /** ALLOWED = show as public listing-like row; ANONYMIZE = strip identity. */
  publicLicense: "ALLOWED" | "ANONYMIZE";
  label?: string;
};

const daysAgoIso = (days: number) => {
  const d = new Date();
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
    observedAt: daysAgoIso(30),
    isTransaction: true,
    ...partial,
  };
}

/**
 * Rich Praha + Brno + Ostrava pools so apartment subjects reach MIN_COMPS.
 */
export const DEMO_VALUATION_COMPARABLES: DemoComparableMeta[] = [
  // —— Vinohrady / Praha cluster ——
  {
    publicLicense: "ALLOWED",
    label: "Byt 3+kk Vinohrady (transakce)",
    candidate: apt({
      id: "demo-comp-vh-01",
      usableArea: 72,
      layout: "3+kk",
      priceCzk: 6_350_000,
      floor: 3,
      hasBalcony: false,
      latitude: 50.0752,
      longitude: 14.4472,
      observedAt: daysAgoIso(18),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 3+kk Vinohrady",
    candidate: apt({
      id: "demo-comp-vh-02",
      usableArea: 76,
      layout: "3+kk",
      priceCzk: 6_720_000,
      floor: 4,
      hasBalcony: true,
      latitude: 50.076,
      longitude: 14.449,
      observedAt: daysAgoIso(40),
    }),
  },
  {
    publicLicense: "ANONYMIZE",
    label: "Partner feed — licence bez public comps",
    candidate: apt({
      id: "demo-comp-vh-03",
      usableArea: 70,
      layout: "3+kk",
      priceCzk: 6_100_000,
      floor: 2,
      hasBalcony: false,
      latitude: 50.0748,
      longitude: 14.4465,
      observedAt: daysAgoIso(55),
      isTransaction: false,
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 2+kk Vinohrady",
    candidate: apt({
      id: "demo-comp-vh-04",
      usableArea: 58,
      layout: "2+kk",
      priceCzk: 5_250_000,
      floor: 1,
      hasElevator: true,
      latitude: 50.0758,
      longitude: 14.445,
      observedAt: daysAgoIso(22),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 3+1 Vinohrady",
    candidate: apt({
      id: "demo-comp-vh-05",
      usableArea: 78,
      layout: "3+1",
      priceCzk: 6_900_000,
      floor: 5,
      floorsTotal: 6,
      hasBalcony: true,
      hasElevator: true,
      latitude: 50.0745,
      longitude: 14.45,
      observedAt: daysAgoIso(12),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 3+kk Vršovice (sousední)",
    candidate: apt({
      id: "demo-comp-vh-06",
      usableArea: 71,
      layout: "3+kk",
      priceCzk: 5_950_000,
      district: "Vršovice",
      latitude: 50.068,
      longitude: 14.46,
      observedAt: daysAgoIso(35),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 3+kk Žižkov (sousední)",
    candidate: apt({
      id: "demo-comp-vh-07",
      usableArea: 68,
      layout: "3+kk",
      priceCzk: 5_800_000,
      district: "Žižkov",
      latitude: 50.083,
      longitude: 14.45,
      observedAt: daysAgoIso(48),
    }),
  },
  {
    publicLicense: "ANONYMIZE",
    label: "Restricted portal comp",
    candidate: apt({
      id: "demo-comp-vh-08",
      usableArea: 74,
      layout: "3+kk",
      priceCzk: 6_480_000,
      floor: 3,
      latitude: 50.0765,
      longitude: 14.4485,
      observedAt: daysAgoIso(8),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 4+kk Vinohrady",
    candidate: apt({
      id: "demo-comp-vh-09",
      usableArea: 95,
      layout: "4+kk",
      priceCzk: 8_900_000,
      floor: 2,
      hasBalcony: true,
      latitude: 50.075,
      longitude: 14.444,
      observedAt: daysAgoIso(60),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 3+kk Holešovice",
    candidate: apt({
      id: "demo-comp-ho-01",
      usableArea: 65,
      layout: "2+1",
      priceCzk: 5_400_000,
      district: "Holešovice",
      latitude: 50.1,
      longitude: 14.44,
      observedAt: daysAgoIso(28),
    }),
  },
  // —— Brno ——
  {
    publicLicense: "ALLOWED",
    label: "Byt 2+kk Brno-střed",
    candidate: apt({
      id: "demo-comp-br-01",
      usableArea: 50,
      layout: "2+kk",
      condition: "EXCELLENT",
      priceCzk: 4_050_000,
      city: "Brno",
      district: "Brno-střed",
      region: "Jihomoravský kraj",
      latitude: 49.195,
      longitude: 16.608,
      floor: 2,
      floorsTotal: 4,
      observedAt: daysAgoIso(15),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 2+kk Brno",
    candidate: apt({
      id: "demo-comp-br-02",
      usableArea: 54,
      layout: "2+kk",
      condition: "GOOD",
      priceCzk: 4_280_000,
      city: "Brno",
      district: "Brno-střed",
      region: "Jihomoravský kraj",
      latitude: 49.196,
      longitude: 16.61,
      observedAt: daysAgoIso(25),
    }),
  },
  {
    publicLicense: "ANONYMIZE",
    label: "Brno partner (anonymize)",
    candidate: apt({
      id: "demo-comp-br-03",
      usableArea: 48,
      layout: "2+kk",
      priceCzk: 3_950_000,
      city: "Brno",
      district: "Brno-střed",
      region: "Jihomoravský kraj",
      latitude: 49.194,
      longitude: 16.607,
      observedAt: daysAgoIso(42),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 2+1 Brno",
    candidate: apt({
      id: "demo-comp-br-04",
      usableArea: 56,
      layout: "2+1",
      priceCzk: 4_400_000,
      city: "Brno",
      district: "Brno-střed",
      region: "Jihomoravský kraj",
      latitude: 49.197,
      longitude: 16.605,
      observedAt: daysAgoIso(33),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 3+kk Brno",
    candidate: apt({
      id: "demo-comp-br-05",
      usableArea: 68,
      layout: "3+kk",
      priceCzk: 5_100_000,
      city: "Brno",
      district: "Brno-sever",
      region: "Jihomoravský kraj",
      latitude: 49.21,
      longitude: 16.62,
      observedAt: daysAgoIso(50),
    }),
  },
  // —— Ostrava ——
  {
    publicLicense: "ALLOWED",
    label: "Byt 2+kk Ostrava",
    candidate: apt({
      id: "demo-comp-os-01",
      usableArea: 46,
      layout: "2+kk",
      condition: "AVERAGE",
      priceCzk: 3_650_000,
      city: "Ostrava",
      district: null,
      region: "Moravskoslezský kraj",
      latitude: 49.82,
      longitude: 18.26,
      floor: 1,
      floorsTotal: 3,
      hasElevator: false,
      observedAt: daysAgoIso(20),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 2+kk Ostrava 2",
    candidate: apt({
      id: "demo-comp-os-02",
      usableArea: 50,
      layout: "2+kk",
      priceCzk: 3_900_000,
      city: "Ostrava",
      region: "Moravskoslezský kraj",
      latitude: 49.821,
      longitude: 18.262,
      observedAt: daysAgoIso(38),
    }),
  },
  {
    publicLicense: "ANONYMIZE",
    label: "Ostrava restricted",
    candidate: apt({
      id: "demo-comp-os-03",
      usableArea: 47,
      layout: "2+kk",
      priceCzk: 3_720_000,
      city: "Ostrava",
      region: "Moravskoslezský kraj",
      latitude: 49.819,
      longitude: 18.258,
      observedAt: daysAgoIso(45),
    }),
  },
  {
    publicLicense: "ALLOWED",
    label: "Byt 2+1 Ostrava",
    candidate: apt({
      id: "demo-comp-os-04",
      usableArea: 55,
      layout: "2+1",
      priceCzk: 4_100_000,
      city: "Ostrava",
      region: "Moravskoslezský kraj",
      latitude: 49.823,
      longitude: 18.265,
      observedAt: daysAgoIso(14),
    }),
  },
];

export function listDemoValuationCandidates(): ComparableCandidate[] {
  return DEMO_VALUATION_COMPARABLES.map((m) => m.candidate);
}

export function getDemoComparableMeta(
  id: string,
): DemoComparableMeta | undefined {
  return DEMO_VALUATION_COMPARABLES.find((m) => m.candidate.id === id);
}
