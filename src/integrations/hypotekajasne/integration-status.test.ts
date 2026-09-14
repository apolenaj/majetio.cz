import { afterEach, describe, expect, it } from "vitest";

import { resolveHypotekaJasneConfig } from "./config";
import { createHypotekaJasneClient } from "./client/factory";
import { getHypotekaJasneIntegrationStatus } from "./integration-status";

describe("HypotekaJasne config + factory", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to dev adapter in local mode", () => {
    delete process.env.HYPOTEKAJASNE_ENABLED;
    delete process.env.HYPOTEKAJASNE_USE_MOCK;
    delete process.env.HYPOTEKAJASNE_API_URL;

    const config = resolveHypotekaJasneConfig();
    expect(config.useMock).toBe(true);
    expect(config.enabled).toBe(false);

    const client = createHypotekaJasneClient();
    expect(client.getAdapterInfo().kind).toBe("dev");
  });

  it("selects HTTP adapter when live mode is configured", () => {
    process.env.HYPOTEKAJASNE_ENABLED = "true";
    process.env.HYPOTEKAJASNE_USE_MOCK = "false";
    process.env.HYPOTEKAJASNE_API_URL = "https://api.hypotekajasne.test";

    const client = createHypotekaJasneClient();
    expect(client.getAdapterInfo().kind).toBe("http");
  });

  it("reports integration status snapshot", () => {
    process.env.HYPOTEKAJASNE_ENABLED = "false";
    const status = getHypotekaJasneIntegrationStatus();
    expect(status.adapterKind).toBe("dev");
    expect(status.isLive).toBe(false);
    expect(status.store).toBeDefined();
  });
});
