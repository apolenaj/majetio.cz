/**
 * detail-loader — Prisma first; demo fallback only when ALLOW_DEMO_PROPERTY_CONTENT.
 */

import { cache } from "react";

import { auth } from "@/lib/auth";
import { isStaff, type Role } from "@/lib/auth/roles";
import {
  createPropertyService,
} from "@/domains/properties/service/property-service";
import type { PublicPropertyDto } from "@/domains/properties/service/dto";
import type { PropertyViewer } from "@/domains/properties/service/authorization";
import { isSeoLandingSlug } from "@/domains/properties/search/seo-landings";
import { createPrismaPropertyRepository } from "@/domains/properties/service/prisma-property-repository";

export {
  buildPropertyDetailBreadcrumbs,
  propertyListingStatusTone,
} from "./detail-presentation";

function getPropertyService() {
  return createPropertyService({
    repository: createPrismaPropertyRepository(),
  });
}

export const resolvePropertyViewer = cache(async (): Promise<PropertyViewer> => {
  const session = await auth();
  if (!session?.user?.id) return { role: "PUBLIC" };
  const role = (session.user.role as Role | undefined) ?? "USER";
  return {
    userId: session.user.id,
    role: isStaff(role) ? "STAFF" : role === "USER" ? "USER" : String(role),
  };
});

/**
 * Secure detail load. Returns null → caller should notFound() (covers missing + IDOR).
 */
export const loadPropertyDetailBySlug = cache(
  async (slug: string): Promise<PublicPropertyDto | null> => {
    if (isSeoLandingSlug(slug)) return null;
    if (
      slug === "doporucene" ||
      slug === "investicni-prilezitosti" ||
      slug === "praha" ||
      slug === "brno" ||
      slug === "ostrava"
    ) {
      return null;
    }

    const viewer = await resolvePropertyViewer();
    return getPropertyService().getPublicBySlug(slug, { viewer });
  },
);
