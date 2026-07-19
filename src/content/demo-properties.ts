import type { PropertyCardData } from "@/components/property/property-card";
import { mapPublicDtoToPropertyCard } from "@/domains/properties/service/card-mapper";
import {
  getDemoPublicProperty,
  listDemoPublicProperties,
} from "@/content/demo-canonical-properties";

/** Clearly labelled demo listings for IA / UI — backed by Public DTO. */
export const DEMO_PROPERTIES: PropertyCardData[] = listDemoPublicProperties().map(
  mapPublicDtoToPropertyCard,
);

export function getDemoProperty(slug: string): PropertyCardData | undefined {
  const dto = getDemoPublicProperty(slug);
  return dto ? mapPublicDtoToPropertyCard(dto) : undefined;
}
