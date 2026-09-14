import { z } from "zod";

import {
  QUALITY_LEVELS,
  RENOVATION_CATEGORIES,
  RENOVATION_ITEM_SOURCES,
  RENOVATION_STANDARDS,
  RENOVATION_UNITS,
  SCOPE_ORIGINS,
} from "../scope/types";

export const renovationCategorySchema = z.enum(RENOVATION_CATEGORIES);
export const renovationUnitSchema = z.enum(RENOVATION_UNITS);
export const qualityLevelSchema = z.enum(QUALITY_LEVELS);
export const renovationStandardSchema = z.enum(RENOVATION_STANDARDS);
export const scopeOriginSchema = z.enum(SCOPE_ORIGINS);
export const renovationItemSourceSchema = z.enum(RENOVATION_ITEM_SOURCES);

export const renovationItemSchema = z.object({
  id: z.string().min(1),
  category: renovationCategorySchema,
  scope: z.string().min(1),
  quantity: z.number().nonnegative().nullable(),
  unit: renovationUnitSchema.nullable(),
  qualityLevel: qualityLevelSchema,
  costLow: z.number().int().nonnegative().nullable(),
  costBase: z.number().int().nonnegative().nullable(),
  costHigh: z.number().int().nonnegative().nullable(),
  confidence: z.number().min(0).max(100).nullable(),
  source: renovationItemSourceSchema,
});

export const renovationScopeSnapshotSchema = z.object({
  version: z.string().min(1),
  standard: renovationStandardSchema,
  items: z.array(renovationItemSchema),
  confidence: z.number().min(0).max(100).nullable(),
  capturedAt: z.coerce.date(),
});

export const renovationScopeSchema = z.object({
  version: z.string().min(1),
  standard: renovationStandardSchema,
  items: z.array(renovationItemSchema),
  origin: scopeOriginSchema,
  automaticSnapshot: renovationScopeSnapshotSchema.nullable(),
  inferredFromCondition: z.boolean(),
  confidence: z.number().min(0).max(100).nullable(),
  notes: z.string().nullable(),
});

export type RenovationScopeParsed = z.infer<typeof renovationScopeSchema>;
