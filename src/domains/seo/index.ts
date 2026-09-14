export {
  SEO_HOSTS,
  buildCountryLandingPath,
  buildLocationHierarchyPath,
  resolveSeoHost,
  buildSeoDocumentMeta,
  toNextAlternates,
  seoLocaleRoutesForMarket,
  assertLocaleDefinition,
  type MajetioHostKind,
  type SeoHostConfig,
  type SeoDocumentMeta,
  type HreflangAlternate,
} from "@/domains/seo/architecture";

export {
  PROGRAMMATIC_PAGE_KINDS,
  decideProgrammaticIndexability,
  isContentStale,
  computeReviewRequiredAt,
  type ProgrammaticPageKind,
  type ProgrammaticSeoPage,
  type ProgrammaticIndexDecision,
} from "@/domains/seo/programmatic-rules";

export {
  buildPageMetadata,
  canonicalizePath,
  type BuildPageMetadataInput,
} from "@/domains/seo/metadata";

export { getSiteOrigin } from "@/domains/seo/site-origin";

export {
  SITEMAP_SEGMENTS,
  buildStaticSitemap,
  buildPropertiesSitemap,
  buildLocationsSitemap,
  buildGuidesSitemap,
  type SitemapSegmentId,
} from "@/domains/seo/sitemap-builders";
