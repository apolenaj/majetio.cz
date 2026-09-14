/**
 * Reverse matching: property → saved searches (BOD 148, 149).
 * Iterate new/changed properties and test against active searches —
 * never cartesian product of all properties × all searches.
 */

import type { SavedSearchAlertFrequency } from "@prisma/client";

import { parseSavedSearchFilters } from "@/domains/saved-searches/service/filters-version";
import {
  applyUrlFiltersToListings,
  type SearchableListing,
} from "@/domains/properties/search/apply-filters";
import { prisma } from "@/lib/db";
import { emitAlertTelemetry } from "@/domains/notifications/observability/telemetry";
import {
  isNewMatchAfterLastCheck,
  upsertSavedSearchMatch,
} from "./match-semantics";
import { routeSavedSearchMatchAlert } from "@/domains/notifications/service/frequency-router";

const SEARCH_BATCH = 50;

export type PropertyMatchCandidate = {
  id: string;
  slug: string;
  title: string;
  askingPrice: number | null;
  priceCzk: number | null;
  propertyType: string;
  layout: string | null;
  usableArea: number | null;
  landArea: number | null;
  condition: string | null;
  ownershipType: string | null;
  publicCity: string | null;
  publicDistrict: string | null;
  publicRegion: string | null;
  publicLabel: string | null;
  status: string;
  visibility: string;
  publishedAt: Date | null;
};

function toSearchableListing(p: PropertyMatchCandidate): SearchableListing {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    askingPrice: p.askingPrice ?? p.priceCzk,
    currency: "CZK",
    pricePerSqm: null,
    usableArea: p.usableArea,
    usableAreaDisplay: null,
    layout: p.layout,
    propertyType: p.propertyType,
    transactionType: "SALE",
    location: {
      label: p.publicLabel ?? p.publicCity ?? "",
      precision: "CITY",
      city: p.publicCity,
      district: p.publicDistrict,
      region: p.publicRegion,
      latitude: null,
      longitude: null,
      addressLine: null,
    },
    media: [],
    publishedAt: p.publishedAt?.toISOString() ?? null,
    isDemo: false,
    dataQuality: null,
    tags: [],
    grossYieldPct: null,
    cashFlowMonthlyCzk: null,
    majetioScore: null,
    risk: null,
    landArea: p.landArea,
    condition: p.condition,
    ownershipType: p.ownershipType,
    status: p.status,
    visibility: p.visibility,
  };
}

export function propertyMatchesSavedSearch(
  property: PropertyMatchCandidate,
  filtersJson: unknown,
): boolean {
  if (property.status !== "ACTIVE" || property.visibility !== "PUBLIC") {
    return false;
  }
  const parsed = parseSavedSearchFilters(filtersJson);
  const listing = toSearchableListing(property);
  const hits = applyUrlFiltersToListings([listing], parsed.state);
  return hits.length === 1;
}

/**
 * For one new/changed property, find matching saved searches in batches.
 */
export async function matchPropertyToSavedSearches(input: {
  property: PropertyMatchCandidate;
  /** When true, enqueue notifications per frequency. */
  notify?: boolean;
  eventKind?: "NEW_PROPERTY" | "PRICE_DROP" | "RELISTED";
}): Promise<{
  matchedSearches: number;
  newMatches: number;
  notified: number;
}> {
  const started = Date.now();
  let cursor: string | undefined;
  let matchedSearches = 0;
  let newMatches = 0;
  let notified = 0;

  for (;;) {
    const batch = await prisma.savedSearch.findMany({
      where: {
        alertFrequency: { not: "OFF" },
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: "asc" },
      take: SEARCH_BATCH,
      select: {
        id: true,
        userId: true,
        name: true,
        filters: true,
        alertFrequency: true,
        lastCheckedAt: true,
        lastAlertedAt: true,
      },
    });
    if (batch.length === 0) break;

    for (const search of batch) {
      if (!propertyMatchesSavedSearch(input.property, search.filters)) {
        continue;
      }
      matchedSearches += 1;

      const upsert = await upsertSavedSearchMatch({
        savedSearchId: search.id,
        propertyId: input.property.id,
        lastCheckedAt: search.lastCheckedAt,
      });

      if (upsert.isNew) {
        newMatches += 1;
        if (input.notify !== false) {
          const routed = await routeSavedSearchMatchAlert({
            userId: search.userId,
            savedSearchId: search.id,
            searchName: search.name,
            alertFrequency: search.alertFrequency,
            propertyId: input.property.id,
            propertySlug: input.property.slug,
            propertyTitle: input.property.title,
            propertyCity: input.property.publicCity,
            eventKind: input.eventKind ?? "NEW_PROPERTY",
          });
          if (routed.notified) notified += 1;
        }
      }
    }

    cursor = batch[batch.length - 1]!.id;
    if (batch.length < SEARCH_BATCH) break;
  }

  emitAlertTelemetry({
    type: "alert_job_completed",
    job: "reverse_match_batch",
    status: "SUCCEEDED",
    processed: matchedSearches,
    failed: 0,
    latencyMs: Date.now() - started,
  });

  return { matchedSearches, newMatches, notified };
}

/**
 * Batch: process a list of new/changed property ids (ingestion hook).
 */
export async function batchMatchChangedProperties(input: {
  propertyIds: string[];
  eventKind?: "NEW_PROPERTY" | "PRICE_DROP" | "RELISTED";
  notify?: boolean;
}): Promise<{ properties: number; newMatches: number; notified: number }> {
  const ids = [...new Set(input.propertyIds)].slice(0, 200);
  let newMatches = 0;
  let notified = 0;

  const properties = await prisma.property.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      title: true,
      askingPrice: true,
      priceCzk: true,
      propertyType: true,
      layout: true,
      usableArea: true,
      landArea: true,
      condition: true,
      ownershipType: true,
      publicCity: true,
      publicDistrict: true,
      publicRegion: true,
      publicLabel: true,
      status: true,
      visibility: true,
      publishedAt: true,
    },
  });

  for (const property of properties) {
    const result = await matchPropertyToSavedSearches({
      property,
      notify: input.notify,
      eventKind: input.eventKind,
    });
    newMatches += result.newMatches;
    notified += result.notified;
  }

  return { properties: properties.length, newMatches, notified };
}

export function frequencyAllowsImmediate(
  frequency: SavedSearchAlertFrequency,
): boolean {
  return frequency === "INSTANT";
}

export function frequencyIsDigest(
  frequency: SavedSearchAlertFrequency,
): boolean {
  return frequency === "DAILY" || frequency === "WEEKLY";
}

// Re-export semantic helper for tests
export { isNewMatchAfterLastCheck };
