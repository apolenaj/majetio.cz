import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { listFeatureFlags } from "@/domains/platform/admin/feature-flags";
import {
  getSecretEnvStatuses,
  listAppConfigurations,
} from "@/domains/platform/admin/config-center";
import {
  ConfigUpsertForm,
  FeatureFlagToggleRow,
} from "@/components/admin/platform-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Feature flags & konfigurace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminNastaveniPage() {
  let actor;
  try {
    actor = await requirePermission("platform.flags.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const canWrite = hasPermission(actor.role, "platform.flags.write");
  const { items: flags, error: flagsError } = await listFeatureFlags();
  const { items: configs, error: configError } = await listAppConfigurations();
  const secrets = getSecretEnvStatuses();

  const kill = flags.filter((f) => f.isKillSwitch);
  const product = flags.filter((f) => !f.isKillSwitch);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Feature Flag & Configuration Center"
        description="GLOBAL / MARKET / USER_PERCENTAGE. Kill switches a business limity. Secrets jen configured / not configured."
      />

      {flagsError || configError ? (
        <InlineAlert tone="warning" title="Načtení">
          {[flagsError, configError].filter(Boolean).join(" · ")}
        </InlineAlert>
      ) : null}

      <section className="space-y-2">
        <h2 className="font-display text-xl">Kill switches</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Okamžité vypnutí: payments, new listings, valuace, trhy. Každá změna =
          audit (old → new + reason + actor).
        </p>
        <ul>
          {kill.map((f) => (
            <FeatureFlagToggleRow
              key={f.id}
              flagId={f.id}
              flagKey={f.key}
              enabled={f.enabled}
              isKillSwitch
              description={f.description}
              canWrite={canWrite}
            />
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl">Feature flags</h2>
        <ul>
          {product.length === 0 ? (
            <li className="text-sm text-[var(--text-muted)]">
              Zatím žádné product flags v DB (env flags zůstávají v{" "}
              <code>src/config/feature-flags.ts</code>).
            </li>
          ) : (
            product.map((f) => (
              <FeatureFlagToggleRow
                key={f.id}
                flagId={f.id}
                flagKey={`${f.key} [${f.scope}${f.marketCode ? `:${f.marketCode}` : ""}]`}
                enabled={f.enabled}
                isKillSwitch={false}
                description={
                  f.percentage != null
                    ? `rollout ${f.percentage}% · ${f.description ?? ""}`
                    : f.description
                }
                canWrite={canWrite}
              />
            ))
          )}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl">Configuration Center</h2>
        <ul className="space-y-1 text-sm">
          {configs.map((c) => (
            <li key={c.id}>
              <code>{c.key}</code>{" "}
              <span className="text-[var(--text-muted)]">
                ({c.category}) = {JSON.stringify(c.value)}
              </span>
            </li>
          ))}
        </ul>
        <ConfigUpsertForm canWrite={canWrite} />
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl">Secrets (env status)</h2>
        <InlineAlert tone="info" title="Privacy">
          Hodnoty secret env proměnných se nikdy nezobrazují.
        </InlineAlert>
        <ul className="columns-1 gap-2 text-sm sm:columns-2">
          {secrets.map((s) => (
            <li key={s.key} className="break-inside-avoid">
              <code>{s.key}</code> —{" "}
              {s.configured ? (
                <span className="text-[var(--status-success)]">configured</span>
              ) : (
                <span className="text-[var(--text-muted)]">not configured</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
