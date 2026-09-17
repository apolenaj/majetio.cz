"use server";

import {
  submitPropertyAuditInquiry,
  type PropertyAuditInquiryResult,
} from "@/domains/leads/service/property-audit-inquiry";

export async function submitPropertyAuditInquiryAction(
  raw: unknown,
): Promise<PropertyAuditInquiryResult> {
  return submitPropertyAuditInquiry(raw);
}
