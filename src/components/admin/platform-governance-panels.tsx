"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { SENSITIVE_CONFIRM_TOKEN } from "@/domains/administration/rbac/permissions";
import {
  adminCreateCmsContentAction,
  adminEmergencyPauseMarketAction,
  adminOpenIncidentAction,
  adminSetFeatureFlagAction,
  adminSetMarketLaunchAction,
  adminTransitionCmsAction,
  adminUpdateIncidentAction,
  adminUpsertConfigAction,
} from "@/domains/platform/server/admin-actions";

export function FeatureFlagToggleRow(props: {
  flagId: string;
  flagKey: string;
  enabled: boolean;
  isKillSwitch: boolean;
  description: string | null;
  canWrite: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    setBusy(true);
    setErr(null);
    const result = await adminSetFeatureFlagAction({
      flagId: props.flagId,
      enabled: !props.enabled,
      reason: reason || `${props.isKillSwitch ? "kill" : "flag"} ${props.flagKey}`,
      confirmToken: SENSITIVE_CONFIRM_TOKEN,
    });
    setBusy(false);
    if (!result.ok) setErr(result.error);
    else window.location.reload();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] py-2 text-sm">
      <div>
        <p className="font-medium">
          {props.isKillSwitch ? "[KILL] " : ""}
          <code>{props.flagKey}</code>
        </p>
        {props.description ? (
          <p className="text-xs text-[var(--text-muted)]">{props.description}</p>
        ) : null}
        {err ? <p className="text-xs text-[var(--status-warning)]">{err}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={
            props.enabled
              ? "text-[var(--status-warning)]"
              : "text-[var(--text-muted)]"
          }
        >
          {props.enabled ? "ON" : "OFF"}
        </span>
        {props.canWrite ? (
          <>
            <TextInput
              id={`r-${props.flagId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="reason"
              className="w-40"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void toggle()}
            >
              Toggle
            </Button>
          </>
        ) : null}
      </div>
    </li>
  );
}

export function ConfigUpsertForm({ canWrite }: { canWrite: boolean }) {
  const [key, setKey] = React.useState("limits.max_compare_items");
  const [value, setValue] = React.useState("10");
  const [reason, setReason] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  if (!canWrite) return null;

  return (
    <div className="space-y-2 rounded-lg border border-[var(--border-default)] p-4">
      <h3 className="font-display text-base">Upsert business limit</h3>
      <Field id="ck" label="Key">
        <TextInput id="ck" value={key} onChange={(e) => setKey(e.target.value)} />
      </Field>
      <Field id="cv" label="Value (number or JSON)">
        <TextInput
          id="cv"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Field>
      <Field id="cr" label="Reason">
        <TextInput
          id="cr"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      {msg ? <InlineAlert tone="info" title="Config">{msg}</InlineAlert> : null}
      <Button
        type="button"
        size="sm"
        onClick={() => {
          void (async () => {
            let parsed: unknown = value;
            try {
              parsed = JSON.parse(value);
            } catch {
              const n = Number(value);
              parsed = Number.isFinite(n) ? n : value;
            }
            const r = await adminUpsertConfigAction({
              key,
              value: parsed,
              reason,
            });
            setMsg(r.ok ? "Saved" : r.error);
            if (r.ok) window.location.reload();
          })();
        }}
      >
        Uložit
      </Button>
    </div>
  );
}

export function CmsCreateForm({ canWrite }: { canWrite: boolean }) {
  const [slug, setSlug] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  if (!canWrite) return null;
  return (
    <div className="space-y-2 rounded-lg border border-[var(--border-default)] p-4">
      <h3 className="font-display text-base">Nový obsah (DRAFT)</h3>
      <Field id="s" label="Slug">
        <TextInput id="s" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </Field>
      <Field id="t" label="Title">
        <TextInput id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field id="b" label="Body (markdown)">
        <TextInput id="b" value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      {err ? <InlineAlert tone="warning" title="CMS">{err}</InlineAlert> : null}
      <Button
        type="button"
        size="sm"
        onClick={() => {
          void adminCreateCmsContentAction({
            slug,
            kind: "GUIDE",
            title,
            bodyMarkdown: body,
          }).then((r) => {
            if (!r.ok) setErr(r.error);
            else window.location.reload();
          });
        }}
      >
        Vytvořit draft
      </Button>
    </div>
  );
}

export function CmsTransitionButtons(props: {
  contentId: string;
  status: string;
  canWrite: boolean;
  canPublish: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  if (!props.canWrite && !props.canPublish) return null;

  async function go(next: "DRAFT" | "REVIEW" | "PUBLISHED") {
    const r = await adminTransitionCmsAction({
      contentId: props.contentId,
      nextStatus: next,
      reason: reason || `transition to ${next}`,
      confirmToken: SENSITIVE_CONFIRM_TOKEN,
    });
    if (!r.ok) setErr(r.error);
    else window.location.reload();
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      <TextInput
        id={`cms-r-${props.contentId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="reason"
        className="w-36"
      />
      {props.canWrite && props.status !== "REVIEW" ? (
        <Button type="button" size="sm" variant="secondary" onClick={() => void go("REVIEW")}>
          → REVIEW
        </Button>
      ) : null}
      {props.canPublish && props.status === "REVIEW" ? (
        <Button type="button" size="sm" onClick={() => void go("PUBLISHED")}>
          → PUBLISHED
        </Button>
      ) : null}
      {err ? <span className="text-[var(--status-warning)]">{err}</span> : null}
    </div>
  );
}

export function IncidentOpenForm({ canWrite }: { canWrite: boolean }) {
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  if (!canWrite) return null;
  return (
    <div className="space-y-2 rounded-lg border border-[var(--border-default)] p-4">
      <h3 className="font-display text-base">Otevřít incident</h3>
      <Field id="it" label="Title">
        <TextInput id="it" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field id="is" label="Summary">
        <TextInput
          id="is"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </Field>
      {err ? <InlineAlert tone="warning" title="Incident">{err}</InlineAlert> : null}
      <Button
        type="button"
        size="sm"
        onClick={() => {
          void adminOpenIncidentAction({
            title,
            summary,
            category: "AVAILABILITY",
            severity: "HIGH",
          }).then((r) => {
            if (!r.ok) setErr(r.error);
            else window.location.reload();
          });
        }}
      >
        Open
      </Button>
    </div>
  );
}

export function IncidentStatusButtons(props: {
  incidentId: string;
  canWrite: boolean;
}) {
  const [reason, setReason] = React.useState("");
  if (!props.canWrite) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2 text-xs">
      <TextInput
        id={`inc-r-${props.incidentId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="reason"
        className="w-32"
      />
      {(
        ["INVESTIGATING", "MITIGATED", "RESOLVED"] as const
      ).map((st) => (
        <Button
          key={st}
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            void adminUpdateIncidentAction({
              incidentId: props.incidentId,
              status: st,
              reason: reason || `status ${st}`,
            }).then(() => window.location.reload());
          }}
        >
          {st}
        </Button>
      ))}
    </div>
  );
}

export function MarketLaunchControls(props: {
  marketCode: string;
  canGoLive: boolean;
  launchStatus: string;
}) {
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  return (
    <div className="mt-1 flex flex-col gap-1 text-xs">
      <TextInput
        id={`ml-${props.marketCode}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="reason (≥12)"
        className="w-40"
      />
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          disabled={!props.canGoLive}
          onClick={() => {
            void adminSetMarketLaunchAction({
              marketCode: props.marketCode,
              nextStatus: "LIVE",
              reason: reason || "Launch market to LIVE after readiness",
              confirmToken: SENSITIVE_CONFIRM_TOKEN,
            }).then((r) => {
              if (!r.ok) setErr(r.error);
              else window.location.reload();
            });
          }}
        >
          Go LIVE
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            void adminEmergencyPauseMarketAction({
              marketCode: props.marketCode,
              reason: reason || "Emergency market pause",
              confirmToken: SENSITIVE_CONFIRM_TOKEN,
            }).then((r) => {
              if (!r.ok) setErr(r.error);
              else window.location.reload();
            });
          }}
        >
          PAUSED
        </Button>
      </div>
      {err ? <span className="text-[var(--status-warning)]">{err}</span> : null}
    </div>
  );
}
