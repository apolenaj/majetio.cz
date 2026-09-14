/**
 * Majetio ↔ ClearPropertyPath.com integration boundary (Rules 231–232).
 *
 * Majetio = analytics / discovery / decision workspace.
 * ClearPropertyPath (CPP) = future purchase-process product.
 * Integration ONLY via API / deep links — never shared DB foreign keys.
 */

export const MAJETIO_PRODUCT = {
  name: "Majetio",
  hosts: ["majetio.cz", "majetio.com"] as const,
  responsibilities: [
    "Property discovery and search",
    "Investment analytics and scenarios",
    "Decision workspace / comparisons",
    "Market risk facts and due diligence checklists (orientational)",
    "Mortgage lead handoff to named CZ partner (HypotekaJasne) with explicit consent",
  ] as const,
} as const;

export const CLEAR_PROPERTY_PATH_PRODUCT = {
  name: "ClearPropertyPath",
  hosts: ["clearpropertypath.com"] as const,
  responsibilities: [
    "Guided purchase process / transaction workflow",
    "Conveyancing orchestration (future)",
    "Document collection for closing (future)",
  ] as const,
} as const;

export type IntegrationChannel = "HTTPS_API" | "DEEP_LINK" | "WEBHOOK";

export type CrossProductIntegrationPolicy = {
  /** Shared Prisma / DB relations between Majetio and CPP are forbidden. */
  sharedDatabase: false;
  /** Shared user table FK across products is forbidden. */
  sharedUserForeignKeys: false;
  allowedChannels: readonly IntegrationChannel[];
  /**
   * Opaque correlation ids only — never Majetio Property.id as CPP FK.
   * CPP receives a signed token / deep-link payload.
   */
  identityHandoff: "SIGNED_TOKEN_OR_DEEP_LINK";
  notesEn: string;
};

export const MAJETIO_CPP_INTEGRATION_POLICY: CrossProductIntegrationPolicy = {
  sharedDatabase: false,
  sharedUserForeignKeys: false,
  allowedChannels: ["HTTPS_API", "DEEP_LINK", "WEBHOOK"],
  identityHandoff: "SIGNED_TOKEN_OR_DEEP_LINK",
  notesEn:
    "Majetio and ClearPropertyPath remain separate systems. Sync via versioned APIs and deep links only — no shared DB schema or cross-product Prisma relations.",
};

export type ClearPropertyPathDeepLinkInput = {
  /** Opaque Majetio-side correlation — NOT a DB FK consumed by CPP. */
  correlationId: string;
  marketCode: string;
  /** Public listing slug or external ref — never internal cuid required by CPP DB. */
  listingPublicRef?: string;
  locale?: string;
  /** Destination path on CPP host. */
  path?: string;
};

/**
 * Build a deep-link URL into ClearPropertyPath.
 * Does not embed Majetio database ids as foreign keys.
 */
export function buildClearPropertyPathDeepLink(
  input: ClearPropertyPathDeepLinkInput,
  options?: { baseUrl?: string },
): string {
  const base =
    options?.baseUrl?.replace(/\/$/, "") ??
    "https://www.clearpropertypath.com";
  const path = input.path?.startsWith("/")
    ? input.path
    : `/${input.path ?? "continue"}`;
  const params = new URLSearchParams();
  params.set("corr", input.correlationId);
  params.set("market", input.marketCode.toUpperCase());
  if (input.listingPublicRef) params.set("listing", input.listingPublicRef);
  if (input.locale) params.set("lang", input.locale);
  params.set("src", "majetio");
  return `${base}${path}?${params.toString()}`;
}

export function assertNoSharedDbWithClearPropertyPath(input: {
  /** True if a Prisma relation / FK to a CPP table is proposed. */
  proposesSharedDbRelation: boolean;
}): void {
  if (input.proposesSharedDbRelation) {
    throw new Error(
      "ClearPropertyPath integration forbids shared database relations — use API or deep links only.",
    );
  }
}
