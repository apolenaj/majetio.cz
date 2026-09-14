/**
 * Comparison UI fixtures — heterogeneous + sparse metrics for demos/tests.
 */

export const COMPARISON_UI_FIXTURE_SLUGS = [
  "demo-byt-2kk-brno", // high yield, renovation null → missing reno bands
  "demo-byt-3kk-vinohrady", // price change + full reno bands
  "demo-dum-rekonstrukce", // house + critical risks
] as const;

export type ComparisonUiFixtureSlug =
  (typeof COMPARISON_UI_FIXTURE_SLUGS)[number];

export function comparisonFixtureSources() {
  return COMPARISON_UI_FIXTURE_SLUGS.map((slug, order) => ({
    propertyId: `fixture-${slug}`,
    slug,
    order,
    matchScore: slug === "demo-byt-2kk-brno" ? 82 : slug === "demo-byt-3kk-vinohrady" ? 64 : 41,
    matchConfidence:
      slug === "demo-byt-2kk-brno"
        ? ("high" as const)
        : slug === "demo-byt-3kk-vinohrady"
          ? ("medium" as const)
          : ("low" as const),
  }));
}
