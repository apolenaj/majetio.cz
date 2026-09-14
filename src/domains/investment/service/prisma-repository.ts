/**
 * Prisma-backed repository for InvestmentCalculationService.
 */

import type { PrismaClient, Prisma } from "@prisma/client";

import type {
  AnalysisScenarioWriteInput,
  CachedCalculationRecord,
  InvestmentCalculationRepository,
  InvestmentCalculationWriteInput,
} from "./investment-calculation-service";

export function createPrismaInvestmentCalculationRepository(
  db: PrismaClient,
): InvestmentCalculationRepository {
  return {
    async findPropertyById(id) {
      const row = await db.property.findUnique({
        where: { id },
        select: {
          id: true,
          slug: true,
          currency: true,
          askingPrice: true,
          priceCzk: true,
          usableArea: true,
          areaSqm: true,
          title: true,
          propertyType: true,
          publicCity: true,
          city: true,
        },
      });
      return row;
    },

    async findCachedByInputHash(inputHash, engineVersion) {
      const row = await db.investmentCalculation.findFirst({
        where: { inputHash, engineVersion },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          inputHash: true,
          engineVersion: true,
          formulaRegistryVersion: true,
          outputs: true,
          scenarioId: true,
        },
      });
      if (!row) return null;
      return {
        id: row.id,
        inputHash: row.inputHash,
        engineVersion: row.engineVersion,
        formulaRegistryVersion: row.formulaRegistryVersion,
        outputs: row.outputs,
        scenarioId: row.scenarioId,
      } satisfies CachedCalculationRecord;
    },

    async createScenario(data: AnalysisScenarioWriteInput) {
      const row = await db.analysisScenario.create({
        data: {
          propertyId: data.propertyId,
          analysisId: data.analysisId,
          scenarioType: data.scenarioType,
          status: data.status,
          name: data.name,
          inputSnapshot: data.inputSnapshot as Prisma.InputJsonValue,
          assumptionSet: data.assumptionSet as Prisma.InputJsonValue,
          calculationEngineVersion: data.calculationEngineVersion,
          formulaRegistryVersion: data.formulaRegistryVersion,
          methodologyPackageVersion: data.methodologyPackageVersion,
          inputHash: data.inputHash,
          results: data.results as Prisma.InputJsonValue,
          calculatedAt: data.calculatedAt,
        },
        select: { id: true },
      });
      return row;
    },

    async createCalculation(data: InvestmentCalculationWriteInput) {
      const row = await db.investmentCalculation.create({
        data: {
          analysisId: data.analysisId,
          scenarioId: data.scenarioId,
          propertyId: data.propertyId,
          engineVersion: data.engineVersion,
          formulaRegistryVersion: data.formulaRegistryVersion,
          inputHash: data.inputHash,
          inputs: data.inputs as Prisma.InputJsonValue,
          outputs: data.outputs as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      return row;
    },
  };
}
