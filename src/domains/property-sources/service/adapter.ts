/**
 * PropertySourceAdapter contract (Prompt 7 Part 4).
 * Each feed/portal implements parse → validate → normalize → map → extractMedia.
 */

import type {
  AdapterParseResult,
  AdapterValidateResult,
  AdapterValidationIssue,
  NormalizedListing,
  NormalizedMediaItem,
} from "../schemas/normalized-listing";

export type PropertySourceAdapterContext = {
  provider: string;
  sourceType: string;
};

export interface PropertySourceAdapter {
  readonly id: string;
  readonly provider: string;

  /** Parse vendor payload into a structured raw object. */
  parse(payload: unknown, ctx?: PropertySourceAdapterContext): AdapterParseResult;

  /** Structural / required-field checks before normalize. */
  validate(parsed: AdapterParseResult, ctx?: PropertySourceAdapterContext): AdapterValidateResult;

  /**
   * Coerce units (→ m²) and currencies (→ ISO), trim strings, drop junk.
   * Returns a partial listing before final map.
   */
  normalize(
    parsed: AdapterParseResult,
    ctx?: PropertySourceAdapterContext,
  ): Partial<NormalizedListing>;

  /** Map normalized fields into the full intermediate listing. */
  map(
    normalized: Partial<NormalizedListing>,
    parsed: AdapterParseResult,
    ctx?: PropertySourceAdapterContext,
  ): NormalizedListing;

  /** Extract media URLs / metadata from the raw or normalized payload. */
  extractMedia(
    parsed: AdapterParseResult,
    normalized?: Partial<NormalizedListing>,
  ): NormalizedMediaItem[];
}

export function collectAdapterErrors(
  issues: AdapterValidationIssue[],
): AdapterValidationIssue[] {
  return issues.filter((i) => i.severity === "error");
}

/**
 * Run adapter stages in order; throws on validation errors.
 */
export function runAdapter(
  adapter: PropertySourceAdapter,
  payload: unknown,
  ctx?: PropertySourceAdapterContext,
): NormalizedListing {
  const context = ctx ?? {
    provider: adapter.provider,
    sourceType: "OTHER",
  };
  const parsed = adapter.parse(payload, context);
  const validation = adapter.validate(parsed, context);
  const errors = collectAdapterErrors(validation.issues);
  if (errors.length > 0) {
    throw new Error(
      `Adapter ${adapter.id} validation failed: ${errors.map((e) => e.message).join("; ")}`,
    );
  }
  const normalized = adapter.normalize(parsed, context);
  const media = adapter.extractMedia(parsed, normalized);
  const mapped = adapter.map({ ...normalized, media }, parsed, context);
  return { ...mapped, media: mapped.media.length > 0 ? mapped.media : media };
}
