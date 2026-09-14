/**
 * Listing report issue type catalog (client-safe).
 */

export const LISTING_REPORT_ISSUE_TYPES = [
  "INCORRECT_DATA",
  "DUPLICATE",
  "UNAVAILABLE",
  "MISLEADING",
  "PROHIBITED_CONTENT",
] as const;

export type ListingReportIssueTypeCode =
  (typeof LISTING_REPORT_ISSUE_TYPES)[number];

export const LISTING_REPORT_ISSUE_LABELS_CS: Record<
  ListingReportIssueTypeCode,
  string
> = {
  INCORRECT_DATA: "Nesprávná data",
  DUPLICATE: "Duplicitní inzerát",
  UNAVAILABLE: "Nedostupné / prodáno",
  MISLEADING: "Zavádějící informace",
  PROHIBITED_CONTENT: "Zakázaný obsah",
};
