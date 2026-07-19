/**
 * Seed demo properties (isDemo: true) — Prompt 7 Part 5.
 * Mirrors src/content/demo-canonical-properties.ts for DB-backed environments.
 *
 * Usage: npx tsx scripts/seed-demo-properties.ts
 * Requires DATABASE_URL and applied migrations.
 */
import {
  AddressPrecision,
  LicenseStatus,
  PriceChangeType,
  PropertyFreshness,
  PropertySourceType,
  PropertyStatus,
  PropertyType,
  PropertyVisibility,
  TransactionType,
} from "@prisma/client";

import { prisma } from "../src/lib/db";

async function upsertDemo(input: {
  slug: string;
  canonicalKey: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  askingPrice: number;
  usableArea: number;
  layout: string;
  publicLabel: string;
  publicCity: string;
  publicDistrict?: string;
  publicRegion?: string;
  addressPrecision?: AddressPrecision;
  freshness?: PropertyFreshness;
  lastSeenAt?: Date;
  completenessScore: number;
  ownerUserId?: string | null;
  visibility?: PropertyVisibility;
  priceEvents: Array<{ amount: number; changeType: PriceChangeType; daysAgo: number }>;
  sources: Array<{
    provider: string;
    sourceType: PropertySourceType;
    externalPropertyId: string;
    daysAgo: number;
  }>;
}) {
  const now = new Date();
  const lastSeen =
    input.lastSeenAt ?? new Date(now.getTime() - (input.freshness === "STALE" ? 8 : 1) * 86400000);

  const property = await prisma.property.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      canonicalKey: input.canonicalKey,
      status: PropertyStatus.ACTIVE,
      visibility: input.visibility ?? PropertyVisibility.PUBLIC,
      transactionType: TransactionType.SALE,
      title: input.title,
      description: input.description,
      propertyType: input.propertyType,
      askingPrice: input.askingPrice,
      priceCzk: input.askingPrice,
      currency: "CZK",
      pricePerSqm: Math.round(input.askingPrice / input.usableArea),
      usableArea: input.usableArea,
      areaSqm: input.usableArea,
      layout: input.layout,
      disposition: input.layout,
      publicLabel: input.publicLabel,
      addressPrecision: input.addressPrecision ?? AddressPrecision.APPROXIMATE,
      publicCity: input.publicCity,
      publicDistrict: input.publicDistrict,
      publicRegion: input.publicRegion,
      freshness: input.freshness ?? PropertyFreshness.FRESH,
      lastSeenAt: lastSeen,
      firstSeenAt: lastSeen,
      publishedAt: lastSeen,
      isDemo: true,
      ownerUserId: input.ownerUserId ?? null,
    },
    update: {
      title: input.title,
      description: input.description,
      askingPrice: input.askingPrice,
      priceCzk: input.askingPrice,
      usableArea: input.usableArea,
      isDemo: true,
      freshness: input.freshness ?? PropertyFreshness.FRESH,
      lastSeenAt: lastSeen,
      ownerUserId: input.ownerUserId ?? null,
      visibility: input.visibility ?? PropertyVisibility.PUBLIC,
    },
  });

  await prisma.dataCompletenessScore.upsert({
    where: { propertyId: property.id },
    create: {
      propertyId: property.id,
      score: input.completenessScore,
      breakdown: { seed: true },
    },
    update: { score: input.completenessScore, breakdown: { seed: true } },
  });

  for (const source of input.sources) {
    const seen = new Date(now.getTime() - source.daysAgo * 86400000);
    await prisma.propertySource.upsert({
      where: {
        provider_externalPropertyId: {
          provider: source.provider,
          externalPropertyId: source.externalPropertyId,
        },
      },
      create: {
        propertyId: property.id,
        provider: source.provider,
        externalPropertyId: source.externalPropertyId,
        sourceType: source.sourceType,
        licenseStatus: LicenseStatus.OWNED,
        isPrimary: true,
        firstSeenAt: seen,
        lastSeenAt: seen,
        lastFetchedAt: seen,
      },
      update: {
        propertyId: property.id,
        lastSeenAt: seen,
        lastFetchedAt: seen,
      },
    });
  }

  const existingHistory = await prisma.propertyPriceHistory.count({
    where: { propertyId: property.id },
  });
  if (existingHistory === 0) {
    for (const event of input.priceEvents) {
      await prisma.propertyPriceHistory.create({
        data: {
          propertyId: property.id,
          amount: event.amount,
          currency: "CZK",
          changeType: event.changeType,
          observedAt: new Date(now.getTime() - event.daysAgo * 86400000),
        },
      });
    }
  }

  return property;
}

async function main() {
  await upsertDemo({
    slug: "demo-byt-3kk-vinohrady",
    canonicalKey: "demo:byt-3kk-vinohrady",
    title: "Ukázkový byt 3+kk (demo)",
    description: "Demonstrační byt s kompletními daty a historií ceny.",
    propertyType: PropertyType.APARTMENT,
    askingPrice: 6_490_000,
    usableArea: 74,
    layout: "3+kk",
    publicLabel: "Praha 2 — Vinohrady (demo)",
    publicCity: "Praha",
    publicDistrict: "Vinohrady",
    publicRegion: "Hlavní město Praha",
    completenessScore: 92,
    priceEvents: [
      { amount: 6_790_000, changeType: PriceChangeType.INITIAL, daysAgo: 60 },
      { amount: 6_490_000, changeType: PriceChangeType.DECREASED, daysAgo: 12 },
    ],
    sources: [
      {
        provider: "partner:demo-feed",
        sourceType: PropertySourceType.PARTNER_FEED,
        externalPropertyId: "vinohrady-3kk",
        daysAgo: 1,
      },
    ],
  });

  await upsertDemo({
    slug: "demo-dum-rekonstrukce",
    canonicalKey: "demo:dum-rekonstrukce",
    title: "Ukázkový dům k rekonstrukci (demo)",
    description: "Dům k rekonstrukci — neúplná data, zastaralý zdroj.",
    propertyType: PropertyType.HOUSE,
    askingPrice: 12_400_000,
    usableArea: 160,
    layout: "5+1",
    publicLabel: "Demonstrační lokalita — Brno-venkov",
    publicCity: "Šlapanice",
    publicRegion: "Jihomoravský kraj",
    freshness: PropertyFreshness.STALE,
    completenessScore: 58,
    priceEvents: [
      { amount: 12_400_000, changeType: PriceChangeType.INITIAL, daysAgo: 40 },
    ],
    sources: [
      {
        provider: "manual",
        sourceType: PropertySourceType.MANUAL,
        externalPropertyId: "dum-reno-1",
        daysAgo: 8,
      },
    ],
  });

  await upsertDemo({
    slug: "demo-byt-2kk-brno",
    canonicalKey: "demo:byt-2kk-brno",
    title: "Ukázkový byt 2+kk (demo)",
    description: "Brno demo s čerstvými daty.",
    propertyType: PropertyType.APARTMENT,
    askingPrice: 4_200_000,
    usableArea: 52,
    layout: "2+kk",
    publicLabel: "Brno — střed (demo)",
    publicCity: "Brno",
    publicDistrict: "Brno-střed",
    publicRegion: "Jihomoravský kraj",
    completenessScore: 85,
    priceEvents: [
      { amount: 4_350_000, changeType: PriceChangeType.INITIAL, daysAgo: 45 },
      { amount: 4_200_000, changeType: PriceChangeType.DECREASED, daysAgo: 5 },
    ],
    sources: [
      {
        provider: "partner:demo-feed",
        sourceType: PropertySourceType.PARTNER_FEED,
        externalPropertyId: "brno-2kk",
        daysAgo: 0,
      },
    ],
  });

  await upsertDemo({
    slug: "demo-byt-2kk-nizka-cena",
    canonicalKey: "demo:byt-nizka-cena",
    title: "Ukázkový byt 2+kk — nízká cena (demo)",
    description: "Neúplná data pro QA completeness / quality UI.",
    propertyType: PropertyType.APARTMENT,
    askingPrice: 3_890_000,
    usableArea: 48,
    layout: "2+kk",
    publicLabel: "Demonstrační lokalita",
    publicCity: "Ostrava",
    addressPrecision: AddressPrecision.HIDDEN,
    freshness: PropertyFreshness.STALE,
    completenessScore: 42,
    priceEvents: [],
    sources: [
      {
        provider: "portal:demo",
        sourceType: PropertySourceType.PUBLIC_PORTAL,
        externalPropertyId: "ostrava-low",
        daysAgo: 25,
      },
    ],
  });

  console.log("Demo properties seeded (isDemo: true).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
