/**
 * Canonical demo catalog mapped to PublicPropertyDto (Prompt 7 Part 5).
 * Used by UI when DB seed is not available; seed script mirrors these rows.
 */

import type { PropertyRecord } from "@/domains/properties/service/dto";
import { formatAreaConflict } from "@/domains/properties/service/field-conflicts";
import {
  toPublicPropertyDto,
  type PublicPropertyDto,
} from "@/domains/properties/service/dto";

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const areaConflict = formatAreaConflict([
  { value: 72, sourceLabel: "Partner feed" },
  { value: 74, sourceLabel: "Portál" },
]);

/** Rich canonical records for demo (isDemo: true). */
export const DEMO_PROPERTY_RECORDS: PropertyRecord[] = [
  {
    id: "demo-apt-vinohrady",
    slug: "demo-byt-3kk-vinohrady",
    status: "ACTIVE",
    visibility: "PUBLIC",
    transactionType: "SALE",
    title: "Ukázkový byt 3+kk (demo)",
    description:
      "Demonstrační byt s kompletními daty — cena, lokalita, plocha i historie. Slouží k ověření UI, ne jako nabídka k prodeji.",
    propertyType: "APARTMENT",
    askingPrice: 6_490_000,
    currency: "CZK",
    pricePerSqm: 87_703,
    usableArea: 74,
    layout: "3+kk",
    publicLabel: "Praha 2 — Vinohrady (demo)",
    addressPrecision: "APPROXIMATE",
    publicCity: "Praha",
    publicDistrict: "Vinohrady",
    publicRegion: "Hlavní město Praha",
    street: "Korunní",
    houseNumber: "100",
    latitude: 50.075,
    longitude: 14.447,
    publishedAt: daysAgo(20),
    updatedAt: daysAgo(1),
    lastSeenAt: daysAgo(1),
    freshness: "FRESH",
    isDemo: true,
    dataQuality: "estimated",
    tags: ["Pronájem", "Centrum"],
    completenessScore: 92,
    grossYieldPct: 5.4,
    cashFlowMonthlyCzk: 2_400,
    majetioScore: 72,
    risk: "medium",
    fieldConflicts: areaConflict ? [areaConflict] : [],
    priceHistory: [
      {
        amount: 6_790_000,
        currency: "CZK",
        changeType: "INITIAL",
        observedAt: daysAgo(60),
        sourceLabel: "Partner feed",
      },
      {
        amount: 6_490_000,
        currency: "CZK",
        changeType: "DECREASED",
        observedAt: daysAgo(12),
        sourceLabel: "Partner feed",
      },
    ],
    sources: [
      {
        provider: "partner:demo-feed",
        sourceType: "PARTNER_FEED",
        lastSeenAt: daysAgo(1),
        lastFetchedAt: daysAgo(1),
        freshness: "FRESH",
        isPrimary: true,
      },
      {
        provider: "portal:demo",
        sourceType: "PUBLIC_PORTAL",
        lastSeenAt: daysAgo(3),
        lastFetchedAt: daysAgo(3),
        freshness: "FRESH",
        isPrimary: false,
      },
    ],
    media: [
      {
        url: "/brand/social/majetio-og-brand.png",
        type: "PHOTO",
        isPrimary: true,
        isPlaceholder: true,
        alt: "Náhled demo bytu",
      },
    ],
    internalNotes: "INTERNAL: do not show",
    canonicalKey: "demo:byt-3kk-vinohrady",
  },
  {
    id: "demo-house-reno",
    slug: "demo-dum-rekonstrukce",
    status: "ACTIVE",
    visibility: "PUBLIC",
    transactionType: "SALE",
    title: "Ukázkový dům k rekonstrukci (demo)",
    description:
      "Dům ve stavu vyžadujícím rekonstrukci — nižší skóre, vyšší riziko, neúplná data (chybí energetický štítek).",
    propertyType: "HOUSE",
    askingPrice: 12_400_000,
    currency: "CZK",
    pricePerSqm: 77_500,
    usableArea: 160,
    layout: "5+1",
    publicLabel: "Demonstrační lokalita — Brno-venkov",
    addressPrecision: "APPROXIMATE",
    publicCity: "Šlapanice",
    publicDistrict: null,
    publicRegion: "Jihomoravský kraj",
    publishedAt: daysAgo(40),
    updatedAt: daysAgo(8),
    lastSeenAt: daysAgo(8),
    freshness: "STALE",
    isDemo: true,
    dataQuality: "incomplete",
    tags: ["Rekonstrukce", "Dům"],
    completenessScore: 58,
    grossYieldPct: 2.1,
    cashFlowMonthlyCzk: -1_800,
    majetioScore: 48,
    risk: "high",
    priceHistory: [
      {
        amount: 12_400_000,
        currency: "CZK",
        changeType: "INITIAL",
        observedAt: daysAgo(40),
        sourceLabel: "Manuální vstup",
      },
    ],
    sources: [
      {
        provider: "manual",
        sourceType: "MANUAL",
        lastSeenAt: daysAgo(8),
        lastFetchedAt: daysAgo(8),
        freshness: "STALE",
        isPrimary: true,
      },
    ],
    media: [],
    canonicalKey: "demo:dum-rekonstrukce",
  },
  {
    id: "demo-apt-brno",
    slug: "demo-byt-2kk-brno",
    status: "ACTIVE",
    visibility: "PUBLIC",
    transactionType: "SALE",
    title: "Ukázkový byt 2+kk (demo)",
    description: "Kompletnější Brno demo s čerstvými daty.",
    propertyType: "APARTMENT",
    askingPrice: 4_200_000,
    currency: "CZK",
    pricePerSqm: 80_769,
    usableArea: 52,
    layout: "2+kk",
    publicLabel: "Brno — střed (demo)",
    addressPrecision: "APPROXIMATE",
    publicCity: "Brno",
    publicDistrict: "Brno-střed",
    publicRegion: "Jihomoravský kraj",
    publishedAt: daysAgo(10),
    updatedAt: daysAgo(0),
    lastSeenAt: daysAgo(0),
    freshness: "FRESH",
    isDemo: true,
    dataQuality: "estimated",
    tags: ["Pronájem", "Brno"],
    completenessScore: 85,
    grossYieldPct: 5.2,
    cashFlowMonthlyCzk: 3_100,
    majetioScore: 76,
    risk: "low",
    priceHistory: [
      {
        amount: 4_350_000,
        currency: "CZK",
        changeType: "INITIAL",
        observedAt: daysAgo(45),
        sourceLabel: "Partner feed",
      },
      {
        amount: 4_200_000,
        currency: "CZK",
        changeType: "DECREASED",
        observedAt: daysAgo(5),
        sourceLabel: "Partner feed",
      },
    ],
    sources: [
      {
        provider: "partner:demo-feed",
        sourceType: "PARTNER_FEED",
        lastSeenAt: daysAgo(0),
        lastFetchedAt: daysAgo(0),
        freshness: "FRESH",
        isPrimary: true,
      },
    ],
    media: [
      {
        url: "/brand/social/majetio-og-brand.png",
        type: "PHOTO",
        isPrimary: true,
        isPlaceholder: true,
        alt: "Náhled demo bytu Brno",
      },
    ],
    canonicalKey: "demo:byt-2kk-brno",
  },
  {
    id: "demo-apt-incomplete",
    slug: "demo-byt-2kk-nizka-cena",
    status: "ACTIVE",
    visibility: "PUBLIC",
    transactionType: "SALE",
    title: "Ukázkový byt 2+kk — nízká cena (demo)",
    description: "Neúplná data: chybí popis lokalitních metrik a energetický štítek.",
    propertyType: "APARTMENT",
    askingPrice: 3_890_000,
    currency: "CZK",
    pricePerSqm: 81_042,
    usableArea: 48,
    layout: "2+kk",
    publicLabel: "Demonstrační lokalita",
    addressPrecision: "HIDDEN",
    publicCity: "Ostrava",
    publishedAt: daysAgo(25),
    updatedAt: daysAgo(25),
    lastSeenAt: daysAgo(25),
    freshness: "STALE",
    isDemo: true,
    dataQuality: "incomplete",
    tags: ["Neúplná data", "Sleva"],
    completenessScore: 42,
    grossYieldPct: 6.8,
    cashFlowMonthlyCzk: -2_200,
    majetioScore: 49,
    risk: "high",
    priceHistory: [],
    sources: [
      {
        provider: "portal:demo",
        sourceType: "PUBLIC_PORTAL",
        lastSeenAt: daysAgo(25),
        lastFetchedAt: daysAgo(25),
        freshness: "STALE",
        isPrimary: true,
      },
    ],
    media: [],
    canonicalKey: "demo:byt-nizka-cena",
  },
  {
    id: "demo-private-owner-b",
    slug: "demo-private-owner-b",
    status: "ACTIVE",
    visibility: "PRIVATE",
    transactionType: "SALE",
    title: "Soukromá nemovitost uživatele B (demo IDOR)",
    description: "Tato položka ověřuje, že User A ji nesmí vidět.",
    propertyType: "APARTMENT",
    askingPrice: 9_999_000,
    currency: "CZK",
    usableArea: 90,
    layout: "4+kk",
    publicLabel: "Skrytá adresa",
    addressPrecision: "EXACT",
    publicCity: "Praha",
    street: "Tajná",
    houseNumber: "1",
    latitude: 50.1,
    longitude: 14.4,
    ownerUserId: "user-b-owner",
    isDemo: true,
    dataQuality: "verified",
    tags: ["Private"],
    internalNotes: "owner B only",
    canonicalKey: "demo:private-b",
    media: [],
    priceHistory: [],
    sources: [],
  },
];

export function getDemoPropertyRecord(slug: string): PropertyRecord | undefined {
  return DEMO_PROPERTY_RECORDS.find((p) => p.slug === slug);
}

export function getDemoPublicProperty(slug: string): PublicPropertyDto | undefined {
  const record = getDemoPropertyRecord(slug);
  if (!record) return undefined;
  if (record.visibility === "PRIVATE") return undefined;
  return toPublicPropertyDto(record);
}

export function listDemoPublicProperties(): PublicPropertyDto[] {
  return DEMO_PROPERTY_RECORDS.filter((r) => r.visibility === "PUBLIC").map((r) =>
    toPublicPropertyDto(r),
  );
}
