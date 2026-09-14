/**
 * Location public URL resolution — nested paths + canonical aliases.
 * Example canonical: /lokality/praha/vinohrady
 */

import {
  LOCATION_DEMO_PROFILES,
  type LocationDemoSlug,
} from "@/domains/locations/content/demo-profiles";
import type { LocationPageProfile } from "@/domains/locations/types/location-page";

export type ResolvedLocationPath = {
  profile: LocationPageProfile;
  /** Path the user requested (joined). */
  requestedPath: string;
  /** Canonical path — use for redirects + SEO. */
  canonicalPath: string;
  /** True when request should 308 to canonical. */
  needsCanonicalRedirect: boolean;
};

/** Build href for a location slug (demo registry or flat fallback). */
export function locationHref(slug: string): string {
  const profile = LOCATION_DEMO_PROFILES[slug];
  if (profile) return profile.location.canonicalPath;
  return `/lokality/${slug}`;
}

export function pathSegmentsToCanonical(segments: string[]): string {
  return `/lokality/${segments.map((s) => s.trim().toLowerCase()).filter(Boolean).join("/")}`;
}

/**
 * Resolve /lokality/...path segments to a profile.
 * Accepts nested path (praha/vinohrady) or flat alias (praha-vinohrady).
 */
export function resolveLocationPathSegments(
  segments: string[],
): ResolvedLocationPath | null {
  const cleaned = segments
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((s) => s !== "porovnani" && s !== "prilezitosti");

  if (cleaned.length === 0) return null;

  const requestedPath = pathSegmentsToCanonical(cleaned);

  // Exact pathSegments match
  for (const profile of Object.values(LOCATION_DEMO_PROFILES)) {
    const segs = profile.location.pathSegments;
    if (
      segs.length === cleaned.length &&
      segs.every((s, i) => s === cleaned[i])
    ) {
      return {
        profile,
        requestedPath,
        canonicalPath: profile.location.canonicalPath,
        needsCanonicalRedirect: requestedPath !== profile.location.canonicalPath,
      };
    }
  }

  // Flat slug alias: /lokality/praha-vinohrady → /lokality/praha/vinohrady
  const flat = cleaned.join("-");
  const bySlug = LOCATION_DEMO_PROFILES[flat as LocationDemoSlug];
  if (bySlug) {
    return {
      profile: bySlug,
      requestedPath,
      canonicalPath: bySlug.location.canonicalPath,
      needsCanonicalRedirect: requestedPath !== bySlug.location.canonicalPath,
    };
  }

  // Leaf slug only: /lokality/vinohrady when unique
  if (cleaned.length === 1) {
    const leaf = cleaned[0]!;
    const matches = Object.values(LOCATION_DEMO_PROFILES).filter(
      (p) => p.location.pathSegments.at(-1) === leaf || p.location.slug === leaf,
    );
    if (matches.length === 1) {
      const profile = matches[0]!;
      return {
        profile,
        requestedPath,
        canonicalPath: profile.location.canonicalPath,
        needsCanonicalRedirect: requestedPath !== profile.location.canonicalPath,
      };
    }
  }

  return null;
}

export function listIndexableCanonicalPaths(): string[] {
  return Object.values(LOCATION_DEMO_PROFILES)
    .filter((p) => isLocationPageIndexable(p))
    .map((p) => p.location.canonicalPath);
}

/**
 * Thin-page guard — index only when enough aggregate metrics exist.
 * Synthetic demo profiles are never indexed as production market pages.
 */
export function isLocationPageIndexable(profile: LocationPageProfile): boolean {
  if (profile.isDemo) return false;

  const withSamples = profile.summary.filter(
    (m) => m.value != null && (m.sampleCount ?? 0) >= 20,
  );
  if (withSamples.length < 3) return false;

  const avgConfidence =
    withSamples.reduce((s, m) => s + (m.confidence ?? 0), 0) / withSamples.length;
  if (avgConfidence < 0.5) return false;

  return true;
}

export function buildLocationBreadcrumbs(profile: LocationPageProfile): {
  href?: string;
  label: string;
}[] {
  const crumbs: { href?: string; label: string }[] = [
    { href: "/", label: "Domů" },
    { href: "/lokality", label: "Lokality" },
  ];

  const segs = profile.location.pathSegments;
  for (let i = 0; i < segs.length; i++) {
    const partial = segs.slice(0, i + 1);
    const path = pathSegmentsToCanonical(partial);
    const isLast = i === segs.length - 1;
    if (isLast) {
      crumbs.push({ label: profile.location.publicLabel });
    } else {
      // Parent node — resolve label if we have a profile, else capitalize segment
      const parent = resolveLocationPathSegments(partial);
      crumbs.push({
        href: path,
        label: parent?.profile.location.publicLabel ?? capitalize(partial[i]!),
      });
    }
  }
  return crumbs;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
