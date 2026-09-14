import { resolveHypotekaJasneConfig } from "./config";
import { createHypotekaJasneClient } from "./client/factory";

export type HypotekaJasneIntegrationStatus = {
  enabled: boolean;
  useMock: boolean;
  store: "memory" | "prisma";
  adapterKind: "dev" | "http" | "mock";
  isLive: boolean;
  integrationVersion: string;
  message: string;
  apiConfigured: boolean;
  webhookConfigured: boolean;
  signingConfigured: boolean;
  authMode: string;
};

/** Safe runtime snapshot for health checks and admin diagnostics. */
export function getHypotekaJasneIntegrationStatus(): HypotekaJasneIntegrationStatus {
  const config = resolveHypotekaJasneConfig();
  const client = createHypotekaJasneClient();
  const info = client.getAdapterInfo();

  return {
    enabled: config.enabled,
    useMock: config.useMock,
    store: config.store,
    adapterKind: info.kind,
    isLive: info.isLive,
    integrationVersion: info.integrationVersion,
    message: info.message,
    apiConfigured: Boolean(config.apiUrl),
    webhookConfigured: Boolean(config.webhookSecret),
    signingConfigured: Boolean(config.signingSecret),
    authMode: config.authMode,
  };
}
