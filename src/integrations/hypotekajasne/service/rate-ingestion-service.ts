import { createHypotekaJasneClient } from "../client/factory";
import { resolveHypotekaJasneConfig } from "../config";
import {
  runRateIngestionPipeline,
  type IngestionPipelineResult,
} from "../pipeline";
import { InMemoryMortgageOfferStore } from "./mortgage-offer-store";
import { PrismaMortgageOfferStore } from "./prisma-mortgage-offer-store";
import type { MortgageOfferStore } from "../pipeline/ingest";
import { isMortgageAutoPublishEnabled } from "@/domains/financing/admin/mortgage-ops";

let defaultStore: MortgageOfferStore | null = null;

export function getDefaultMortgageOfferStore(): MortgageOfferStore {
  if (!defaultStore) {
    const { store } = resolveHypotekaJasneConfig();
    defaultStore =
      store === "prisma"
        ? new PrismaMortgageOfferStore()
        : new InMemoryMortgageOfferStore();
  }
  return defaultStore;
}

export function resetDefaultMortgageOfferStore(): void {
  defaultStore = null;
}

export async function ingestMortgageRates(input?: {
  runId?: string;
  store?: MortgageOfferStore;
}): Promise<IngestionPipelineResult> {
  const client = createHypotekaJasneClient();
  const store = input?.store ?? getDefaultMortgageOfferStore();
  const autoPublishEnabled = await isMortgageAutoPublishEnabled();

  return runRateIngestionPipeline({
    client,
    store,
    runId: input?.runId,
    autoPublishEnabled,
  });
}
