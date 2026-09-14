/**
 * InvestmentCalculationService — orchestration over the pure calculation engine.
 *
 * Loads property → applies assumptions → hashes inputs → cache lookup →
 * runs engine → persists AnalysisScenario + InvestmentCalculation with
 * frozen engine / formula versions (never rewrite historical rows in place).
 */

import {
  FORMULA_REGISTRY_VERSION,
  INVESTMENT_ENGINE_VERSION,
} from "../engine";
import { getCurrentMethodologyPackageVersion } from "@/content/methodology/versions";
import {
  parseAssumptionSet,
  type AssumptionSet,
} from "./assumptions";
import { hashCalculationInput } from "./hash";
import { mergeSnapshotWithAssumptions } from "./merge-input";
import {
  buildPropertyInvestmentSnapshot,
  type PropertyInvestmentSnapshot,
  type PropertySourceForSnapshot,
} from "./property-snapshot";
import { runInvestmentCalculationPure } from "./run-calculation";
import {
  orchestratedCalculationResultSchema,
  type AnalysisScenarioStatusCode,
  type AnalysisScenarioTypeCode,
  type OrchestratedCalculationResult,
  type PersistedScenarioRecord,
  type RunCalculationRequest,
} from "./types";

export type CachedCalculationRecord = {
  id: string;
  inputHash: string;
  engineVersion: string;
  formulaRegistryVersion: string;
  outputs: unknown;
  scenarioId?: string | null;
};

export type AnalysisScenarioWriteInput = {
  propertyId: string | null;
  analysisId: string | null;
  scenarioType: AnalysisScenarioTypeCode;
  status: AnalysisScenarioStatusCode;
  name: string | null;
  inputSnapshot: PropertyInvestmentSnapshot;
  assumptionSet: AssumptionSet;
  calculationEngineVersion: string;
  formulaRegistryVersion: string;
  methodologyPackageVersion: string;
  inputHash: string;
  results: OrchestratedCalculationResult;
  calculatedAt: Date;
};

export type InvestmentCalculationWriteInput = {
  analysisId: string | null;
  scenarioId: string | null;
  propertyId: string | null;
  engineVersion: string;
  formulaRegistryVersion: string;
  inputHash: string;
  inputs: {
    propertySnapshot: PropertyInvestmentSnapshot;
    assumptionSet: AssumptionSet;
    scenarioType: AnalysisScenarioTypeCode;
    mergedEngineInput: unknown;
  };
  outputs: OrchestratedCalculationResult;
};

export type InvestmentCalculationRepository = {
  findPropertyById(id: string): Promise<PropertySourceForSnapshot | null>;
  findCachedByInputHash(
    inputHash: string,
    engineVersion: string,
  ): Promise<CachedCalculationRecord | null>;
  createScenario(
    data: AnalysisScenarioWriteInput,
  ): Promise<{ id: string }>;
  createCalculation(
    data: InvestmentCalculationWriteInput,
  ): Promise<{ id: string }>;
};

export type InvestmentCalculationService = {
  /**
   * Run (or cache-hit) a calculation for a property id.
   */
  calculateForProperty(input: {
    propertyId: string;
    assumptionSet?: AssumptionSet | unknown;
    scenarioType?: AnalysisScenarioTypeCode;
    analysisId?: string | null;
    scenarioName?: string | null;
    skipCache?: boolean;
    persist?: boolean;
    asOf?: Date;
  }): Promise<PersistedScenarioRecord>;

  /**
   * Run from an already-built snapshot (tests / offline).
   */
  calculateFromSnapshot(
    request: RunCalculationRequest & { persist?: boolean },
  ): Promise<PersistedScenarioRecord>;
};

function toScenarioStatus(
  resultStatus: OrchestratedCalculationResult["status"],
): AnalysisScenarioStatusCode {
  if (resultStatus === "CALCULATED") return "CALCULATED";
  if (resultStatus === "PARTIAL") return "PARTIAL";
  return "FAILED";
}

export function createInvestmentCalculationService(deps: {
  repository: InvestmentCalculationRepository;
}): InvestmentCalculationService {
  const { repository } = deps;

  async function runAndMaybePersist(
    request: RunCalculationRequest & { persist?: boolean },
  ): Promise<PersistedScenarioRecord> {
    const assumptionSet = parseAssumptionSet(request.assumptionSet ?? {});
    const scenarioType = request.scenarioType ?? "BASE_METRICS";
    const asOf = request.asOf ?? new Date();
    const persist = request.persist !== false;

    const inputHash = hashCalculationInput({
      propertySnapshot: request.propertySnapshot,
      assumptionSet,
      scenarioType,
      engineVersion: INVESTMENT_ENGINE_VERSION,
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    });

    if (!request.skipCache) {
      const cached = await repository.findCachedByInputHash(
        inputHash,
        INVESTMENT_ENGINE_VERSION,
      );
      if (cached) {
        const parsed = orchestratedCalculationResultSchema.safeParse(
          cached.outputs,
        );
        if (parsed.success) {
          return {
            id: cached.scenarioId ?? cached.id,
            propertyId: request.propertySnapshot.propertyId,
            analysisId: request.analysisId ?? null,
            scenarioType,
            status: toScenarioStatus(parsed.data.status),
            inputHash,
            calculationEngineVersion: cached.engineVersion,
            formulaRegistryVersion: cached.formulaRegistryVersion,
            methodologyPackageVersion: getCurrentMethodologyPackageVersion(),
            results: { ...parsed.data, cacheHit: true },
            cacheHit: true,
          };
        }
      }
    }

    const results = runInvestmentCalculationPure({
      propertySnapshot: request.propertySnapshot,
      assumptionSet,
      scenarioType,
      inputHash,
      asOf,
    });

    const status = toScenarioStatus(results.status);
    let scenarioId = `ephemeral-${inputHash.slice(0, 12)}`;
    const persistPropertyId =
      request.propertySnapshot.propertyId === "calculator-ephemeral"
        ? null
        : request.propertySnapshot.propertyId;

    if (persist) {
      const scenario = await repository.createScenario({
        propertyId: persistPropertyId,
        analysisId: request.analysisId ?? null,
        scenarioType,
        status,
        name: request.scenarioName ?? null,
        inputSnapshot: request.propertySnapshot,
        assumptionSet,
        calculationEngineVersion: results.engineVersion,
        formulaRegistryVersion: results.formulaRegistryVersion,
        methodologyPackageVersion: getCurrentMethodologyPackageVersion(),
        inputHash,
        results,
        calculatedAt: asOf,
      });
      scenarioId = scenario.id;

      const merged = mergeSnapshotWithAssumptions(
        request.propertySnapshot,
        assumptionSet,
      );
      await repository.createCalculation({
        analysisId: request.analysisId ?? null,
        scenarioId,
        propertyId: persistPropertyId,
        engineVersion: results.engineVersion,
        formulaRegistryVersion: results.formulaRegistryVersion,
        inputHash,
        inputs: {
          propertySnapshot: request.propertySnapshot,
          assumptionSet,
          scenarioType,
          mergedEngineInput: merged.input,
        },
        outputs: results,
      });
    }

    return {
      id: scenarioId,
      propertyId: persistPropertyId,
      analysisId: request.analysisId ?? null,
      scenarioType,
      status,
      inputHash,
      calculationEngineVersion: results.engineVersion,
      formulaRegistryVersion: results.formulaRegistryVersion,
      methodologyPackageVersion: getCurrentMethodologyPackageVersion(),
      results,
      cacheHit: false,
    };
  }

  return {
    async calculateForProperty(input) {
      const property = await repository.findPropertyById(input.propertyId);
      if (!property) {
        throw new Error(`Property not found: ${input.propertyId}`);
      }
      const snapshot = buildPropertyInvestmentSnapshot(
        property,
        input.asOf ?? new Date(),
      );
      return runAndMaybePersist({
        propertySnapshot: snapshot,
        assumptionSet: parseAssumptionSet(input.assumptionSet ?? {}),
        scenarioType: input.scenarioType,
        analysisId: input.analysisId,
        scenarioName: input.scenarioName,
        skipCache: input.skipCache,
        persist: input.persist,
        asOf: input.asOf,
      });
    },

    async calculateFromSnapshot(request) {
      return runAndMaybePersist(request);
    },
  };
}
