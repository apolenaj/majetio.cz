"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { SENSITIVE_CONFIRM_TOKEN } from "@/domains/administration/rbac/permissions";
import {
  adminExecuteMergeAction,
  adminMarkNotDuplicateAction,
  adminPreviewMergeAction,
} from "@/domains/properties/server/admin-actions";
import type { DuplicateCandidateListItem } from "@/domains/properties/admin/duplicates";
import { AdminDryRunPreviewPanel } from "@/components/admin/data-table";

type PreviewPayload = {
  candidateId: string;
  surviving: { id: string; title: string; status: string; slug: string };
  secondary: { id: string; title: string; status: string; slug: string };
  fieldPreview: Array<{
    fieldKey: string;
    chosenValue: unknown;
    reason: string;
    fromPropertyId: string | null;
  }>;
};

export function DuplicateReviewPanel({
  items,
}: {
  items: DuplicateCandidateListItem[];
}) {
  const [preview, setPreview] = React.useState<PreviewPayload | null>(null);
  const [preferred, setPreferred] = React.useState<string>("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function loadPreview(candidateId: string, preferredCanonicalId?: string) {
    setBusy(true);
    setError(null);
    setOk(null);
    const result = await adminPreviewMergeAction({
      candidateId,
      preferredCanonicalId: preferredCanonicalId || undefined,
    });
    setBusy(false);
    if (!result.ok || !result.preview) {
      setError(result.error ?? "Preview failed");
      setPreview(null);
      return;
    }
    setPreview(result.preview as PreviewPayload);
    setPreferred(result.preview.surviving.id);
  }

  async function executeMerge() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    setOk(null);
    const result = await adminExecuteMergeAction({
      candidateId: preview.candidateId,
      preferredCanonicalId: preferred || undefined,
      reason,
      confirmToken: SENSITIVE_CONFIRM_TOKEN,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(
      `Merge OK · surviving ${result.canonicalPropertyId} · event ${result.mergeEventId}`,
    );
    setPreview(null);
  }

  async function markNotDup(candidateId: string) {
    setBusy(true);
    setError(null);
    const result = await adminMarkNotDuplicateAction({ candidateId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk("Označeno jako NOT_DUPLICATE.");
  }

  return (
    <div className="space-y-6">
      {error ? (
        <InlineAlert tone="warning" title="Duplikáty">
          {error}
        </InlineAlert>
      ) : null}
      {ok ? (
        <InlineAlert tone="info" title="Hotovo">
          {ok}
        </InlineAlert>
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="space-y-2 rounded-lg border border-[var(--border-default)] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                Similarity {(item.similarityScore * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-[var(--text-muted)]">{item.status}</p>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <Link
                  href={`/admin/nemovitosti/${item.propertyA.id}`}
                  className="text-[var(--text-link)] hover:underline"
                >
                  A: {item.propertyA.title}
                </Link>
                <p className="text-xs text-[var(--text-muted)]">
                  {item.propertyA.marketCode} · {item.propertyA.publicCity ?? "—"} ·{" "}
                  {item.propertyA.status}
                </p>
              </div>
              <div>
                <Link
                  href={`/admin/nemovitosti/${item.propertyB.id}`}
                  className="text-[var(--text-link)] hover:underline"
                >
                  B: {item.propertyB.title}
                </Link>
                <p className="text-xs text-[var(--text-muted)]">
                  {item.propertyB.marketCode} · {item.propertyB.publicCity ?? "—"} ·{" "}
                  {item.propertyB.status}
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Evidence: price{" "}
              {item.evidence.priceA ?? "—"}/{item.evidence.priceB ?? "—"} · images{" "}
              {item.evidence.mediaCountA}/{item.evidence.mediaCountB}
              {item.evidence.breakdown
                ? ` · loc ${item.evidence.breakdown.location?.toFixed(2) ?? "—"} · area ${item.evidence.breakdown.area?.toFixed(2) ?? "—"} · price ${item.evidence.breakdown.price?.toFixed(2) ?? "—"} · text ${item.evidence.breakdown.text?.toFixed(2) ?? "—"}`
                : ""}
              {item.evidence.latA != null && item.evidence.latB != null
                ? ` · GPS (${item.evidence.latA.toFixed(4)},${item.evidence.lonA?.toFixed(4)}) vs (${item.evidence.latB.toFixed(4)},${item.evidence.lonB?.toFixed(4)})`
                : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => void loadPreview(item.id)}
              >
                Merge preview
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void markNotDup(item.id)}
              >
                Not duplicate
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <section className="space-y-3 rounded-lg border border-[var(--border-default)] p-4">
          <AdminDryRunPreviewPanel
            title="Property merge · dry-run / preview"
            summary="Žádné změny zatím neproběhly. Po potvrzení se secondary archivuje (ne hard-delete)."
            rows={[
              {
                label: "Surviving",
                value: `${preview.surviving.title} (${preview.surviving.id})`,
              },
              {
                label: "Secondary",
                value: `${preview.secondary.title} (${preview.secondary.id})`,
              },
              {
                label: "Fields planned",
                value: String(preview.fieldPreview.length),
              },
            ]}
            warnings={[
              "Vyžaduje reason (≥12) + CONFIRM_ACTION.",
              "Revert je dostupný přes merge event foundation.",
            ]}
          />
          <Field id="preferred" label="Preferred canonical id">
            <select
              id="preferred"
              value={preferred}
              onChange={(e) => {
                setPreferred(e.target.value);
                void loadPreview(preview.candidateId, e.target.value);
              }}
              className="w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
            >
              <option value={preview.surviving.id}>
                {preview.surviving.title} (current surviving)
              </option>
              <option value={preview.secondary.id}>
                {preview.secondary.title} (flip)
              </option>
            </select>
          </Field>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="py-1 pr-2 font-medium">Field</th>
                <th className="py-1 pr-2 font-medium">Chosen</th>
                <th className="py-1 pr-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {preview.fieldPreview.map((f) => (
                <tr key={f.fieldKey} className="border-b border-[var(--border-subtle)]">
                  <td className="py-1 pr-2">{f.fieldKey}</td>
                  <td className="py-1 pr-2 max-w-xs truncate">
                    {String(f.chosenValue ?? "—")}
                  </td>
                  <td className="py-1 pr-2 text-[var(--text-muted)]">{f.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Field id="merge-reason" label="Step-up reason (min. 12) + CONFIRM_ACTION">
            <TextInput
              id="merge-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <Button type="button" disabled={busy} onClick={() => void executeMerge()}>
            Execute non-destructive merge
          </Button>
        </section>
      ) : null}
    </div>
  );
}
