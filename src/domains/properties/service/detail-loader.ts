/**
 * Load property detail for /nemovitosti/[slug] (Prompt 9 Part 1).
 * Always goes through canViewProperty + PublicPropertyDto — never raw records.
 * React cache() dedupes metadata + page loads in one request (no N+1 / double fetch).
 *
 * L-06: production fail-closed — demo repository only when ALLOW_DEMO_PROPERTY_CONTENT.
 */

import { cache } from "react";

import { DEMO_PROPERTY_RECORDS } from "@/content/demo-canonical-properties";
import { auth } from "@/lib/auth";
import { isDemoPropertyContentAllowed } from "@/lib/demo-content-gate";
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

const emptyRepository: PropertyRepository = {
  async findBySlug() {
    return null;
  },
  async findById() {
    return null;
  },
  async search() {
    return { items: [], hasMore: false };
  },
};

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

function getPropertyService() {
  return createPropertyService({
    repository: isDemoPropertyContentAllowed() ? demoRepository : emptyRepository,
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
 * Reserved SEO city slugs are not property details.
 * Cached per-request so generateMetadata + page share one load.
 *
 * Future Prisma: include media + priceHistory + sources in a single query
 * (never N+1 per history point / source row).
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

    if (!isDemoPropertyContentAllowed()) {
      // Production without Prisma public repo yet — fail closed (no demo-as-real).
      return null;
    }

    const viewer = await resolvePropertyViewer();
    return getPropertyService().getPublicBySlug(slug, { viewer });
  },
);
