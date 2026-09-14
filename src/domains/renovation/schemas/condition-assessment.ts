import { z } from "zod";

import {
  CONDITION_AREAS,
  CONDITION_ASSESSMENT_SOURCES,
  CONDITION_STATUSES,
  PROPERTY_CONDITIONS,
} from "../condition/types";

export const conditionAreaSchema = z.enum(CONDITION_AREAS);
export const conditionAreaStatusSchema = z.enum(CONDITION_STATUSES);
export const conditionAssessmentSourceSchema = z.enum(
  CONDITION_ASSESSMENT_SOURCES,
);
export const propertyConditionSchema = z.enum(PROPERTY_CONDITIONS);

export const conditionAreaAssessmentSchema = z.object({
  area: conditionAreaSchema,
  status: conditionAreaStatusSchema,
  source: conditionAssessmentSourceSchema,
  confidence: z.number().min(0).max(100).nullable(),
  notes: z.string().nullable(),
});

export const renovationConditionAssessmentSchema = z.object({
  propertyCondition: propertyConditionSchema.nullable(),
  areas: z.record(conditionAreaSchema, conditionAreaAssessmentSchema),
  severityScore: z.number().min(0).max(100).nullable(),
  conditionModelVersion: z.string().min(1),
  assessedAt: z.coerce.date(),
  isPartial: z.boolean(),
});

export const conditionPropertyInputSchema = z.object({
  propertyId: z.string().optional(),
  condition: propertyConditionSchema,
  usableArea: z.number().positive().nullable().optional(),
  floorArea: z.number().positive().nullable().optional(),
  roomsCount: z.number().int().positive().nullable().optional(),
  bathroomsCount: z.number().int().positive().nullable().optional(),
  yearBuilt: z.number().int().nullable().optional(),
  yearRenovated: z.number().int().nullable().optional(),
  areaOverrides: z
    .partialRecord(conditionAreaSchema, conditionAreaStatusSchema)
    .optional(),
});

export type RenovationConditionAssessmentParsed = z.infer<
  typeof renovationConditionAssessmentSchema
>;
