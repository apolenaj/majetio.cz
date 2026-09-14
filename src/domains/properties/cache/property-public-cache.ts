/**
 * Public property cache invalidation after price/data changes (Prompt 20.6).
 * Private zones stay no-store via middleware — this only busts public discovery/detail.
 */

import { revalidatePath } from "next/cache";

import { clearComparisonPublicCache } from "@/domains/comparisons/decision/public-module-cache";

/**
 * After admin/source updates that change asking price or public listing fields.
 * Clears in-process comparison public metrics cache and revalidates public paths.
 */
export function invalidatePublicPropertyCaches(input: {
  propertyId?: string | null;
  slug?: string | null;
}): void {
  clearComparisonPublicCache();

  revalidatePath("/nemovitosti");
  if (input.slug) {
    revalidatePath(`/nemovitosti/${input.slug}`);
  }
  if (input.propertyId) {
    revalidatePath(`/porovnani`);
  }
}
