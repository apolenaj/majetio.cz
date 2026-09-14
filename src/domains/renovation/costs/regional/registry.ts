/**
 * Location cost profile registry.
 */

import {
  DEMO_LOCATION_COST_V2026_07,
  DEMO_LOCATION_COST_VERSION,
} from "./demo-location-cost.v2026.07";
import type { LocationCostProfile } from "./types";

const PROFILES: Record<string, LocationCostProfile> = {
  [DEMO_LOCATION_COST_VERSION]: DEMO_LOCATION_COST_V2026_07,
};

export function getLocationCostProfile(version?: string): LocationCostProfile {
  const key = version ?? DEMO_LOCATION_COST_VERSION;
  const profile = PROFILES[key];
  if (!profile) {
    throw new Error(`Unknown location cost profile version: ${key}`);
  }
  return profile;
}
