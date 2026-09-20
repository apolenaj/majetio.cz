/**
 * Seller listing lifecycle — draft, media, publish, archive.
 * Server-side ownership checks only (no client trust).
 */

import { createHash, randomBytes } from "node:crypto";

import type { Prisma, PropertyType, TransactionType } from "@prisma/client";

import { validatePropertyForPublish } from "@/domains/properties/admin/publish-validation";
import {
  answersFromFeatureRow,
  landUtilitiesFromDetailsJson,
  missingRequiredFeatureLabels,
  presenceToDb,
  sanitizeDetailsForAnswers,
  validateFeaturesForPublish,
  type FeatureAnswers,
  type FeatureDetailsMap,
  type LandUtilityKey,
  type UtilityStatus,
} from "@/domains/properties/parameters";
import { prisma } from "@/lib/db";
import {
  deleteListingObject,
  putListingObject,
  storageConfigStatus,
} from "@/lib/storage/listing-media-storage";

export type SellerListingInput = {
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  propertyType: PropertyType;
  transactionType: TransactionType;
  askingPrice: number;
  currency?: string;
  usableArea?: number | null;
  layout?: string | null;
  condition?: string | null;
  ownershipType?: string | null;
  energyRating?: string | null;
  publicCity: string;
  publicDistrict?: string | null;
  publicRegion?: string | null;
  publicLabel?: string | null;
  marketCode?: string;
  countryCode?: string;
  /** Rent extras — stored in marketExtensions.rent */
  rent?: {
    rentMonthly?: number | null;
    servicesMonthly?: number | null;
    utilitiesMonthly?: number | null;
    deposit?: number | null;
    otherOneOffCosts?: number | null;
    availableFrom?: string | null;
    leaseTermMonths?: number | null;
  } | null;
  /** Offer-a-price mode — threshold never exposed in public DTO. */
  offerPrice?: {
    enabled: boolean;
    /** Owner-only private threshold. */
    privateThreshold?: number | null;
  } | null;
  willingToSwap?: boolean;
  acceptsCoPurchaseSeekPartner?: boolean;
  acceptsCoPurchaseSellerRetains?: boolean;
  offeredOwnershipPercent?: number | null;
  featureAnswers?: FeatureAnswers;
  featureDetails?: FeatureDetailsMap;
  landUtilities?: Partial<Record<LandUtilityKey, UtilityStatus>>;
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "nabidka";
  for (let i = 0; i < 8; i++) {
    const candidate =
      i === 0 ? root : `${root}-${randomBytes(2).toString("hex")}`;
    const exists = await prisma.property.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `${root}-${randomBytes(4).toString("hex")}`;
}

async function upsertListingFeatures(input: {
  propertyId: string;
  propertyType: string;
  answers?: FeatureAnswers;
  details?: FeatureDetailsMap;
  landUtilities?: Partial<Record<LandUtilityKey, UtilityStatus>>;
}): Promise<void> {
  if (!input.answers) return;
  const details = sanitizeDetailsForAnswers(
    input.answers,
    input.details ?? {},
  );
  const payload: Record<string, unknown> = { ...details };
  if (input.propertyType === "LAND" && input.landUtilities) {
    payload.utilities = input.landUtilities;
  }
  const missing = missingRequiredFeatureLabels({
    propertyType: input.propertyType,
    answers: input.answers,
  });
  const data = {
    balcony: presenceToDb(input.answers.balcony ?? "unset"),
    loggia: presenceToDb(input.answers.loggia ?? "unset"),
    terrace: presenceToDb(input.answers.terrace ?? "unset"),
    garden: presenceToDb(input.answers.garden ?? "unset"),
    cellar: presenceToDb(input.answers.cellar ?? "unset"),
    garage: presenceToDb(input.answers.garage ?? "unset"),
    parking: presenceToDb(input.answers.parking ?? "unset"),
    elevator: presenceToDb(input.answers.elevator ?? "unset"),
    barrierFree: presenceToDb(input.answers.barrierFree ?? "unset"),
    pool: presenceToDb(input.answers.pool ?? "unset"),
    furnished: presenceToDb(input.answers.furnished ?? "unset"),
    details: payload as Prisma.InputJsonValue,
  };

  await prisma.$transaction([
    prisma.propertyFeatures.upsert({
      where: { propertyId: input.propertyId },
      create: { propertyId: input.propertyId, ...data },
      update: data,
    }),
    prisma.property.update({
      where: { id: input.propertyId },
      data: {
        hasElevator: data.elevator,
        parametersNeedCompletion: missing.length > 0,
      },
    }),
  ]);
}

function buildMarketExtensions(
  existing: unknown,
  input: SellerListingInput,
): Prisma.InputJsonValue | undefined {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  if (input.transactionType === "RENT" && input.rent) {
    base.rent = {
      rentMonthly: input.rent.rentMonthly ?? null,
      servicesMonthly: input.rent.servicesMonthly ?? null,
      utilitiesMonthly: input.rent.utilitiesMonthly ?? null,
      deposit: input.rent.deposit ?? null,
      otherOneOffCosts: input.rent.otherOneOffCosts ?? null,
      availableFrom: input.rent.availableFrom ?? null,
      leaseTermMonths: input.rent.leaseTermMonths ?? null,
    };
  }

  if (input.offerPrice) {
    base.offerPrice = {
      enabled: Boolean(input.offerPrice.enabled),
      // Private — stripped from public API in dto layer via omission
      privateThreshold:
        input.offerPrice.enabled && input.offerPrice.privateThreshold != null
          ? input.offerPrice.privateThreshold
          : null,
    };
  }

  if (input.willingToSwap != null) {
    base.swap = { willing: Boolean(input.willingToSwap) };
  }

  return Object.keys(base).length ? (base as Prisma.InputJsonValue) : undefined;
}

export async function assertCanManageListing(input: {
  propertyId: string;
  userId: string;
}): Promise<
  | { ok: true; property: { id: string; ownerUserId: string | null; listedByUserId: string | null; organizationId: string | null; status: string; marketExtensions: unknown } }
  | { ok: false; error: string }
> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true,
      ownerUserId: true,
      listedByUserId: true,
      organizationId: true,
      status: true,
      marketExtensions: true,
    },
  });
  if (!property) return { ok: false, error: "Nabídka nenalezena." };

  if (property.ownerUserId === input.userId || property.listedByUserId === input.userId) {
    return { ok: true, property };
  }

  if (property.organizationId) {
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: property.organizationId,
        userId: input.userId,
        active: true,
      },
      select: { id: true },
    });
    if (member) return { ok: true, property };
  }

  return { ok: false, error: "Nemáte oprávnění spravovat tuto nabídku." };
}

export async function createSellerDraft(input: {
  userId: string;
  data: SellerListingInput;
}): Promise<{ ok: true; propertyId: string; slug: string } | { ok: false; error: string }> {
  const title = input.data.title.trim();
  if (!title) return { ok: false, error: "Název je povinný." };
  if (!input.data.publicCity?.trim()) {
    return { ok: false, error: "Město / lokalita je povinná." };
  }
  if (!(input.data.askingPrice > 0)) {
    return { ok: false, error: "Cena musí být kladná." };
  }

  const slug = await uniqueSlug(`${title}-${input.data.publicCity}`);
  const canonicalKey = `seller:${input.userId}:${createHash("sha256")
    .update(`${slug}:${Date.now()}`)
    .digest("hex")
    .slice(0, 24)}`;

  const usableArea = input.data.usableArea ?? null;
  const askingPrice = Math.round(input.data.askingPrice);
  const currency = input.data.currency?.trim().toUpperCase() || "CZK";

  const property = await prisma.property.create({
    data: {
      slug,
      canonicalKey,
      status: "DRAFT",
      visibility: "PUBLIC",
      transactionType: input.data.transactionType,
      title,
      description: input.data.description?.trim() || null,
      shortDescription: input.data.shortDescription?.trim() || null,
      propertyType: input.data.propertyType,
      askingPrice,
      priceCzk: currency === "CZK" ? askingPrice : null,
      currency,
      pricePerSqm:
        usableArea && usableArea > 0
          ? Math.round(askingPrice / usableArea)
          : null,
      usableArea,
      areaSqm: usableArea,
      layout: input.data.layout?.trim() || null,
      disposition: input.data.layout?.trim() || null,
      condition: (input.data.condition as never) || "UNKNOWN",
      ownershipType: (input.data.ownershipType as never) || "UNKNOWN",
      energyRating: (input.data.energyRating as never) || "UNKNOWN",
      publicCity: input.data.publicCity.trim(),
      publicDistrict: input.data.publicDistrict?.trim() || null,
      publicRegion: input.data.publicRegion?.trim() || null,
      publicLabel:
        input.data.publicLabel?.trim() ||
        `${title} — ${input.data.publicCity.trim()}`,
      addressPrecision: "APPROXIMATE",
      marketCode: input.data.marketCode?.trim().toUpperCase() || "CZ",
      countryCode: input.data.countryCode?.trim().toUpperCase() || "CZ",
      ownerUserId: input.userId,
      listedByUserId: input.userId,
      isDemo: false,
      negotiable: input.data.transactionType === "SALE" && Boolean(input.data.offerPrice?.enabled),
      acceptsCoPurchaseSeekPartner:
        input.data.transactionType === "SALE" && Boolean(input.data.acceptsCoPurchaseSeekPartner),
      acceptsCoPurchaseSellerRetains:
        input.data.transactionType === "SALE" && Boolean(input.data.acceptsCoPurchaseSellerRetains),
      offeredOwnershipPercent:
        input.data.transactionType === "SALE" ? input.data.offeredOwnershipPercent ?? null : null,
      marketExtensions: buildMarketExtensions(null, input.data),
    },
    select: { id: true, slug: true },
  });

  await upsertListingFeatures({
    propertyId: property.id,
    propertyType: input.data.propertyType,
    answers: input.data.featureAnswers,
    details: input.data.featureDetails,
    landUtilities: input.data.landUtilities,
  });

  return { ok: true, propertyId: property.id, slug: property.slug };
}

export async function updateSellerDraft(input: {
  userId: string;
  propertyId: string;
  data: SellerListingInput;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) return access;

  if (access.property.status === "ARCHIVED") {
    return { ok: false, error: "Archivovanou nabídku nelze upravit." };
  }

  const title = input.data.title.trim();
  if (!title) return { ok: false, error: "Název je povinný." };
  if (!input.data.publicCity?.trim()) {
    return { ok: false, error: "Město / lokalita je povinná." };
  }
  if (!(input.data.askingPrice > 0)) {
    return { ok: false, error: "Cena musí být kladná." };
  }

  const usableArea = input.data.usableArea ?? null;
  const askingPrice = Math.round(input.data.askingPrice);
  const currency = input.data.currency?.trim().toUpperCase() || "CZK";

  await prisma.property.update({
    where: { id: input.propertyId },
    data: {
      title,
      description: input.data.description?.trim() || null,
      shortDescription: input.data.shortDescription?.trim() || null,
      propertyType: input.data.propertyType,
      transactionType: input.data.transactionType,
      askingPrice,
      priceCzk: currency === "CZK" ? askingPrice : null,
      currency,
      pricePerSqm:
        usableArea && usableArea > 0
          ? Math.round(askingPrice / usableArea)
          : null,
      usableArea,
      areaSqm: usableArea,
      layout: input.data.layout?.trim() || null,
      disposition: input.data.layout?.trim() || null,
      condition: (input.data.condition as never) || "UNKNOWN",
      ownershipType: (input.data.ownershipType as never) || "UNKNOWN",
      energyRating: (input.data.energyRating as never) || "UNKNOWN",
      publicCity: input.data.publicCity.trim(),
      publicDistrict: input.data.publicDistrict?.trim() || null,
      publicRegion: input.data.publicRegion?.trim() || null,
      publicLabel:
        input.data.publicLabel?.trim() ||
        `${title} — ${input.data.publicCity.trim()}`,
      marketCode: input.data.marketCode?.trim().toUpperCase() || "CZ",
      countryCode: input.data.countryCode?.trim().toUpperCase() || "CZ",
      negotiable: input.data.transactionType === "SALE" && Boolean(input.data.offerPrice?.enabled),
      acceptsCoPurchaseSeekPartner:
        input.data.transactionType === "SALE" && Boolean(input.data.acceptsCoPurchaseSeekPartner),
      acceptsCoPurchaseSellerRetains:
        input.data.transactionType === "SALE" && Boolean(input.data.acceptsCoPurchaseSellerRetains),
      offeredOwnershipPercent:
        input.data.transactionType === "SALE" ? input.data.offeredOwnershipPercent ?? null : null,
      marketExtensions: buildMarketExtensions(
        access.property.marketExtensions,
        input.data,
      ),
    },
  });

  await upsertListingFeatures({
    propertyId: input.propertyId,
    propertyType: input.data.propertyType,
    answers: input.data.featureAnswers,
    details: input.data.featureDetails,
    landUtilities: input.data.landUtilities,
  });

  return { ok: true };
}

export async function publishSellerListing(input: {
  userId: string;
  propertyId: string;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string; issues?: string[] }> {
  const access = await assertCanManageListing(input);
  if (!access.ok) return access;

  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    include: { features: true },
  });
  if (!property) return { ok: false, error: "Nabídka nenalezena." };

  const validation = validatePropertyForPublish({
    title: property.title,
    propertyType: property.propertyType,
    askingPrice: property.askingPrice,
    currency: property.currency,
    usableArea: property.usableArea,
    publicCity: property.publicCity,
    marketCode: property.marketCode,
  });
  if (!validation.ok) {
    return {
      ok: false,
      error: "Nabídka není připravená k publikaci.",
      issues: validation.issues
        .filter((i) => i.severity === "CRITICAL")
        .map((i) => i.message),
    };
  }

  const answers = answersFromFeatureRow(property.features);
  const detailsRaw = property.features?.details;
  const details =
    detailsRaw && typeof detailsRaw === "object" && !Array.isArray(detailsRaw)
      ? (detailsRaw as FeatureDetailsMap)
      : {};
  const landUtilities =
    property.propertyType === "LAND"
      ? landUtilitiesFromDetailsJson(detailsRaw)
      : undefined;
  const featureValidation = validateFeaturesForPublish({
    propertyType: property.propertyType,
    answers,
    details,
    landUtilities,
  });
  const missingFeatures = missingRequiredFeatureLabels({
    propertyType: property.propertyType,
    answers,
  });
  if (!featureValidation.ok || missingFeatures.length > 0) {
    const labels = missingFeatures.length
      ? missingFeatures
      : [...new Set(featureValidation.issues.map((i) => i.labelCs))];
    return {
      ok: false,
      error: `K publikaci doplňte: ${labels.join(", ")}.`,
      issues: featureValidation.issues.map((i) => i.field),
    };
  }

  const updated = await prisma.property.update({
    where: { id: input.propertyId },
    data: {
      status: "ACTIVE",
      publishedAt: property.publishedAt ?? new Date(),
      lastSeenAt: new Date(),
      freshness: "FRESH",
      parametersNeedCompletion: false,
    },
    select: { slug: true },
  });

  return { ok: true, slug: updated.slug };
}

export async function unpublishSellerListing(input: {
  userId: string;
  propertyId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanManageListing(input);
  if (!access.ok) return access;

  await prisma.property.update({
    where: { id: input.propertyId },
    data: { status: "WITHDRAWN" },
  });
  return { ok: true };
}

export async function archiveSellerListing(input: {
  userId: string;
  propertyId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanManageListing(input);
  if (!access.ok) return access;

  await prisma.property.update({
    where: { id: input.propertyId },
    data: { status: "ARCHIVED", visibility: "PRIVATE" },
  });
  return { ok: true };
}

export async function listSellerListings(userId: string) {
  return prisma.property.findMany({
    where: {
      OR: [
        { ownerUserId: userId },
        { listedByUserId: userId },
        {
          organization: {
            members: { some: { userId, active: true } },
          },
        },
      ],
      isDemo: false,
    },
    include: {
      media: { where: { isPrimary: true }, take: 1 },
      _count: { select: { inquiries: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function listSellerInquiries(userId: string) {
  const listings = await prisma.property.findMany({
    where: {
      OR: [
        { ownerUserId: userId },
        { listedByUserId: userId },
        {
          organization: {
            members: { some: { userId, active: true } },
          },
        },
      ],
    },
    select: { id: true },
  });
  const ids = listings.map((l) => l.id);
  if (!ids.length) return [];

  return prisma.inquiry.findMany({
    where: { propertyId: { in: ids } },
    include: {
      property: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function addSellerListingPhoto(input: {
  userId: string;
  propertyId: string;
  fileName: string;
  contentType: string;
  bytes: Buffer;
  alt?: string | null;
  makePrimary?: boolean;
}): Promise<{ ok: true; mediaId: string; url: string } | { ok: false; error: string }> {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) return access;

  const stored = await putListingObject({
    bytes: input.bytes,
    fileName: input.fileName,
    contentType: input.contentType,
    keyPrefix: `listings/${input.propertyId}`,
  });
  if (!stored.ok) {
    return { ok: false, error: stored.error };
  }

  const existingCount = await prisma.propertyMedia.count({
    where: { propertyId: input.propertyId },
  });

  if (input.makePrimary || existingCount === 0) {
    await prisma.propertyMedia.updateMany({
      where: { propertyId: input.propertyId },
      data: { isPrimary: false },
    });
  }

  const media = await prisma.propertyMedia.create({
    data: {
      propertyId: input.propertyId,
      url: stored.object.url,
      type: "PHOTO",
      mimeType: input.contentType.split(";")[0]?.trim() || null,
      alt: input.alt?.trim() || null,
      isPrimary: input.makePrimary || existingCount === 0,
      isPlaceholder: false,
      licenseStatus: "OWNED",
      sortOrder: existingCount,
      // Persist opaque key in title field when S3 (url may be CDN); local uses url===key
      title: stored.object.storageKey !== stored.object.url ? stored.object.storageKey : null,
    },
    select: { id: true },
  });

  return { ok: true, mediaId: media.id, url: stored.object.url };
}

export async function removeSellerListingPhoto(input: {
  userId: string;
  propertyId: string;
  mediaId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) return access;

  const media = await prisma.propertyMedia.findFirst({
    where: { id: input.mediaId, propertyId: input.propertyId },
  });
  if (!media) return { ok: false, error: "Fotografie nenalezena." };

  const storageKey = media.title || media.url;
  await prisma.propertyMedia.delete({ where: { id: media.id } });
  await deleteListingObject(storageKey);

  if (media.isPrimary) {
    const next = await prisma.propertyMedia.findFirst({
      where: { propertyId: input.propertyId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.propertyMedia.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  return { ok: true };
}

export function getListingStorageStatus() {
  return storageConfigStatus();
}

/** Owner-only read of private offer threshold — never for public API. */
export function readPrivateOfferThreshold(
  marketExtensions: unknown,
): number | null {
  if (!marketExtensions || typeof marketExtensions !== "object") return null;
  const offer = (marketExtensions as Record<string, unknown>).offerPrice;
  if (!offer || typeof offer !== "object") return null;
  const threshold = (offer as Record<string, unknown>).privateThreshold;
  return typeof threshold === "number" ? threshold : null;
}
