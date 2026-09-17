import { computeCaseStudy } from "./compute";
import { houseRenovationStudy } from "./house-renovation";
import { rentalApartmentStudy } from "./rental-apartment";
import { smallBuildingStudy } from "./small-building";
import type { CaseStudyComputed, CaseStudySlug } from "./types";

export * from "./types";
export {
  computeCaseStudy,
  purchasePriceAtTargetYieldOnTac,
  purchasePriceAtTargetGrossYield,
  breakEvenPurchasePriceHoldingEquity,
} from "./compute";

export const CASE_STUDY_DEFINITIONS = [
  rentalApartmentStudy,
  houseRenovationStudy,
  smallBuildingStudy,
] as const;

export function listCaseStudies(): CaseStudyComputed[] {
  return CASE_STUDY_DEFINITIONS.map((definition) =>
    computeCaseStudy(definition),
  );
}

export function getCaseStudy(slug: string): CaseStudyComputed | null {
  const definition = CASE_STUDY_DEFINITIONS.find((item) => item.slug === slug);
  if (!definition) return null;
  return computeCaseStudy(definition);
}

export function isCaseStudySlug(value: string): value is CaseStudySlug {
  return CASE_STUDY_DEFINITIONS.some((item) => item.slug === value);
}

/** Featured study for homepage hero snapshot. */
export function getFeaturedCaseStudy(): CaseStudyComputed {
  return computeCaseStudy(rentalApartmentStudy);
}
