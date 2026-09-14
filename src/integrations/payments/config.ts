/**
 * Payment provider config — secrets only from server env.
 * Mock PSP is fail-closed in production unless PAYMENTS_ALLOW_MOCK=true (staging).
 */

import { getPublicAppUrl } from "@/lib/app-url";

export type PaymentsProviderId = "none" | "mock";

export type PaymentsRuntimeConfig = {
  provider: PaymentsProviderId;
  secretKey: string | null;
  webhookSecret: string | null;
  webhookToleranceSeconds: number;
  publicBaseUrl: string;
};

/**
 * Whether the mock PSP may run.
 * - Explicit `PAYMENTS_ALLOW_MOCK=true` allows mock even in production-like staging.
 * - Otherwise mock is forbidden when NODE_ENV/VERCEL_ENV is production.
 */
export function isPaymentsMockAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const providerRaw = (env.PAYMENTS_PROVIDER ?? "none").toLowerCase();
  if (providerRaw !== "mock") {
    return false;
  }
  const allow =
    env.PAYMENTS_ALLOW_MOCK === "true" || env.PAYMENTS_ALLOW_MOCK === "1";
  if (allow) {
    return true;
  }
  const productionLike =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  return !productionLike;
}

export function resolvePaymentsConfig(
  env: NodeJS.ProcessEnv = process.env,
): PaymentsRuntimeConfig {
  const providerRaw = (env.PAYMENTS_PROVIDER ?? "none").toLowerCase();
  let provider: PaymentsProviderId =
    providerRaw === "mock" ? "mock" : "none";

  // Fail-closed: misconfigured prod with PAYMENTS_PROVIDER=mock → treat as none
  if (provider === "mock" && !isPaymentsMockAllowed(env)) {
    provider = "none";
  }

  return {
    provider,
    secretKey: env.PAYMENTS_SECRET_KEY?.trim() || null,
    webhookSecret: env.PAYMENTS_WEBHOOK_SECRET?.trim() || null,
    webhookToleranceSeconds: Number(env.PAYMENTS_WEBHOOK_TOLERANCE_SEC ?? 300),
    publicBaseUrl: getPublicAppUrl(),
  };
}
