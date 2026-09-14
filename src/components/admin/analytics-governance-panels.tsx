"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { SENSITIVE_CONFIRM_TOKEN } from "@/domains/administration/rbac/permissions";
import {
  adminActivateAssumptionAction,
  adminActivateRenovationCatalogAction,
  adminClearLocationMetricReviewAction,
  adminCreateAssumptionDraftAction,
  adminCreateRenovationCatalogDraftAction,
  adminOverrideValuationAction,
  adminRemapPropertyLocationAction,
  adminResolveMortgageOfferAction,
  adminSetMortgageAutoPublishAction,
  adminSubmitAssumptionAction,
  adminTransitionValuationModelAction,
} from "@/domains/analytics/server/admin-actions";
import type { ModelLifecycleStatus } from "@/domains/valuation/admin/metrics";

export function ValuationModelActions({
  modelId,
  canWrite,
  canApprove,
}: {
  modelId: string;
  canWrite: boolean;
  canApprove: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function go(nextStatus: ModelLifecycleStatus) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const result = await adminTransitionValuationModelAction({
      modelId,
      nextStatus,
      reason,
      confirmToken: SENSITIVE_CONFIRM_TOKEN,
    });
    setBusy(false);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setMsg(`Model → ${nextStatus}`);
  }

  if (!canWrite && !canApprove) return null;

  return (
    <div className="space-y-2">
      {err ? <InlineAlert tone="warning" title="Model">{err}</InlineAlert> : null}
      {msg ? <InlineAlert tone="info" title="OK">{msg}</InlineAlert> : null}
      <Field id={`m-r-${modelId}`} label="Reason (+ CONFIRM_ACTION pro APPROVED/ACTIVE)">
        <TextInput
          id={`m-r-${modelId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void go("TESTING")}
          >
            → TESTING
          </Button>
        ) : null}
        {canApprove ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void go("APPROVED")}
            >
              → APPROVED
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void go("ACTIVE")}
            >
              → ACTIVE
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ValuationOverrideForm({
  valuationId,
  currentValue,
  canWrite,
}: {
  valuationId: string;
  currentValue: number | null;
  canWrite: boolean;
}) {
  const [value, setValue] = React.useState(String(currentValue ?? ""));
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  if (!canWrite) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    const result = await adminOverrideValuationAction({
      valuationId,
      estimatedValue: Number(value),
      reason,
    });
    setBusy(false);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setOk("Override uložen + audit.");
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {err ? <InlineAlert tone="warning" title="Override">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <Field id={`ov-${valuationId}`} label="Nová valuace">
        <TextInput
          id={`ov-${valuationId}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Field>
      <Field id={`ovr-${valuationId}`} label="Důvod (povinný audit)">
        <TextInput
          id={`ovr-${valuationId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <Button type="submit" size="sm" disabled={busy}>
        Uložit override
      </Button>
    </form>
  );
}

export function AssumptionDraftForm({ canWrite }: { canWrite: boolean }) {
  const [versionKey, setVersionKey] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [changeReason, setChangeReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  if (!canWrite) return null;

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void (async () => {
          setErr(null);
          setOk(null);
          const result = await adminCreateAssumptionDraftAction({
            versionKey,
            label,
            changeReason,
          });
          if (!result.ok) {
            setErr(result.error);
            return;
          }
          setOk(`Draft ${result.id}`);
        })();
      }}
    >
      {err ? <InlineAlert tone="warning" title="Assumptions">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <Field id="ak" label="versionKey">
        <TextInput id="ak" value={versionKey} onChange={(e) => setVersionKey(e.target.value)} />
      </Field>
      <Field id="al" label="Label">
        <TextInput id="al" value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field id="ar" label="Change reason">
        <TextInput
          id="ar"
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
        />
      </Field>
      <Button type="submit" size="sm">
        Create DRAFT version
      </Button>
    </form>
  );
}

export function AssumptionVersionActions({
  versionId,
  canWrite,
  canApprove,
}: {
  versionId: string;
  canWrite: boolean;
  canApprove: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  return (
    <div className="space-y-2">
      {err ? <InlineAlert tone="warning" title="Assumptions">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      {canWrite ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            void adminSubmitAssumptionAction({ versionId }).then((r) => {
              if (!r.ok) setErr(r.error);
              else setOk("PENDING_APPROVAL");
            })
          }
        >
          Submit for approval
        </Button>
      ) : null}
      {canApprove ? (
        <>
          <Field id={`apr-${versionId}`} label="Approve reason + CONFIRM_ACTION">
            <TextInput
              id={`apr-${versionId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              void adminActivateAssumptionAction({
                versionId,
                reason,
                confirmToken: SENSITIVE_CONFIRM_TOKEN,
              }).then((r) => {
                if (!r.ok) setErr(r.error);
                else setOk("ACTIVE");
              })
            }
          >
            Approve & activate
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function RenovationCatalogDraftForm({ canWrite }: { canWrite: boolean }) {
  const [versionKey, setVersionKey] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [changeReason, setChangeReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  if (!canWrite) return null;
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void adminCreateRenovationCatalogDraftAction({
          versionKey,
          label,
          changeReason,
        }).then((r) => {
          if (!r.ok) setErr(r.error);
          else setOk(`Draft OK · anomalies ${r.anomalyCount}`);
        });
      }}
    >
      {err ? <InlineAlert tone="warning" title="Catalog">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <Field id="rk" label="versionKey">
        <TextInput id="rk" value={versionKey} onChange={(e) => setVersionKey(e.target.value)} />
      </Field>
      <Field id="rl" label="Label">
        <TextInput id="rl" value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field id="rr" label="Change reason">
        <TextInput
          id="rr"
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
        />
      </Field>
      <Button type="submit" size="sm">
        Create catalog DRAFT
      </Button>
    </form>
  );
}

export function RenovationCatalogActivate({
  versionId,
  canApprove,
  hasAnomalies,
}: {
  versionId: string;
  canApprove: boolean;
  hasAnomalies: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [force, setForce] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  if (!canApprove) return null;
  return (
    <div className="space-y-2">
      {err ? <InlineAlert tone="warning" title="Catalog">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <Field id={`rca-${versionId}`} label="Approve reason">
        <TextInput
          id={`rca-${versionId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      {hasAnomalies ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />
          Force despite 300%+ price jumps
        </label>
      ) : null}
      <Button
        type="button"
        size="sm"
        onClick={() =>
          void adminActivateRenovationCatalogAction({
            versionId,
            reason,
            confirmToken: SENSITIVE_CONFIRM_TOKEN,
            forceDespiteAnomalies: force,
          }).then((r) => {
            if (!r.ok) setErr(r.error);
            else setOk("ACTIVE");
          })
        }
      >
        Approve & activate
      </Button>
    </div>
  );
}

export function LocationOpsForms({ canWrite }: { canWrite: boolean }) {
  const [metricId, setMetricId] = React.useState("");
  const [metricReason, setMetricReason] = React.useState("");
  const [propertyId, setPropertyId] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [remapReason, setRemapReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  if (!canWrite) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {err ? <InlineAlert tone="warning" title="Lokality">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void adminClearLocationMetricReviewAction({
            metricId,
            reason: metricReason,
          }).then((r) => {
            if (!r.ok) setErr(r.error);
            else setOk("Review cleared");
          });
        }}
      >
        <h3 className="font-medium">Clear metric review</h3>
        <Field id="mid" label="metricId">
          <TextInput id="mid" value={metricId} onChange={(e) => setMetricId(e.target.value)} />
        </Field>
        <Field id="mr" label="Reason">
          <TextInput
            id="mr"
            value={metricReason}
            onChange={(e) => setMetricReason(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm">
          Clear reviewRequired
        </Button>
      </form>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void adminRemapPropertyLocationAction({
            propertyId,
            locationId,
            reason: remapReason,
          }).then((r) => {
            if (!r.ok) setErr(r.error);
            else setOk("Property remapped");
          });
        }}
      >
        <h3 className="font-medium">Fix property mapping</h3>
        <Field id="pid" label="propertyId">
          <TextInput
            id="pid"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          />
        </Field>
        <Field id="lid" label="locationId">
          <TextInput
            id="lid"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          />
        </Field>
        <Field id="pr" label="Reason">
          <TextInput
            id="pr"
            value={remapReason}
            onChange={(e) => setRemapReason(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm">
          Remap
        </Button>
      </form>
    </div>
  );
}

export function MortgageOpsPanel({
  autoPublishEnabled,
  canApprove,
  canWrite,
  reviewQueue,
}: {
  autoPublishEnabled: boolean;
  canApprove: boolean;
  canWrite: boolean;
  reviewQueue: Array<{
    id: string;
    bankName: string | null;
    productName: string | null;
    interestRateFrom: number | null;
  }>;
}) {
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      {err ? <InlineAlert tone="warning" title="Hypotéka">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <p className="text-sm">
        Auto-publish:{" "}
        <strong>{autoPublishEnabled ? "ENABLED" : "BLOCKED"}</strong>
      </p>
      {canApprove ? (
        <div className="space-y-2">
          <Field id="mblock" label="Reason">
            <TextInput
              id="mblock"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                void adminSetMortgageAutoPublishAction({
                  enabled: false,
                  reason,
                }).then((r) => {
                  if (!r.ok) setErr(r.error);
                  else setOk("Auto-publish blocked");
                })
              }
            >
              Block auto-publish
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                void adminSetMortgageAutoPublishAction({
                  enabled: true,
                  reason: reason || "Re-enabled after review",
                }).then((r) => {
                  if (!r.ok) setErr(r.error);
                  else setOk("Auto-publish enabled");
                })
              }
            >
              Enable auto-publish
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="space-y-3">
        {reviewQueue.map((o) => (
          <li
            key={o.id}
            className="rounded border border-[var(--border-default)] px-3 py-2 text-sm"
          >
            <p className="font-medium">
              {o.bankName} · {o.productName} · {o.interestRateFrom ?? "—"}%
            </p>
            {canWrite ? (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void adminResolveMortgageOfferAction({
                      offerId: o.id,
                      decision: "APPROVE",
                      reason: reason || "Manual review approve",
                    }).then((r) => {
                      if (!r.ok) setErr(r.error);
                      else setOk(`Approved ${o.id}`);
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    void adminResolveMortgageOfferAction({
                      offerId: o.id,
                      decision: "REJECT",
                      reason: reason || "Manual review reject",
                    }).then((r) => {
                      if (!r.ok) setErr(r.error);
                      else setOk(`Rejected ${o.id}`);
                    })
                  }
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
