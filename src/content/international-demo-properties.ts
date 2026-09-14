/**
 * Multi-market synthetic demos for QA / E2E isolation tests (Prompt 17 final).
 *
 * Rules:
 * - Always isDemo: true
 * - visibility PRIVATE — never appear in public /nemovitosti listings
 * - Not production inventory; titles marked Demo
 */

import type { PropertyRecord } from "@/domains/properties/service/dto";
import {
  toPublicPropertyDto,
  type PublicPropertyDto,
} from "@/domains/properties/service/dto";

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

/**
 * Spain / Dubai / Croatia — PRIVATE demos only.
 * Do not merge into public DEMO_PROPERTY_RECORDS listing index.
 */
export const INTERNATIONAL_DEMO_PROPERTY_RECORDS: PropertyRecord[] = [
  {
    id: "demo-es-apt-bcn",
    slug: "demo-es-apartment-barcelona",
    status: "ACTIVE",
    visibility: "PRIVATE",
    transactionType: "SALE",
    title: "Demo — Barcelona apartment (ES QA)",
    description:
      "Synthetic Spain apartment for multi-market QA. Not a public listing.",
    propertyType: "APARTMENT",
    askingPrice: 420_000,
    currency: "EUR",
    marketCode: "ES",
    pricePerSqm: 7_000,
    usableArea: 60,
    layout: "2 bedrooms",
    condition: "GOOD",
    ownershipType: "PERSONAL",
    publicLabel: "Barcelona — Eixample (demo)",
    addressPrecision: "CITY",
    publicCity: "Barcelona",
    publicRegion: "Catalonia",
    publishedAt: daysAgo(3),
    updatedAt: daysAgo(1),
    lastSeenAt: daysAgo(1),
    isDemo: true,
    dataQuality: "estimated",
    tags: ["Demo", "ES", "QA"],
    canonicalKey: "demo:es:barcelona-apartment",
    media: [],
    priceHistory: [],
    sources: [],
  },
  {
    id: "demo-ae-apt-dxb",
    slug: "demo-ae-apartment-dubai",
    status: "ACTIVE",
    visibility: "PRIVATE",
    transactionType: "SALE",
    title: "Demo — Dubai Marina apartment (AE QA)",
    description:
      "Synthetic Dubai apartment for UAE market isolation QA. Not a public listing.",
    propertyType: "APARTMENT",
    askingPrice: 2_150_000,
    currency: "AED",
    marketCode: "AE",
    pricePerSqm: 19_545,
    usableArea: 110,
    layout: "2 bedrooms",
    condition: "GOOD",
    ownershipType: "PERSONAL",
    publicLabel: "Dubai Marina (demo)",
    addressPrecision: "CITY",
    publicCity: "Dubai",
    publicRegion: "Dubai",
    publishedAt: daysAgo(5),
    updatedAt: daysAgo(2),
    lastSeenAt: daysAgo(2),
    isDemo: true,
    dataQuality: "estimated",
    tags: ["Demo", "AE", "QA"],
    canonicalKey: "demo:ae:dubai-marina-apartment",
    media: [],
    priceHistory: [],
    sources: [],
  },
  {
    id: "demo-hr-hol-split",
    slug: "demo-hr-holiday-split",
    status: "ACTIVE",
    visibility: "PRIVATE",
    transactionType: "SALE",
    title: "Demo — Split holiday property (HR QA)",
    description:
      "Synthetic Croatia holiday property for multi-market QA. Not a public listing.",
    propertyType: "HOUSE",
    askingPrice: 380_000,
    currency: "EUR",
    marketCode: "HR",
    pricePerSqm: 4_222,
    usableArea: 90,
    layout: "3 bedrooms",
    condition: "GOOD",
    ownershipType: "PERSONAL",
    publicLabel: "Split — Bačvice (demo)",
    addressPrecision: "CITY",
    publicCity: "Split",
    publicRegion: "Split-Dalmatia",
    publishedAt: daysAgo(7),
    updatedAt: daysAgo(3),
    lastSeenAt: daysAgo(3),
    isDemo: true,
    dataQuality: "estimated",
    tags: ["Demo", "HR", "QA", "Holiday"],
    canonicalKey: "demo:hr:split-holiday",
    media: [],
    priceHistory: [],
    sources: [],
  },
];

export function getInternationalDemoRecord(
  slug: string,
): PropertyRecord | undefined {
  return INTERNATIONAL_DEMO_PROPERTY_RECORDS.find((r) => r.slug === slug);
}

/** QA accessor — returns DTO even for PRIVATE demos (tests / admin QA only). */
export function getInternationalDemoProperty(
  slug: string,
): PublicPropertyDto | undefined {
  const record = getInternationalDemoRecord(slug);
  if (!record) return undefined;
  return toPublicPropertyDto(record, { viewerRole: "STAFF" });
}

export function listInternationalDemoProperties(): PublicPropertyDto[] {
  return INTERNATIONAL_DEMO_PROPERTY_RECORDS.map((r) =>
    toPublicPropertyDto(r, { viewerRole: "STAFF" }),
  );
}

/** Guard: international demos must never be treated as public inventory. */
export function isPublicListingEligibleDemo(record: PropertyRecord): boolean {
  if (record.isDemo !== true) return false;
  if (record.visibility === "PRIVATE") return false;
  if (record.marketCode && record.marketCode.toUpperCase() !== "CZ") {
    // Non-CZ demos are QA-only until market goes LIVE with real data
    return false;
  }
  return record.visibility === "PUBLIC" && record.status === "ACTIVE";
}
