"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import {
  adminModeratePropertyAction,
  adminOverridePropertyFieldAction,
  adminSubmitPropertyForReviewAction,
} from "@/domains/properties/server/admin-actions";
import type { ModerationDecision } from "@/domains/properties/admin/moderation-copy";
import type { AdminCanonicalField } from "@/domains/properties/admin/detail";

export function PropertyOverrideForm({
  propertyId,
  fields,
}: {
  propertyId: string;
  fields: AdminCanonicalField[];
}) {
  const [fieldKey, setFieldKey] = React.useState(fields[0]?.fieldKey ?? "title");
  const [value, setValue] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const result = await adminOverridePropertyFieldAction({
      propertyId,
      fieldKey,
      value,
      reason,
      expiresAt: expiresAt || null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk("Override uložen (Manuálně upraveno).");
    setValue("");
    setReason("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <InlineAlert tone="warning" title="Override">
          {error}
        </InlineAlert>
      ) : null}
      {ok ? (
        <InlineAlert tone="info" title="Hotovo">
          {ok}
        </InlineAlert>
      ) : null}
      <Field id="ov-field" label="Pole">
        <select
          id="ov-field"
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
          className="w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
        >
          {fields.map((f) => (
            <option key={f.fieldKey} value={f.fieldKey}>
              {f.fieldKey}
            </option>
          ))}
        </select>
      </Field>
      <Field id="ov-value" label="Nová kanonická hodnota">
        <TextInput
          id="ov-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </Field>
      <Field id="ov-reason" label="Důvod (min. 8 znaků)">
        <TextInput
          id="ov-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </Field>
      <Field id="ov-exp" label="Expirace override (volitelné)">
        <TextInput
          id="ov-exp"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? "Ukládám…" : "Uložit manual override"}
      </Button>
    </form>
  );
}

export function PropertyModerationPanel({
  propertyId,
  status,
  canModerate,
}: {
  propertyId: string;
  status: string;
  canModerate: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  if (!canModerate) return null;

  async function run(decision: ModerationDecision) {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await adminModeratePropertyAction({
      propertyId,
      decision,
      reason,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.userFacingMessage);
  }

  async function submitReview() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await adminSubmitPropertyForReviewAction({ propertyId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Odesláno ke kontrole (PENDING_REVIEW).");
  }

  return (
    <div className="space-y-3">
      {error ? (
        <InlineAlert tone="warning" title="Moderace">
          {error}
        </InlineAlert>
      ) : null}
      {message ? (
        <InlineAlert tone="info" title="Výsledek">
          {message}
        </InlineAlert>
      ) : null}
      <Field id="mod-reason" label="Moderation reason (povinné u REJECT / SUSPEND / REQUEST_CHANGES)">
        <TextInput
          id="mod-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {(status === "DRAFT" || status === "REJECTED") && (
          <Button type="button" disabled={busy} onClick={() => void submitReview()}>
            Submit for review
          </Button>
        )}
        <Button
          type="button"
          disabled={busy}
          onClick={() => void run("APPROVE")}
        >
          APPROVE
        </Button>
        <Button
          type="button"
          disabled={busy}
          variant="secondary"
          onClick={() => void run("REQUEST_CHANGES")}
        >
          REQUEST_CHANGES
        </Button>
        <Button
          type="button"
          disabled={busy}
          variant="secondary"
          onClick={() => void run("REJECT")}
        >
          REJECT
        </Button>
        <Button
          type="button"
          disabled={busy}
          variant="secondary"
          onClick={() => void run("SUSPEND")}
        >
          SUSPEND
        </Button>
      </div>
    </div>
  );
}
