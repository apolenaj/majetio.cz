/**
 * Item classification — construction vs furnishing buckets.
 */

import type { RenovationCategory } from "../scope/types";

const FURNISHING_CATEGORIES: ReadonlySet<RenovationCategory> = new Set([
  "built_in_furniture",
]);

export function costBucketForCategory(
  category: RenovationCategory,
): "construction" | "furnishing" {
  return FURNISHING_CATEGORIES.has(category) ? "furnishing" : "construction";
}

export function isFurnishingCategory(category: RenovationCategory): boolean {
  return costBucketForCategory(category) === "furnishing";
}
