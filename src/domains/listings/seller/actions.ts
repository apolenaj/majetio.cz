"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  addSellerListingPhoto,
  archiveSellerListing,
  createSellerDraft,
  publishSellerListing,
  unpublishSellerListing,
  updateSellerDraft,
  type SellerListingInput,
} from "@/domains/listings/seller/seller-listing-service";
import { createInquiry } from "@/domains/crm/inquiry-service";

export type ListingActionResult =
  | { ok: true; message?: string; propertyId?: string; slug?: string }
  | { ok: false; error: string; issues?: string[] };

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

const listingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(20000).optional().nullable(),
  propertyType: z.enum([
    "APARTMENT",
    "HOUSE",
    "VILLA",
    "TOWNHOUSE",
    "LAND",
    "COMMERCIAL",
    "OTHER",
  ]),
  transactionType: z.enum(["SALE", "RENT"]),
  askingPrice: z.coerce.number().positive().max(1_000_000_000_000),
  currency: z.string().min(3).max(3).optional(),
  usableArea: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive().max(1_000_000).optional().nullable(),
  ),
  layout: z.string().max(40).optional().nullable(),
  condition: z.string().max(40).optional().nullable(),
  ownershipType: z.string().max(40).optional().nullable(),
  energyRating: z.string().max(10).optional().nullable(),
  publicCity: z.string().min(1).max(120),
  publicDistrict: z.string().max(120).optional().nullable(),
  publicRegion: z.string().max(120).optional().nullable(),
  marketCode: z.string().max(8).optional(),
  countryCode: z.string().max(8).optional(),
  rentMonthly: z.preprocess(
    emptyToUndef,
    z.coerce.number().nonnegative().optional().nullable(),
  ),
  servicesMonthly: z.preprocess(
    emptyToUndef,
    z.coerce.number().nonnegative().optional().nullable(),
  ),
  utilitiesMonthly: z.preprocess(
    emptyToUndef,
    z.coerce.number().nonnegative().optional().nullable(),
  ),
  deposit: z.preprocess(
    emptyToUndef,
    z.coerce.number().nonnegative().optional().nullable(),
  ),
  otherOneOffCosts: z.preprocess(
    emptyToUndef,
    z.coerce.number().nonnegative().optional().nullable(),
  ),
  availableFrom: z.string().max(40).optional().nullable(),
  leaseTermMonths: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().positive().max(600).optional().nullable(),
  ),
  offerPriceEnabled: z.enum(["on", "true", "1"]).optional(),
  privateThreshold: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive().optional().nullable(),
  ),
  willingToSwap: z.enum(["on", "true", "1"]).optional(),
});

function parseListingForm(formData: FormData): {
  ok: true;
  data: SellerListingInput;
} | { ok: false; error: string } {
  const raw = Object.fromEntries(formData.entries());
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Zkontrolujte povinná pole (název, lokalita, cena, typ).",
    };
  }
  const v = parsed.data;
  const offerEnabled = Boolean(v.offerPriceEnabled);
  return {
    ok: true,
    data: {
      title: v.title,
      description: v.description,
      propertyType: v.propertyType,
      transactionType: v.transactionType,
      askingPrice: v.askingPrice,
      currency: v.currency,
      usableArea: v.usableArea ?? null,
      layout: v.layout,
      condition: v.condition,
      ownershipType: v.ownershipType,
      energyRating: v.energyRating,
      publicCity: v.publicCity,
      publicDistrict: v.publicDistrict,
      publicRegion: v.publicRegion,
      marketCode: v.marketCode,
      countryCode: v.countryCode,
      rent:
        v.transactionType === "RENT"
          ? {
              rentMonthly: v.rentMonthly ?? v.askingPrice,
              servicesMonthly: v.servicesMonthly ?? null,
              utilitiesMonthly: v.utilitiesMonthly ?? null,
              deposit: v.deposit ?? null,
              otherOneOffCosts: v.otherOneOffCosts ?? null,
              availableFrom: v.availableFrom ?? null,
              leaseTermMonths: v.leaseTermMonths ?? null,
            }
          : null,
      offerPrice: {
        enabled: offerEnabled,
        privateThreshold: offerEnabled ? (v.privateThreshold ?? null) : null,
      },
      willingToSwap: Boolean(v.willingToSwap),
    },
  };
}

async function requireUserId(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Pro vložení nabídky se přihlaste." };
  }
  return { ok: true, userId: session.user.id };
}

export async function createListingDraftAction(
  formData: FormData,
): Promise<ListingActionResult> {
  const user = await requireUserId();
  if (!user.ok) return user;

  const parsed = parseListingForm(formData);
  if (!parsed.ok) return parsed;

  const result = await createSellerDraft({
    userId: user.userId,
    data: parsed.data,
  });
  if (!result.ok) return result;

  revalidatePath("/ucet/nabidky");
  revalidatePath("/pridat-nemovitost");
  redirect(`/ucet/nabidky/${result.propertyId}`);
}

export async function saveListingDraftAction(
  propertyId: string,
  formData: FormData,
): Promise<ListingActionResult> {
  const user = await requireUserId();
  if (!user.ok) return user;

  const parsed = parseListingForm(formData);
  if (!parsed.ok) return parsed;

  const result = await updateSellerDraft({
    userId: user.userId,
    propertyId,
    data: parsed.data,
  });
  if (!result.ok) return result;

  revalidatePath(`/ucet/nabidky/${propertyId}`);
  revalidatePath("/ucet/nabidky");
  return { ok: true, message: "Koncept uložen." };
}

export async function publishListingAction(
  propertyId: string,
): Promise<ListingActionResult> {
  const user = await requireUserId();
  if (!user.ok) return user;

  const result = await publishSellerListing({
    userId: user.userId,
    propertyId,
  });
  if (!result.ok) return result;

  revalidatePath("/nemovitosti");
  revalidatePath(`/nemovitosti/${result.slug}`);
  revalidatePath("/ucet/nabidky");
  revalidatePath(`/ucet/nabidky/${propertyId}`);
  return { ok: true, message: "Nabídka je publikovaná.", slug: result.slug };
}

export async function unpublishListingAction(
  propertyId: string,
): Promise<ListingActionResult> {
  const user = await requireUserId();
  if (!user.ok) return user;
  const result = await unpublishSellerListing({
    userId: user.userId,
    propertyId,
  });
  if (!result.ok) return result;
  revalidatePath("/ucet/nabidky");
  revalidatePath("/nemovitosti");
  return { ok: true, message: "Nabídka stažena z katalogu." };
}

export async function archiveListingAction(
  propertyId: string,
): Promise<ListingActionResult> {
  const user = await requireUserId();
  if (!user.ok) return user;
  const result = await archiveSellerListing({
    userId: user.userId,
    propertyId,
  });
  if (!result.ok) return result;
  revalidatePath("/ucet/nabidky");
  revalidatePath("/nemovitosti");
  return { ok: true, message: "Nabídka archivována." };
}

export async function uploadListingPhotoAction(
  propertyId: string,
  formData: FormData,
): Promise<ListingActionResult> {
  const user = await requireUserId();
  if (!user.ok) return user;

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Vyberte fotografii." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await addSellerListingPhoto({
    userId: user.userId,
    propertyId,
    fileName: file.name,
    contentType: file.type,
    bytes,
    alt: String(formData.get("alt") || "") || null,
    makePrimary: formData.get("makePrimary") != null,
  });
  if (!result.ok) return result;

  revalidatePath(`/ucet/nabidky/${propertyId}`);
  return { ok: true, message: "Fotografie uložena." };
}

export async function removeListingPhotoAction(
  propertyId: string,
  mediaId: string,
): Promise<ListingActionResult> {
  const user = await requireUserId();
  if (!user.ok) return user;

  const { removeSellerListingPhoto } = await import(
    "@/domains/listings/seller/seller-listing-service"
  );
  const result = await removeSellerListingPhoto({
    userId: user.userId,
    propertyId,
    mediaId,
  });
  if (!result.ok) return result;
  revalidatePath(`/ucet/nabidky/${propertyId}`);
  return { ok: true, message: "Fotografie odstraněna." };
}

export async function submitPropertyInquiryAction(
  formData: FormData,
): Promise<ListingActionResult> {
  const session = await auth();
  const propertyId = String(formData.get("propertyId") || "");
  const message = String(formData.get("message") || "");
  const buyerName = String(formData.get("buyerName") || "") || null;
  const buyerEmail = String(formData.get("buyerEmail") || "") || null;
  const buyerPhone = String(formData.get("buyerPhone") || "") || null;

  if (!propertyId) return { ok: false, error: "Chybí identifikátor nabídky." };

  const result = await createInquiry({
    propertyId,
    buyerUserId: session?.user?.id ?? null,
    buyerName,
    buyerEmail,
    buyerPhone,
    message,
    source: "property_detail",
  });
  if (!result.ok) return result;

  revalidatePath("/ucet/poptavky");
  return { ok: true, message: "Poptávka odeslána inzerentovi." };
}
