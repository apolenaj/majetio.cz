/**
 * Phase 3 — concurrency, maintenance, URL hygiene, seed/bootstrap gates.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getPublicAppUrl } from "@/lib/app-url";
import {
  isMaintenanceBypassPath,
  isMaintenanceMode,
} from "@/lib/maintenance";

const root = (...parts: string[]) => join(process.cwd(), ...parts);

describe("Phase 3 — public app URL hygiene", () => {
  it("refuses localhost when NODE_ENV is production", () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevPublicApp = process.env.NEXT_PUBLIC_APP_URL;
    const prevAuth = process.env.AUTH_URL;
    const prevApp = process.env.APP_URL;
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      Reflect.set(process.env, "NODE_ENV", "production");
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      delete process.env.AUTH_URL;
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      expect(getPublicAppUrl()).toBe("https://www.majetio.cz");
    } finally {
      Reflect.set(process.env, "NODE_ENV", prevNodeEnv);
      if (prevPublicApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevPublicApp;
      if (prevAuth === undefined) delete process.env.AUTH_URL;
      else process.env.AUTH_URL = prevAuth;
      if (prevApp === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = prevApp;
      if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
    }
  });

  it("allows localhost in development", () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevPublicApp = process.env.NEXT_PUBLIC_APP_URL;
    try {
      Reflect.set(process.env, "NODE_ENV", "development");
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      expect(getPublicAppUrl()).toBe("http://localhost:3000");
    } finally {
      Reflect.set(process.env, "NODE_ENV", prevNodeEnv);
      if (prevPublicApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevPublicApp;
    }
  });
});

describe("Phase 3 — maintenance mode", () => {
  it("reads MAINTENANCE_MODE env", () => {
    expect(isMaintenanceMode({ MAINTENANCE_MODE: "true" })).toBe(true);
    expect(isMaintenanceMode({ MAINTENANCE_MODE: "false" })).toBe(false);
    expect(isMaintenanceMode({})).toBe(false);
  });

  it("bypasses health and admin paths", () => {
    expect(isMaintenanceBypassPath("/api/ready")).toBe(true);
    expect(isMaintenanceBypassPath("/admin")).toBe(true);
    expect(isMaintenanceBypassPath("/nemovitosti")).toBe(false);
  });

  it("middleware imports maintenance helpers", () => {
    const src = readFileSync(root("src/middleware.ts"), "utf8");
    expect(src).toMatch(/isMaintenanceMode/);
    expect(src).toMatch(/maintenanceHtmlResponse/);
  });
});

describe("Phase 3 — concurrency / idempotency contracts", () => {
  it("payment webhook claims processedAt atomically", () => {
    const src = readFileSync(
      root("src/domains/payments/service/webhook-handler.ts"),
      "utf8",
    );
    expect(src).toMatch(/updateMany/);
    expect(src).toMatch(/processedAt: null/);
  });

  it("property merge claims PENDING candidate", () => {
    const src = readFileSync(
      root("src/domains/properties/admin/merge-service.ts"),
      "utf8",
    );
    expect(src).toMatch(/status: "PENDING"/);
    expect(src).toMatch(/claimed\.count !== 1/);
  });

  it("create-order engages kill.payments and atomic promo claim", () => {
    const src = readFileSync(
      root("src/domains/orders/service/create-order.ts"),
      "utf8",
    );
    expect(src).toMatch(/isKillSwitchEngaged\("kill\.payments"\)/);
    expect(src).toMatch(/redemptionCount: \{ lt:/);
    expect(src).toMatch(/PROMO_EXHAUSTED/);
  });

  it("checkout wizard reuses sessionStorage idempotency key", () => {
    const src = readFileSync(
      root("src/components/checkout/checkout-wizard.tsx"),
      "utf8",
    );
    expect(src).toMatch(/sessionStorage\.getItem/);
    expect(src).toMatch(/majetio\.checkout\.idem/);
  });
});

describe("Phase 3 — seed / bootstrap / mock fail-closed", () => {
  it("seed scripts refuse production", () => {
    const demo = readFileSync(root("scripts/seed-demo-properties.ts"), "utf8");
    const testUser = readFileSync(root("scripts/seed-test-user.ts"), "utf8");
    expect(demo).toMatch(/assertSeedAllowed/);
    expect(testUser).toMatch(/must never run in production/);
  });

  it("bootstrap-admin requires force gates and strong password", () => {
    const src = readFileSync(root("scripts/bootstrap-admin.ts"), "utf8");
    expect(src).toMatch(/ALLOW_ADMIN_BOOTSTRAP/);
    expect(src).toMatch(/CONFIRM_PROD_ADMIN_BOOTSTRAP/);
    expect(src).toMatch(/at least 16 characters/);
    expect(src).not.toMatch(/console\.info\(.*PASSWORD/);
  });

  it("registerAction always creates Role.USER", () => {
    const src = readFileSync(root("src/lib/auth/actions.ts"), "utf8");
    expect(src).toMatch(/role: Role\.USER/);
    expect(src).not.toMatch(/role:\s*formData/);
  });

  it("mock-complete is gated by isPaymentsMockAllowed", () => {
    const src = readFileSync(
      root("src/app/api/payments/mock-complete/route.ts"),
      "utf8",
    );
    expect(src).toMatch(/isPaymentsMockAllowed/);
  });

  it("global-error.tsx exists for root crash recovery", () => {
    const src = readFileSync(root("src/app/global-error.tsx"), "utf8");
    expect(src).toMatch(/<html/);
    expect(src).toMatch(/Něco se pokazilo/);
  });
});
