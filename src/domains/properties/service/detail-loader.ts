/**
 * Load property detail for /nemovitosti/[slug] (Prompt 9 Part 1).
 * Always goes through canViewProperty + PublicPropertyDto — never raw records.
 */

import { DEMO_PROPERTY_RECORDS } from "@/content/demo-canonical-properties";
import { auth } from "@/lib/auth";
import { isStaff, type Role } from "@/lib/auth/roles";
import {
  createPropertyService,
  type PropertyRepository,
} from "@/domains/properties/service/property-service";
import type { PublicPropertyDto } from "@/domains/properties/service/dto";
import type { PropertyViewer } from "@/domains/properties/service/authorization";
import { isSeoLandingSlug } from "@/domains/properties/search/seo-landings";

export {
  buildPropertyDetailBreadcrumbs,
  propertyListingStatusTone,
} from "./detail-presentation";

const demoRepository: PropertyRepository = {
  async findBySlug(slug) {
    return DEMO_PROPERTY_RECORDS.find((p) => p.slug === slug) ?? null;
  },
  async findById(id) {
    return DEMO_PROPERTY_RECORDS.find((p) => p.id === id) ?? null;
  },
  async search() {
    return { items: [], hasMore: false };
  },
};

const propertyService = createPropertyService({ repository: demoRepository });

export async function resolvePropertyViewer(): Promise<PropertyViewer> {
  const session = await auth();
  if (!session?.user?.id) return { role: "PUBLIC" };
  const role = (session.user.role as Role | undefined) ?? "USER";
  return {
    userId: session.user.id,
    role: isStaff(role) ? "STAFF" : role === "USER" ? "USER" : String(role),
  };
}

/**
 * Secure detail load. Returns null → caller should notFound() (covers missing + IDOR).
 * Reserved SEO city slugs are not property details.
 */
export async function loadPropertyDetailBySlug(
  slug: string,
): Promise<PublicPropertyDto | null> {
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
  return propertyService.getPublicBySlug(slug, { viewer });
}
