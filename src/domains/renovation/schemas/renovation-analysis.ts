import { z } from "zod";

import {
  RENOVATION_ANALYSIS_STATUSES,
  RENOVATION_ANALYSIS_TYPES,
} from "../types";

/** Zod stubs for RenovationAnalysis — expand in later prompts. */
export const renovationAnalysisTypeSchema = z.enum(RENOVATION_ANALYSIS_TYPES);
export const renovationAnalysisStatusSchema = z.enum(
  RENOVATION_ANALYSIS_STATUSES,
);

export const renovationAnalysisCreateSchema = z.object({
  propertyId: z.string().min(1).nullable().optional(),
  analysisId: z.string().min(1).nullable().optional(),
  scenarioId: z.string().min(1).nullable().optional(),
  type: renovationAnalysisTypeSchema,
  status: renovationAnalysisStatusSchema.optional(),
  scopeVersion: z.string().min(1),
  costModelVersion: z.string().min(1),
  locationCostVersion: z.string().min(1),
  estimatedLow: z.number().int().nonnegative().nullable().optional(),
  estimatedBase: z.number().int().nonnegative().nullable().optional(),
  estimatedHigh: z.number().int().nonnegative().nullable().optional(),
  contingencyAmount: z.number().int().nonnegative().nullable().optional(),
  estimatedDuration: z.number().int().positive().nullable().optional(),
  confidence: z.number().min(0).max(100).nullable().optional(),
  calculatedAt: z.coerce.date().nullable().optional(),
});

export type RenovationAnalysisCreateParsed = z.infer<
  typeof renovationAnalysisCreateSchema
>;
