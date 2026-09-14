/**
 * Organization marketCoverage + serviceType helpers (Rules 196, B2B multi-market).
 */

export const ORGANIZATION_SERVICE_TYPES = [
  "AGENCY",
  "BROKER",
  "DEVELOPER",
  "MIXED",
  "OTHER",
] as const;

export type OrganizationServiceType =
  (typeof ORGANIZATION_SERVICE_TYPES)[number];

export function parseOrganizationServiceType(
  raw: string | null | undefined,
): OrganizationServiceType {
  const v = (raw ?? "AGENCY").toUpperCase();
  if ((ORGANIZATION_SERVICE_TYPES as readonly string[]).includes(v)) {
    return v as OrganizationServiceType;
  }
  return "OTHER";
}

/** Map Prisma OrganizationType → serviceType default. */
export function serviceTypeForOrganizationType(
  type: string,
): OrganizationServiceType {
  switch (type) {
    case "REAL_ESTATE_AGENT":
      return "BROKER";
    case "AGENCY":
      return "AGENCY";
    case "DEVELOPER":
      return "DEVELOPER";
    case "PARTNER":
      return "MIXED";
    default:
      return "OTHER";
  }
}

export function normalizeMarketCoverage(
  coverage: string[] | null | undefined,
  primaryMarketCode = "CZ",
): string[] {
  const primary = primaryMarketCode.toUpperCase();
  const set = new Set(
    (coverage ?? [])
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0),
  );
  set.add(primary);
  return [...set];
}

export function organizationCoversMarket(input: {
  marketCoverage: string[] | null | undefined;
  marketCode: string;
  primaryMarketCode?: string;
}): boolean {
  const coverage = normalizeMarketCoverage(
    input.marketCoverage,
    input.primaryMarketCode ?? "CZ",
  );
  if (coverage.includes("*")) return true;
  return coverage.includes(input.marketCode.toUpperCase());
}

export class OrganizationMarketCoverageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationMarketCoverageError";
  }
}

export function assertOrganizationCoversMarket(input: {
  organizationId?: string;
  marketCoverage: string[] | null | undefined;
  marketCode: string;
  primaryMarketCode?: string;
}): void {
  if (
    !organizationCoversMarket({
      marketCoverage: input.marketCoverage,
      marketCode: input.marketCode,
      primaryMarketCode: input.primaryMarketCode,
    })
  ) {
    throw new OrganizationMarketCoverageError(
      `Organization does not cover market ${input.marketCode.toUpperCase()}.`,
    );
  }
}
