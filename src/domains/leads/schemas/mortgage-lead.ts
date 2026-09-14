import { z } from "zod";

import { HYPOTEKAJASNE_LEAD_PAYLOAD_SCHEMA_VERSION } from "@/integrations/hypotekajasne/version";

/**
 * Explicit wire DTO for HypotekaJasne lead submission.
 * Never send raw Prisma entities — map strictly through this shape.
 * PII travels in HTTPS POST body only — never query parameters.
 */
export const hypotekajasneLeadPayloadSchema = z.object({
  schemaVersion: z.string().max(64),
  correlationId: z.string().min(8).max(64),
  email: z.string().email(),
  phone: z.string().max(32).optional(),
  contactName: z.string().max(120).optional(),
  propertyReference: z.string().max(256).optional(),
  purchasePriceCzk: z.number().int().positive().optional(),
  availableEquityCzk: z.number().int().nonnegative().optional(),
  monthlyIncomeCzk: z.number().int().positive().optional(),
  monthlyLiabilitiesCzk: z.number().int().nonnegative().optional(),
  consentVersion: z.string().max(64),
  source: z.string().max(128),
  attribution: z.object({
    channel: z.string().max(64),
    funnelStep: z.string().max(64).nullable().optional(),
    campaign: z.string().max(64).nullable().optional(),
  }),
  note: z.string().max(2000).optional(),
});

export type HypotekaJasneLeadPayload = z.infer<
  typeof hypotekajasneLeadPayloadSchema
>;

export const mortgageLeadStatusDtoSchema = z.object({
  correlationId: z.string(),
  workflowStatus: z.string(),
  statusLabel: z.string(),
  partner: z.string().nullable(),
  externalLeadId: z.string().nullable(),
  source: z.string().nullable(),
  attributionChannel: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isMock: z.boolean(),
});

export type MortgageLeadStatusDto = z.infer<typeof mortgageLeadStatusDtoSchema>;

export type CreateMortgageLeadInput = {
  userId?: string | null;
  email: string;
  phone?: string | null;
  propertyId?: string | null;
  analysisId?: string | null;
  propertySlug?: string | null;
  propertyTitle?: string | null;
  consentId?: string | null;
  consentReceipt?: Record<string, unknown>;
  source: string;
  partner?: string;
  sharedFields: string[];
  sensitive: {
    purchasePriceCzk?: number | null;
    availableEquityCzk?: number | null;
    monthlyIncomeCzk?: number | null;
    monthlyLiabilitiesCzk?: number | null;
  };
  contactName?: string | null;
  marketCountry?: string;
  propertyType?: string | null;
  propertyPurpose?: "primary_residence" | "investment";
  /** Frozen financing context at submission time (Prompt 13/10). */
  contextSnapshot?: {
    valuationCzk?: number | null;
    requestedLoanCzk?: number | null;
    ltvOnAskingPricePct?: number | null;
    nominalInterestRatePp?: number | null;
    aprPp?: number | null;
    termYears?: number | null;
    estimatedMonthlyPaymentCzk?: number | null;
  };
};

export type SubmitMortgageLeadInput = {
  leadId: string;
  consentVersion: string;
  sharedFields: string[];
  contactName?: string | null;
  propertySlug?: string | null;
};

export type MortgageLeadDuplicateInfo = {
  correlationId: string;
  statusLabel: string;
  workflowStatus: string;
  createdAt: string;
};

export type MortgageLeadListItemDto = MortgageLeadStatusDto & {
  propertyTitle: string | null;
  propertySlug: string | null;
  purchasePriceCzk: number | null;
  nextStepLabel: string;
  lastUpdatedAt: string;
  submittedAt: string | null;
};

export type MortgageLeadDetailDto = MortgageLeadListItemDto & {
  timeline: {
    id: string;
    label: string;
    state: "completed" | "current" | "upcoming";
  }[];
};
