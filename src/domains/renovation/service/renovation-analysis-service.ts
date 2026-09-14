/**
 * Persistence façade for RenovationAnalysis (Prompt 1/5 — empty service).
 * No CapEx / ARV math here.
 */

import type {
  RenovationAnalysis,
  RenovationAnalysisCreateInput,
  RenovationAnalysisUpdateInput,
} from "../types";

export type RenovationAnalysisRepository = {
  create(input: RenovationAnalysisCreateInput): Promise<RenovationAnalysis>;
  findById(id: string): Promise<RenovationAnalysis | null>;
  update(
    id: string,
    patch: RenovationAnalysisUpdateInput,
  ): Promise<RenovationAnalysis | null>;
  listByProperty(propertyId: string): Promise<RenovationAnalysis[]>;
  listByAnalysis(analysisId: string): Promise<RenovationAnalysis[]>;
};

export type RenovationAnalysisService = {
  create(input: RenovationAnalysisCreateInput): Promise<RenovationAnalysis>;
  getById(id: string): Promise<RenovationAnalysis | null>;
  update(
    id: string,
    patch: RenovationAnalysisUpdateInput,
  ): Promise<RenovationAnalysis | null>;
  listForProperty(propertyId: string): Promise<RenovationAnalysis[]>;
  listForAnalysis(analysisId: string): Promise<RenovationAnalysis[]>;
};

/**
 * In-memory stub repository for unit wiring until Prisma adapter lands.
 */
export function createInMemoryRenovationAnalysisRepository(): RenovationAnalysisRepository {
  const rows = new Map<string, RenovationAnalysis>();
  let seq = 0;

  return {
    async create(input) {
      const now = new Date();
      const id = `reno-analysis-stub-${++seq}`;
      const row: RenovationAnalysis = {
        id,
        propertyId: input.propertyId ?? null,
        analysisId: input.analysisId ?? null,
        scenarioId: input.scenarioId ?? null,
        type: input.type,
        status: input.status ?? "DRAFT",
        scopeVersion: input.scopeVersion,
        costModelVersion: input.costModelVersion,
        locationCostVersion: input.locationCostVersion,
        estimatedLow: input.estimatedLow ?? null,
        estimatedBase: input.estimatedBase ?? null,
        estimatedHigh: input.estimatedHigh ?? null,
        contingencyAmount: input.contingencyAmount ?? null,
        estimatedDuration: input.estimatedDuration ?? null,
        confidence: input.confidence ?? null,
        createdAt: now,
        updatedAt: now,
        calculatedAt: input.calculatedAt ?? null,
      };
      rows.set(id, row);
      return row;
    },
    async findById(id) {
      return rows.get(id) ?? null;
    },
    async update(id, patch) {
      const prev = rows.get(id);
      if (!prev) return null;
      const next: RenovationAnalysis = {
        ...prev,
        ...patch,
        id: prev.id,
        propertyId: prev.propertyId,
        analysisId: prev.analysisId,
        scenarioId: prev.scenarioId,
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return next;
    },
    async listByProperty(propertyId) {
      return [...rows.values()].filter((r) => r.propertyId === propertyId);
    },
    async listByAnalysis(analysisId) {
      return [...rows.values()].filter((r) => r.analysisId === analysisId);
    },
  };
}

export function createRenovationAnalysisService(
  repository: RenovationAnalysisRepository = createInMemoryRenovationAnalysisRepository(),
): RenovationAnalysisService {
  return {
    create: (input) => repository.create(input),
    getById: (id) => repository.findById(id),
    update: (id, patch) => repository.update(id, patch),
    listForProperty: (propertyId) => repository.listByProperty(propertyId),
    listForAnalysis: (analysisId) => repository.listByAnalysis(analysisId),
  };
}
