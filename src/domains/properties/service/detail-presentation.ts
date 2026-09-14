/**
 * Pure helpers for property detail presentation (no auth imports).
 */

import type { PublicPropertyDto } from "./dto";

/** Build breadcrumbs Domů > Nemovitosti > [Město] > [Typ + dispozice] */
export function buildPropertyDetailBreadcrumbs(property: PublicPropertyDto): {
  href?: string;
  label: string;
}[] {
  const crumbs: { href?: string; label: string }[] = [
    { href: "/", label: "Domů" },
    { href: "/nemovitosti", label: "Nemovitosti" },
  ];

  const city = property.location.city;
  if (city) {
    const citySlug = city
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const landingHref =
      citySlug === "praha" || citySlug === "brno" || citySlug === "ostrava"
        ? `/nemovitosti/${citySlug}`
        : `/nemovitosti?lokalita=${encodeURIComponent(city)}`;
    crumbs.push({ href: landingHref, label: city });
  }

  const identityBits = [
    property.propertyType === "APARTMENT"
      ? "Byt"
      : property.propertyType === "HOUSE"
        ? "Dům"
        : property.propertyType === "LAND"
          ? "Pozemek"
          : null,
    property.layout,
  ].filter(Boolean);
  crumbs.push({
    label: identityBits.join(" ") || property.title,
  });

  return crumbs;
}

export function propertyListingStatusTone(
  status: string,
): "unavailable" | "archived" | "active" | "reserved" {
  const s = status.toUpperCase();
  if (s === "RESERVED") return "reserved";
  if (
    s === "UNAVAILABLE" ||
    s === "SOLD" ||
    s === "RENTED" ||
    s === "WITHDRAWN"
  ) {
    return "unavailable";
  }
  if (
    s === "ARCHIVED" ||
    s === "DRAFT" ||
    s === "REJECTED" ||
    s === "SUSPENDED" ||
    s === "PENDING_REVIEW"
  ) {
    return "archived";
  }
  return "active";
}
