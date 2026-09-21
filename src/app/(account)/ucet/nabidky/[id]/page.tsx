import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { SellerListingForm } from "@/components/listings/seller-listing-form";
import { SellerListingControls } from "@/components/listings/seller-listing-controls";
import { SellerFloorPlanPanel } from "@/components/floorplans/seller-floor-plan-panel";
import { ListingInbox } from "@/components/listings/listing-inbox";
import { PageHeader } from "@/components/layout/page-layouts";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  assertCanManageListing,
  readPrivateOfferThreshold,
} from "@/domains/listings/seller/seller-listing-service";
import { answersFromFeatureRow } from "@/domains/properties/parameters";

type Props = { params: Promise<{ id: string }> };

export default async function UpravNabidkuPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/ucet/nabidky");
  }

  const { id } = await params;
  const access = await assertCanManageListing({
    propertyId: id,
    userId: session.user.id,
  });
  if (!access.ok) notFound();

  const property = await prisma.property.findUnique({
    where: { id },
    include: { media: { orderBy: { sortOrder: "asc" } }, features: true },
  });
  if (!property) notFound();

  const featureAnswers = answersFromFeatureRow(property.features);

  const ext =
    property.marketExtensions &&
    typeof property.marketExtensions === "object" &&
    !Array.isArray(property.marketExtensions)
      ? (property.marketExtensions as Record<string, unknown>)
      : {};
  const rent =
    ext.rent && typeof ext.rent === "object"
      ? (ext.rent as Record<string, unknown>)
      : {};
  const offer =
    ext.offerPrice && typeof ext.offerPrice === "object"
      ? (ext.offerPrice as Record<string, unknown>)
      : {};
  const swap =
    ext.swap && typeof ext.swap === "object"
      ? (ext.swap as Record<string, unknown>)
      : {};

  return (
    <div className="space-y-10">
      <PageHeader
        title={property.title}
        description={`Stav: ${property.status}${property.status === "ACTIVE" ? ` · /nemovitosti/${property.slug}` : ""}${property.parametersNeedCompletion ? " · doplňte povinné parametry" : ""}`}
        breadcrumbs={[
          { href: "/ucet", label: "Účet" },
          { href: "/ucet/nabidky", label: "Nabídky" },
          { label: "Úprava" },
        ]}
      />

      {property.parametersNeedCompletion ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Tato nabídka potřebuje doplnění strukturovaných parametrů (Ano/Ne). Dokud
          neodpovíte, nelze ji znovu publikovat.
        </p>
      ) : null}

      <SellerListingControls propertyId={property.id} status={property.status} />

      {(property.propertyType === "APARTMENT" ||
        property.propertyType === "HOUSE") && (
        <SellerFloorPlanPanel
          propertyId={property.id}
          listedAreaM2={property.usableArea}
          listingMedia={property.media.map((m) => ({
            id: m.id,
            url: m.url,
            alt: m.alt,
            type: m.type,
          }))}
        />
      )}

      {property.media.length ? (
        <ul className="flex flex-wrap gap-3">
          {property.media.map((m) => (
            <li key={m.id} className="text-xs text-[var(--text-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt ?? ""}
                className="h-24 w-32 rounded object-cover"
              />
              {m.isPrimary ? " hlavní" : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <SellerListingForm
        mode="edit"
        propertyId={property.id}
        defaults={{
          title: property.title,
          description: property.description ?? "",
          shortDescription: property.shortDescription ?? "",
          propertyType: property.propertyType,
          transactionType: property.transactionType,
          askingPrice: property.askingPrice,
          currency: property.currency,
          usableArea: property.usableArea,
          layout: property.layout,
          condition: property.condition,
          ownershipType: property.ownershipType,
          energyRating: property.energyRating,
          publicCity: property.publicCity,
          publicDistrict: property.publicDistrict,
          publicRegion: property.publicRegion,
          marketCode: property.marketCode,
          rentMonthly:
            typeof rent.rentMonthly === "number" ? rent.rentMonthly : null,
          servicesMonthly:
            typeof rent.servicesMonthly === "number"
              ? rent.servicesMonthly
              : null,
          utilitiesMonthly:
            typeof rent.utilitiesMonthly === "number"
              ? rent.utilitiesMonthly
              : null,
          deposit: typeof rent.deposit === "number" ? rent.deposit : null,
          otherOneOffCosts:
            typeof rent.otherOneOffCosts === "number"
              ? rent.otherOneOffCosts
              : null,
          availableFrom:
            typeof rent.availableFrom === "string" ? rent.availableFrom : null,
          leaseTermMonths:
            typeof rent.leaseTermMonths === "number"
              ? rent.leaseTermMonths
              : null,
          offerPriceEnabled: Boolean(offer.enabled),
          privateThreshold: readPrivateOfferThreshold(property.marketExtensions),
          willingToSwap: Boolean(swap.willing),
          acceptsCoPurchaseSeekPartner: property.acceptsCoPurchaseSeekPartner,
          acceptsCoPurchaseSellerRetains: property.acceptsCoPurchaseSellerRetains,
          offeredOwnershipPercent: property.offeredOwnershipPercent,
          featureAnswers,
          parametersNeedCompletion: property.parametersNeedCompletion,
        }}
      />

      <ListingInbox userId={session.user.id} propertyId={property.id} />

      <p className="text-sm">
        <Link href="/ucet/nabidky" className="underline underline-offset-2">
          Zpět na seznam
        </Link>
      </p>
    </div>
  );
}
