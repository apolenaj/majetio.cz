import { z } from "zod";

import {
  hypotekajasneLeadPayloadSchema,
  type HypotekaJasneLeadPayload,
} from "@/domains/leads/schemas/mortgage-lead";

/** Legacy Phase 1 preview / handoff contracts — kept for Decision Cockpit. */

export const financingPreviewRequestSchema = z.object({
  propertyPriceCzk: z.number().int().positive(),
  availableEquityCzk: z.number().int().nonnegative(),
  monthlyIncomeCzk: z.number().int().positive().optional(),
  termYears: z.number().int().min(1).max(40).default(30),
});

export type FinancingPreviewRequest = z.infer<
  typeof financingPreviewRequestSchema
>;

export const financingPreviewResponseSchema = z.object({
  estimatedMonthlyPaymentCzk: z.number(),
  estimatedRatePct: z.number(),
  loanAmountCzk: z.number(),
  disclaimer: z.string(),
  provider: z.literal("hypotekajasne"),
  isMock: z.boolean(),
});

export type FinancingPreviewResponse = z.infer<
  typeof financingPreviewResponseSchema
>;

export const handoffLeadRequestSchema = hypotekajasneLeadPayloadSchema;

export type HandoffLeadRequest = HypotekaJasneLeadPayload;

export const handoffLeadResponseSchema = z.object({
  externalLeadId: z.string(),
  status: z.enum(["accepted", "rejected"]),
  isMock: z.boolean(),
});

export type HandoffLeadResponse = z.infer<typeof handoffLeadResponseSchema>;
