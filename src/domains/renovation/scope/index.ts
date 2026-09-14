export {
  RENOVATION_CATEGORIES,
  RENOVATION_UNITS,
  QUALITY_LEVELS,
  RENOVATION_STANDARDS,
  SCOPE_ORIGINS,
  RENOVATION_ITEM_SOURCES,
  type RenovationCategory,
  type RenovationUnit,
  type QualityLevel,
  type RenovationStandard,
  type ScopeOrigin,
  type RenovationItemSource,
  type RenovationItem,
  type RenovationScopeSnapshot,
  type RenovationScope,
  type ScopePropertyInput,
  type ScopeResolveInput,
  type ScopeUserOverrideInput,
  type ScopeService,
} from "./types";

export {
  SCOPE_MODEL_VERSION,
  STANDARD_BASELINE_CATEGORIES,
  CATEGORY_SCOPE_LABELS,
  inferStandardFromSeverity,
  resolveCategoriesForScope,
  standardLabel,
} from "./standards";

export { inferScopeFromCondition } from "./infer";
export {
  applyUserScopeOverrides,
  restoreAutomaticScope,
} from "./overrides";
export { createScopeService } from "./service";
