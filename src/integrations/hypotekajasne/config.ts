/**
 * HypotekaJasne integration configuration (env-driven).
 * API keys and signing secrets are server-only — never exposed to client bundles.
 */

export type HypotekaJasneAuthMode = "bearer" | "signed" | "bearer_and_signed";

export type HypotekaJasneConfig = {
  enabled: boolean;
  useMock: boolean;
  apiUrl: string | null;
  /** Bearer token — server env / secret manager only. */
  apiKey: string | null;
  /** HMAC signing secret for outbound + inbound webhooks. */
  signingSecret: string | null;
  /** Dedicated webhook verification secret (falls back to signingSecret). */
  webhookSecret: string | null;
  authMode: HypotekaJasneAuthMode;
  webhookToleranceSeconds: number;
  store: "memory" | "prisma";
};

export function resolveHypotekaJasneConfig(
  env: NodeJS.ProcessEnv = process.env,
): HypotekaJasneConfig {
  const enabled = env.HYPOTEKAJASNE_ENABLED === "true";
  const productionLike =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  const allowMock =
    env.HYPOTEKAJASNE_ALLOW_MOCK === "true" ||
    env.HYPOTEKAJASNE_ALLOW_MOCK === "1" ||
    !productionLike;
  // Fail-closed: production never defaults to demo offers unless explicitly allowed.
  const useMockRequested =
    env.HYPOTEKAJASNE_USE_MOCK !== "false" || !enabled;
  const useMock = useMockRequested && allowMock;
  const apiUrl = env.HYPOTEKAJASNE_API_URL?.trim() || null;
  const apiKey = env.HYPOTEKAJASNE_API_KEY?.trim() || null;
  const signingSecret =
    env.HYPOTEKAJASNE_SIGNING_SECRET?.trim() ||
    env.HYPOTEKAJASNE_API_KEY?.trim() ||
    null;
  const webhookSecret =
    env.HYPOTEKAJASNE_WEBHOOK_SECRET?.trim() || signingSecret;
  const authModeEnv = env.HYPOTEKAJASNE_AUTH_MODE?.trim();
  const authMode: HypotekaJasneAuthMode =
    authModeEnv === "signed" ||
    authModeEnv === "bearer" ||
    authModeEnv === "bearer_and_signed"
      ? authModeEnv
      : signingSecret
        ? "bearer_and_signed"
        : "bearer";
  const toleranceRaw = Number.parseInt(
    env.HYPOTEKAJASNE_WEBHOOK_TOLERANCE_SECONDS ?? "300",
    10,
  );
  const storeEnv = env.HYPOTEKAJASNE_STORE?.trim();
  const store: HypotekaJasneConfig["store"] =
    storeEnv === "prisma" || storeEnv === "memory"
      ? storeEnv
      : env.NODE_ENV === "production"
        ? "prisma"
        : "memory";

  return {
    enabled,
    useMock,
    apiUrl,
    apiKey,
    signingSecret,
    webhookSecret,
    authMode,
    webhookToleranceSeconds: Number.isFinite(toleranceRaw) ? toleranceRaw : 300,
    store,
  };
}

/** Guard: PII must never be sent in query strings. */
export function assertNoPiiInUrl(url: string): void {
  const lower = url.toLowerCase();
  const forbidden = ["email=", "phone=", "name=", "income=", "equity="];
  if (forbidden.some((token) => lower.includes(token))) {
    throw new Error("PII must not be transmitted via URL query parameters.");
  }
}
