import { DevHypotekaJasneAdapter } from "../adapters/dev-adapter";
import { HttpHypotekaJasneAdapter } from "../adapters/http-adapter";
import { resolveHypotekaJasneConfig } from "../config";
import type { HypotekaJasneClient } from "./interface";

export function createHypotekaJasneClient(): HypotekaJasneClient {
  const config = resolveHypotekaJasneConfig();

  if (config.useMock || !config.enabled) {
    return new DevHypotekaJasneAdapter();
  }

  if (!config.apiUrl) {
    throw new Error(
      "HYPOTEKAJASNE_API_URL is required when live integration is enabled. Set HYPOTEKAJASNE_USE_MOCK=true for development.",
    );
  }

  return new HttpHypotekaJasneAdapter({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    signingSecret: config.signingSecret,
    authMode: config.authMode,
  });
}
