/**
 * Pre-publish validation for Property Operations.
 */

import {
  detectDataQualityIssues,
  type QualityPropertySnapshot,
} from "@/domains/properties/service/data-quality";

export type PublishValidationIssue = {
  code: string;
  severity: "CRITICAL" | "WARNING";
  message: string;
  field?: string;
};

export type PublishValidationInput = {
  title?: string | null;
  propertyType?: string | null;
  askingPrice?: number | null;
  priceCzk?: number | null;
  currency?: string | null;
  usableArea?: number | null;
  floorArea?: number | null;
  areaSqm?: number | null;
  pricePerSqm?: number | null;
  publicCity?: string | null;
  marketCode?: string | null;
  openCriticalDqCount?: number;
};

export function validatePropertyForPublish(
  input: PublishValidationInput,
): { ok: boolean; issues: PublishValidationIssue[] } {
  const issues: PublishValidationIssue[] = [];

  if (!input.title?.trim()) {
    issues.push({
      code: "REQUIRED_TITLE",
      severity: "CRITICAL",
      message: "Title is required before publish.",
      field: "title",
    });
  }
  if (!input.propertyType) {
    issues.push({
      code: "REQUIRED_TYPE",
      severity: "CRITICAL",
      message: "Property type is required.",
      field: "propertyType",
    });
  }
  if (!input.marketCode?.trim()) {
    issues.push({
      code: "REQUIRED_MARKET",
      severity: "CRITICAL",
      message: "marketCode is required.",
      field: "marketCode",
    });
  }

  const price = input.askingPrice ?? input.priceCzk ?? null;
  if (price == null || !(price > 0)) {
    issues.push({
      code: "INVALID_PRICE",
      severity: "CRITICAL",
      message: "Valid positive asking price is required.",
      field: "askingPrice",
    });
  }

  if (!input.publicCity?.trim()) {
    issues.push({
      code: "REQUIRED_CITY",
      severity: "CRITICAL",
      message: "Public city / locality is required.",
      field: "publicCity",
    });
  }

  const snap: QualityPropertySnapshot = {
    askingPrice: input.askingPrice,
    priceCzk: input.priceCzk,
    usableArea: input.usableArea,
    floorArea: input.floorArea,
    areaSqm: input.areaSqm,
    pricePerSqm: input.pricePerSqm,
  };
  for (const dq of detectDataQualityIssues(snap)) {
    if (dq.severity === "CRITICAL") {
      issues.push({
        code: dq.ruleCode,
        severity: "CRITICAL",
        message: dq.message,
        field: dq.field,
      });
    }
  }

  if ((input.openCriticalDqCount ?? 0) > 0) {
    issues.push({
      code: "OPEN_CRITICAL_DQ",
      severity: "CRITICAL",
      message: `Open critical data-quality issues: ${input.openCriticalDqCount}.`,
    });
  }

  return {
    ok: !issues.some((i) => i.severity === "CRITICAL"),
    issues,
  };
}
