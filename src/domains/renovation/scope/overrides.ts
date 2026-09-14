/**
 * User-defined scope overrides — preserves automatic snapshot (Concept B).
 */

import type {
  RenovationItem,
  RenovationScope,
  RenovationScopeSnapshot,
  ScopeUserOverrideInput,
} from "./types";

function cloneItems(items: RenovationItem[]): RenovationItem[] {
  return items.map((item) => ({ ...item }));
}

function snapshotFromAutomatic(scope: RenovationScope): RenovationScopeSnapshot {
  return {
    version: scope.version,
    standard: scope.standard,
    items: cloneItems(scope.items),
    confidence: scope.confidence,
    capturedAt: new Date(),
  };
}

function mergeItems(
  base: RenovationItem[],
  overrides: RenovationItem[],
): RenovationItem[] {
  const byKey = new Map<string, RenovationItem>();

  for (const item of base) {
    byKey.set(item.id, { ...item });
  }

  for (const override of overrides) {
    const existing = byKey.get(override.id);
    if (existing) {
      byKey.set(override.id, {
        ...existing,
        ...override,
        source: "user_defined",
      });
    } else {
      byKey.set(override.id, {
        ...override,
        source: "user_defined",
      });
    }
  }

  return [...byKey.values()];
}

/**
 * Apply manual scope edits on top of automatic inference.
 * Creates a user-defined scenario; the original automatic scope is frozen
 * in `automaticSnapshot` and never overwritten.
 */
export function applyUserScopeOverrides(
  input: ScopeUserOverrideInput,
): RenovationScope {
  const { automaticScope, items: userItems, standard, notes } = input;

  const automaticSnapshot =
    automaticScope.automaticSnapshot ??
    snapshotFromAutomatic(automaticScope);

  const mergedItems = mergeItems(automaticSnapshot.items, userItems);
  const resolvedStandard = standard ?? automaticSnapshot.standard;

  return {
    version: automaticScope.version,
    standard: resolvedStandard,
    items: mergedItems,
    origin: "user_defined",
    automaticSnapshot,
    inferredFromCondition: automaticScope.inferredFromCondition,
    confidence: automaticScope.confidence,
    notes:
      notes ??
      "Uživatelsky upravený rozsah — původní automatická inference je zachována ve snapshotu.",
  };
}

/**
 * Restore scope to the frozen automatic snapshot (discard user edits).
 */
export function restoreAutomaticScope(
  userDefinedScope: RenovationScope,
): RenovationScope | null {
  const snapshot = userDefinedScope.automaticSnapshot;
  if (!snapshot) {
    return null;
  }

  return {
    version: snapshot.version,
    standard: snapshot.standard,
    items: cloneItems(snapshot.items),
    origin: "automatic",
    automaticSnapshot: null,
    inferredFromCondition: true,
    confidence: snapshot.confidence,
    notes: "Obnoveno z automatické inference.",
  };
}
