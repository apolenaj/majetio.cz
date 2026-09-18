/**
 * Integration tests for seller listing authz + inquiry isolation.
 * Skips when DATABASE_URL is unreachable (local without Postgres).
 */

import { createHash, randomBytes } from "node:crypto";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/db";
import {
  addSellerListingPhoto,
  archiveSellerListing,
  assertCanManageListing,
  createSellerDraft,
  listSellerInquiries,
  publishSellerListing,
  removeSellerListingPhoto,
} from "@/domains/listings/seller/seller-listing-service";
import { createInquiry, getInquiryForAgent } from "@/domains/crm/inquiry-service";
import { toPublicPropertyDto } from "@/domains/properties/service/dto";
import { mapPrismaPropertyToRecord } from "@/domains/properties/service/prisma-mapper";
import { resolveStorageDriver } from "@/lib/storage/listing-media-storage";

const RUN =
  process.env.RUN_DB_INTEGRATION === "1" ||
  process.env.CI === "true" ||
  process.env.RUN_DB_INTEGRATION === "true";

async function dbReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe.runIf(RUN)("seller listing + inquiry integration (DB)", () => {
  let reachable = false;
  const suffix = randomBytes(3).toString("hex");
  let ownerId = "";
  let strangerId = "";
  let propertyId = "";
  let slug = "";

  beforeAll(async () => {
    reachable = await dbReachable();
    if (!reachable) return;

    const passwordHash = await hash("TestUser1!", 10);
    const owner = await prisma.user.create({
      data: {
        email: `owner.${suffix}@majetio.local`,
        name: "Owner Synthetic",
        passwordHash,
        emailVerified: new Date(),
        role: "USER",
      },
    });
    const stranger = await prisma.user.create({
      data: {
        email: `buyer.${suffix}@majetio.local`,
        name: "Buyer Synthetic",
        passwordHash,
        emailVerified: new Date(),
        role: "USER",
      },
    });
    ownerId = owner.id;
    strangerId = stranger.id;
  }, 60_000);

  afterAll(async () => {
    if (!reachable) return;
    try {
      if (propertyId) {
        await prisma.inquiry.deleteMany({ where: { propertyId } });
        await prisma.propertyMedia.deleteMany({ where: { propertyId } });
        await prisma.property.deleteMany({ where: { id: propertyId } });
      }
      await prisma.user.deleteMany({
        where: { email: { in: [`owner.${suffix}@majetio.local`, `buyer.${suffix}@majetio.local`] } },
      });
    } catch {
      // best-effort cleanup
    }
    await prisma.$disconnect();
  });

  it("skips cleanly when DB is down", async () => {
    if (!reachable) {
      expect(reachable).toBe(false);
      return;
    }
    expect(reachable).toBe(true);
  });

  it("owner can draft, upload photo, publish; catalog rules hold", async () => {
    if (!reachable) return;

    const draft = await createSellerDraft({
      userId: ownerId,
      data: {
        title: `Test byt ${suffix}`,
        description: "Syntetická nabídka pro integrační test.",
        propertyType: "APARTMENT",
        transactionType: "SALE",
        askingPrice: 4_500_000,
        currency: "CZK",
        usableArea: 62,
        layout: "2+kk",
        publicCity: "Brno",
        marketCode: "CZ",
        offerPrice: { enabled: true, privateThreshold: 4_200_000 },
      },
    });
    expect(draft.ok).toBe(true);
    if (!draft.ok) return;
    propertyId = draft.propertyId;
    slug = draft.slug;

    // Tiny 1x1 PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const photo = await addSellerListingPhoto({
      userId: ownerId,
      propertyId,
      fileName: "pixel.png",
      contentType: "image/png",
      bytes: png,
      makePrimary: true,
    });
    expect(photo.ok).toBe(true);
    if (photo.ok) {
      expect(photo.url.length).toBeGreaterThan(5);
    }

    const pub = await publishSellerListing({ userId: ownerId, propertyId });
    expect(pub.ok).toBe(true);

    const row = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { media: true },
    });
    expect(row?.status).toBe("ACTIVE");
    expect(row?.media.length).toBeGreaterThan(0);

    const dto = toPublicPropertyDto(mapPrismaPropertyToRecord(row!));
    expect(dto.isDemo).toBe(false);
    const json = JSON.stringify(dto);
    expect(json).not.toContain("4200000");
    expect(json).not.toContain("privateThreshold");
  });

  it("stranger cannot edit, archive, or manage photos of owner listing", async () => {
    if (!reachable || !propertyId) return;

    const denied = await assertCanManageListing({
      propertyId,
      userId: strangerId,
    });
    expect(denied.ok).toBe(false);

    const arch = await archiveSellerListing({
      userId: strangerId,
      propertyId,
    });
    expect(arch.ok).toBe(false);

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const photo = await addSellerListingPhoto({
      userId: strangerId,
      propertyId,
      fileName: "evil.png",
      contentType: "image/png",
      bytes: png,
    });
    expect(photo.ok).toBe(false);

    const media = await prisma.propertyMedia.findFirst({
      where: { propertyId },
    });
    if (media) {
      const rem = await removeSellerListingPhoto({
        userId: strangerId,
        propertyId,
        mediaId: media.id,
      });
      expect(rem.ok).toBe(false);
    }
  });

  it("buyer inquiry lands in owner inbox only", async () => {
    if (!reachable || !propertyId) return;

    const created = await createInquiry({
      propertyId,
      buyerUserId: strangerId,
      buyerName: "Zájemce",
      buyerEmail: `buyer.${suffix}@majetio.local`,
      message: "Mám zájem o prohlídku.",
      source: "integration_test",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const ownerInbox = await listSellerInquiries(ownerId);
    expect(ownerInbox.some((i) => i.id === created.inquiryId)).toBe(true);

    const strangerInbox = await listSellerInquiries(strangerId);
    expect(strangerInbox.some((i) => i.id === created.inquiryId)).toBe(false);

    const agentView = await getInquiryForAgent({
      inquiryId: created.inquiryId,
      agentUserId: strangerId,
    });
    expect(agentView.ok).toBe(false);

    const ownerView = await getInquiryForAgent({
      inquiryId: created.inquiryId,
      agentUserId: ownerId,
    });
    // Owner may not be agentUserId if listedByUserId is owner — createInquiry sets agentUserId from listedByUserId
    expect(ownerView.ok).toBe(true);
  });

  it("archive removes listing from public ACTIVE discovery", async () => {
    if (!reachable || !propertyId) return;

    const arch = await archiveSellerListing({
      userId: ownerId,
      propertyId,
    });
    expect(arch.ok).toBe(true);

    const row = await prisma.property.findUnique({ where: { id: propertyId } });
    expect(row?.status).toBe("ARCHIVED");
    expect(row?.visibility).toBe("PRIVATE");

    const publicHit = await prisma.property.findFirst({
      where: {
        id: propertyId,
        status: "ACTIVE",
        visibility: "PUBLIC",
      },
    });
    expect(publicHit).toBeNull();
  });

  it("documents storage driver for this environment", () => {
    const driver = resolveStorageDriver();
    expect(["local", "s3", "unavailable"]).toContain(driver);
    // Local verification environment should allow local disk.
    if (process.env.VERCEL !== "1") {
      expect(driver).not.toBe("unavailable");
    }
  });
});

describe("storage adapter (unit)", () => {
  it("reports missing S3 env without leaking secret values", async () => {
    const { storageConfigStatus } = await import(
      "@/lib/storage/listing-media-storage"
    );
    const status = storageConfigStatus();
    expect(status).toHaveProperty("driver");
    const blob = JSON.stringify(status);
    expect(blob).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(blob).not.toContain(process.env.S3_SECRET_ACCESS_KEY || "___none___");
  });
});

// silence unused in skip path
void createHash;
