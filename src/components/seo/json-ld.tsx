/**
 * Safe JSON-LD injection — never invent AggregateRating or unsupported fields.
 */

import { sanitizePlainText } from "@/lib/security/sanitize";

const FORBIDDEN_JSON_LD_KEYS = new Set([
  "aggregaterating",
  "reviewrating",
  "ratingvalue",
  "ratingcount",
  "reviewcount",
]);

function assertNoFakeRatings(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoFakeRatings(v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_JSON_LD_KEYS.has(k.toLowerCase())) {
        throw new Error(
          `JSON-LD forbidden key "${k}" at ${path} — no fake AggregateRating.`,
        );
      }
      assertNoFakeRatings(v, `${path}.${k}`);
    }
  }
}

export type JsonLdProps = {
  data: object | object[];
  /** Optional id for debugging / multiple graphs. */
  id?: string;
};

/**
 * Renders a single application/ld+json script. Validates no AggregateRating.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  assertNoFakeRatings(data);
  const payload = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : data;

  return (
    <script
      id={id}
      type="application/ld+json"
      // Controlled schema objects only — still stringify (no user HTML).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function buildOrganizationJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Majetio",
    url: origin,
    logo: `${origin}/brand/icons/apple-touch-icon.png`,
    description:
      "Analytická realitní platforma — modelované odhady a investiční scénáře, ne znalecký posudek.",
  };
}

export function buildBreadcrumbListJsonLd(
  origin: string,
  items: Array<{ name: string; path?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: sanitizePlainText(item.name, 120),
      ...(item.path
        ? { item: `${origin}${item.path.startsWith("/") ? item.path : `/${item.path}`}` }
        : {}),
    })),
  };
}

export function buildFaqPageJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: sanitizePlainText(f.question, 300),
      acceptedAnswer: {
        "@type": "Answer",
        text: sanitizePlainText(f.answer, 2000),
      },
    })),
  };
}

export function buildArticleJsonLd(input: {
  origin: string;
  path: string;
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: sanitizePlainText(input.headline, 200),
    description: input.description
      ? sanitizePlainText(input.description, 300)
      : undefined,
    url: `${input.origin}${input.path}`,
    mainEntityOfPage: `${input.origin}${input.path}`,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : { "@type": "Organization", name: "Majetio" },
    publisher: {
      "@type": "Organization",
      name: "Majetio",
      url: input.origin,
    },
  };
}
