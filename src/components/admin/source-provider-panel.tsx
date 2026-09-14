"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import {
  adminEnforceExpiredLicenseAction,
  adminUpdateProviderGovernanceAction,
} from "@/domains/data-engine/server/admin-actions";
import type { ProviderOpsRow } from "@/domains/property-sources/admin/source-ops";
import type { SourceHealthStatus } from "@/domains/property-sources/admin/health";

export function SourceProviderPanel({
  items,
  canManage,
}: {
  items: ProviderOpsRow[];
  canManage: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function save(
    provider: string,
    patch: {
      healthStatus: SourceHealthStatus;
      importEnabled: boolean;
      frontendVisible: boolean;
      licenseExpiresAt?: string;
      notes?: string;
    },
  ) {
    setBusy(provider);
    setError(null);
    setOk(null);
    const result = await adminUpdateProviderGovernanceAction({
      provider,
      ...patch,
      cascadeToSources: true,
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(`Provider ${provider} updated.`);
  }

  async function enforce(provider: string) {
    setBusy(provider);
    setError(null);
    setOk(null);
    const result = await adminEnforceExpiredLicenseAction({ provider });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(
      `Licence enforced — import stopped, frontend hidden (${result.affectedSources} sources).`,
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <InlineAlert tone="warning" title="Zdroje">
          {error}
        </InlineAlert>
      ) : null}
      {ok ? (
        <InlineAlert tone="info" title="Hotovo">
          {ok}
        </InlineAlert>
      ) : null}

      <ul className="space-y-4">
        {items.map((row) => (
          <ProviderCard
            key={row.provider}
            row={row}
            canManage={canManage}
            busy={busy === row.provider}
            onSave={save}
            onEnforce={enforce}
          />
        ))}
      </ul>
    </div>
  );
}

function ProviderCard({
  row,
  canManage,
  busy,
  onSave,
  onEnforce,
}: {
  row: ProviderOpsRow;
  canManage: boolean;
  busy: boolean;
  onSave: (
    provider: string,
    patch: {
      healthStatus: SourceHealthStatus;
      importEnabled: boolean;
      frontendVisible: boolean;
      licenseExpiresAt?: string;
      notes?: string;
    },
  ) => Promise<void>;
  onEnforce: (provider: string) => Promise<void>;
}) {
  const [health, setHealth] = React.useState<SourceHealthStatus>(
    row.healthStatus,
  );
  const [importEnabled, setImportEnabled] = React.useState(row.importEnabled);
  const [frontendVisible, setFrontendVisible] = React.useState(
    row.frontendVisible,
  );
  const [expires, setExpires] = React.useState(
    row.licenseExpiresAt
      ? new Date(row.licenseExpiresAt).toISOString().slice(0, 16)
      : "",
  );
  const [notes, setNotes] = React.useState(row.notes ?? "");

  return (
    <li className="space-y-3 rounded-lg border border-[var(--border-default)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium">
            {row.displayName ?? row.provider}{" "}
            <span className="text-xs text-[var(--text-muted)]">
              ({row.provider})
            </span>
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {row.sourceCount.toLocaleString("cs-CZ")} sources · health{" "}
            {row.healthStatus} · license {row.licenseStatus} · stale rows{" "}
            {row.staleSourceCount}
          </p>
        </div>
      </div>
      {canManage ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-[var(--text-muted)]">
            Health
            <select
              value={health}
              onChange={(e) =>
                setHealth(e.target.value as SourceHealthStatus)
              }
              className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
            >
              {["HEALTHY", "DEGRADED", "UNHEALTHY", "DISABLED"].map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <Field id={`exp-${row.provider}`} label="License expires">
            <TextInput
              id={`exp-${row.provider}`}
              type="datetime-local"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={importEnabled}
              onChange={(e) => setImportEnabled(e.target.checked)}
            />
            Import enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={frontendVisible}
              onChange={(e) => setFrontendVisible(e.target.checked)}
            />
            Frontend visible
          </label>
          <div className="sm:col-span-2">
            <Field id={`notes-${row.provider}`} label="Notes">
              <TextInput
                id={`notes-${row.provider}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() =>
                void onSave(row.provider, {
                  healthStatus: health,
                  importEnabled,
                  frontendVisible,
                  licenseExpiresAt: expires || undefined,
                  notes,
                })
              }
            >
              Save governance
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void onEnforce(row.provider)}
            >
              Enforce expired license
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
