"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { SENSITIVE_CONFIRM_TOKEN } from "@/domains/administration/rbac/permissions";

export type BulkActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/**
 * Safe bulk actions — requires reason (≥12) + confirm token (158–165, 203–206).
 */
export function AdminBulkActionBar(props: {
  selectedIds: string[];
  onClear: () => void;
  actions: Array<{
    id: string;
    label: string;
    /** When true, shows dry-run preview button first. */
    supportsDryRun?: boolean;
    run: (input: {
      ids: string[];
      reason: string;
      confirmToken: string;
      dryRun: boolean;
    }) => Promise<BulkActionResult>;
  }>;
}) {
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  if (props.selectedIds.length === 0) return null;

  async function execute(
    action: (typeof props.actions)[number],
    dryRun: boolean,
  ) {
    setBusy(true);
    setError(null);
    setMessage(null);
    setPreview(null);
    const result = await action.run({
      ids: props.selectedIds,
      reason: reason.trim(),
      confirmToken: SENSITIVE_CONFIRM_TOKEN,
      dryRun,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (dryRun) {
      setPreview(result.message ?? "Dry-run OK — žádné změny nebyly provedeny.");
      return;
    }
    setMessage(result.message ?? "Hotovo.");
    props.onClear();
  }

  return (
    <div
      className="sticky bottom-3 z-20 space-y-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-overlay)]"
      role="region"
      aria-label="Hromadné akce"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          Vybráno: <strong>{props.selectedIds.length}</strong>
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={props.onClear}>
          Zrušit výběr
        </Button>
      </div>

      <Field id="bulk-reason" label="Důvod (povinný, min. 12 znaků)" required>
        <TextInput
          id="bulk-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-required
          minLength={12}
        />
      </Field>

      {error ? (
        <InlineAlert tone="warning" title="Bulk">
          {error}
        </InlineAlert>
      ) : null}
      {preview ? (
        <InlineAlert tone="info" title="Dry-run preview">
          {preview}
        </InlineAlert>
      ) : null}
      {message ? (
        <InlineAlert tone="success" title="OK">
          {message}
        </InlineAlert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {props.actions.map((action) => (
          <React.Fragment key={action.id}>
            {action.supportsDryRun ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy || reason.trim().length < 12}
                onClick={() => void execute(action, true)}
              >
                Preview · {action.label}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={busy || reason.trim().length < 12}
              onClick={() => void execute(action, false)}
            >
              {action.label}
            </Button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function AdminDryRunPreviewPanel(props: {
  title: string;
  summary: string;
  rows: Array<{ label: string; value: string }>;
  warnings?: string[];
}) {
  return (
    <section
      className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-3 text-sm"
      aria-label={props.title}
    >
      <h3 className="font-medium text-[var(--text-primary)]">{props.title}</h3>
      <p className="text-[var(--text-secondary)]">{props.summary}</p>
      <dl className="grid gap-1 sm:grid-cols-2">
        {props.rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-2 border-b border-[var(--border-subtle)] py-1">
            <dt className="text-[var(--text-muted)]">{r.label}</dt>
            <dd className="font-medium text-[var(--text-primary)]">{r.value}</dd>
          </div>
        ))}
      </dl>
      {props.warnings && props.warnings.length > 0 ? (
        <ul className="list-disc pl-4 text-[var(--status-warning)]">
          {props.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
