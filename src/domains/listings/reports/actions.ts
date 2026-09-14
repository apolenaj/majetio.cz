"use server";

/**
 * Server actions for listing / data dispute reports.
 */

import {
  submitListingReport,
  type SubmitListingReportResult,
} from "./submit-listing-report";

export async function reportIncorrectListing(
  input: unknown,
): Promise<SubmitListingReportResult> {
  return submitListingReport(input);
}
