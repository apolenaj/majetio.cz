/**
 * Deterministic hashing for investment calculation cache keys.
 * hash(propertySnapshot + assumptions + modelVersion + scenarioType)
 */

import { createHash } from "node:crypto";

import {
  FORMULA_REGISTRY_VERSION,
  INVESTMENT_ENGINE_VERSION,
} from "../engine";

/** Stable JSON: sorted object keys, arrays keep order, undefined omitted. */
export function canonicalizeForHash(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const v = obj[key];
    if (v === undefined) continue;
    out[key] = sortKeys(v);
  }
  return out;
}

export type CalculationHashInput = {
  propertySnapshot: unknown;
  assumptionSet: unknown;
  scenarioType: string;
  engineVersion?: string;
  formulaRegistryVersion?: string;
};

/** Drop volatile timestamps so cache keys stay stable across runs. */
export function stableSnapshotForHash(snapshot: unknown): unknown {
  if (snapshot == null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return snapshot;
  }
  const { capturedAt: _capturedAt, calculatedAt: _calculatedAt, ...rest } =
    snapshot as Record<string, unknown>;
  return rest;
}

/**
 * SHA-256 hex digest. Engine / formula version bumps invalidate the cache.
 */
export function hashCalculationInput(input: CalculationHashInput): string {
  const payload = {
    propertySnapshot: stableSnapshotForHash(input.propertySnapshot),
    assumptionSet: input.assumptionSet,
    scenarioType: input.scenarioType,
    engineVersion: input.engineVersion ?? INVESTMENT_ENGINE_VERSION,
    formulaRegistryVersion:
      input.formulaRegistryVersion ?? FORMULA_REGISTRY_VERSION,
  };
  return createHash("sha256")
    .update(canonicalizeForHash(payload), "utf8")
    .digest("hex");
}
