import type { PropertyCardData } from "@/components/property/property-card";
import type { DataQuality } from "@/components/ui/badge";
import { conditionLabel, propertyTypeLabel } from "@/domains/properties/service/identity-labels";
import type { PublicPropertyDto, PublicPropertyListItemDto } from "./dto";

function locationLabel(
  dto: Pick<PublicPropertyListItemDto, "location">,
): string {
  return (
    dto.location.label ||
    [dto.location.district, dto.location.city].filter(Boolean).join(", ") ||
    "Lokalita neuvedena"
  );
}

export function mapPublicDtoToPropertyCard(
  dto: PublicPropertyListItemDto | PublicPropertyDto,
): PropertyCardData {
  const freshness = "freshness" in dto ? dto.freshness : null;
  const status = "status" in dto ? dto.status : null;
  let listingStatus: PropertyCardData["listingStatus"] = "active";
  if (
    freshness === "UNAVAILABLE" ||
    status === "UNAVAILABLE" ||
    status === "SOLD" ||
    status === "RENTED" ||
    status === "RESERVED" ||
    status === "WITHDRAWN"
  ) {
    listingStatus = "unavailable";
  } else if (freshness === "STALE") {
    listingStatus = "stale";
  }

  return {
    id: dto.id,
    slug: dto.slug,
    href: `/nemovitosti/${dto.slug}`,
    title: dto.title,
    location: locationLabel(dto),
    disposition: dto.layout ?? undefined,
    areaSqm: dto.usableArea ?? undefined,
    areaDisplay: dto.usableAreaDisplay ?? undefined,
    priceCzk: dto.askingPrice ?? undefined,
    pricePerSqmCzk: dto.pricePerSqm ?? undefined,
    grossYieldPct: dto.grossYieldPct ?? undefined,
    cashFlowMonthlyCzk: dto.cashFlowMonthlyCzk ?? undefined,
    majetioScore: dto.majetioScore,
    imageUrl: dto.media.find((m) => m.isPrimary && m.url)?.url ?? dto.media.find((m) => m.url)?.url ?? undefined,
    dataQuality: (dto.dataQuality as DataQuality | null) ?? undefined,
    risk: dto.risk ?? undefined,
    tags: dto.tags,
    isDemo: dto.isDemo,
    listingStatus,
    shortDescription: dto.shortDescription ?? undefined,
    transactionLabel:
      dto.transactionType === "RENT" ? "Pronájem" : dto.transactionType === "SALE" ? "Prodej" : undefined,
    propertyTypeLabel: propertyTypeLabel(dto.propertyType),
    conditionLabel: dto.condition ? conditionLabel(dto.condition) : undefined,
    acceptsPriceOffers: dto.acceptsPriceOffers === true,
    acceptsCoPurchase:
      dto.acceptsCoPurchaseSeekPartner === true || dto.acceptsCoPurchaseSellerRetains === true,
  };
}
