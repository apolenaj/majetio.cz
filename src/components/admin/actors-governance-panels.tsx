"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { SENSITIVE_CONFIRM_TOKEN } from "@/domains/administration/rbac/permissions";
import {
  adminAccessOrgDocAction,
  adminActivatePricingPlanAction,
  adminAssignLeadAction,
  adminCreatePricingDraftAction,
  adminDecideOrgKycAction,
  adminEndImpersonationAction,
  adminMarkDeletionRequestedAction,
  adminRegisterOrgDocAction,
  adminRevealFinancialPassportAction,
  adminStartImpersonationAction,
  adminSuspendUserAction,
  adminUnsuspendUserAction,
} from "@/domains/actors/server/admin-actions";

export function ImpersonationBanner({
  targetEmail,
}: {
  targetEmail: string | null | undefined;
}) {
  const [err, setErr] = React.useState<string | null>(null);
  return (
    <div className="border-b border-[var(--status-warning)] bg-[color-mix(in_srgb,var(--status-warning)_18%,transparent)] px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p>
          <strong>IMPERSONACE AKTIVNÍ</strong>
          {targetEmail ? ` · ${targetEmail}` : ""}. Platební akce jsou
          zakázané. Vše se audituje.
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            void adminEndImpersonationAction().then((r) => {
              if (!r.ok) setErr(r.error);
              else window.location.reload();
            })
          }
        >
          Ukončit impersonaci
        </Button>
      </div>
      {err ? <p className="mt-1 text-xs">{err}</p> : null}
    </div>
  );
}

export function UserLifecyclePanel({
  userId,
  canSuspend,
  canImpersonate,
  canRevealPassport,
}: {
  userId: string;
  canSuspend: boolean;
  canImpersonate: boolean;
  canRevealPassport: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [passport, setPassport] = React.useState<Record<string, unknown> | null>(
    null,
  );

  return (
    <div className="space-y-3">
      {err ? <InlineAlert tone="warning" title="User">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <Field id="ur" label="Reason (suspend / impersonate / passport)">
        <TextInput id="ur" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {canSuspend ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                void adminSuspendUserAction({ userId, reason }).then((r) => {
                  if (!r.ok) setErr(r.error);
                  else setOk("SUSPENDED");
                })
              }
            >
              Suspend
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                void adminUnsuspendUserAction({ userId, reason }).then((r) => {
                  if (!r.ok) setErr(r.error);
                  else setOk("ACTIVE");
                })
              }
            >
              Unsuspend
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                void adminMarkDeletionRequestedAction({ userId, reason }).then(
                  (r) => {
                    if (!r.ok) setErr(r.error);
                    else setOk("DELETION_REQUESTED");
                  },
                )
              }
            >
              Mark deletion requested
            </Button>
          </>
        ) : null}
        {canImpersonate ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              void adminStartImpersonationAction({
                targetUserId: userId,
                reason,
                confirmToken: SENSITIVE_CONFIRM_TOKEN,
              }).then((r) => {
                if (!r.ok) setErr(r.error);
                else {
                  setOk("Impersonation started");
                  window.location.href = "/ucet";
                }
              })
            }
          >
            Start impersonation
          </Button>
        ) : null}
        {canRevealPassport ? (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              void adminRevealFinancialPassportAction({
                userId,
                reason,
                confirmToken: SENSITIVE_CONFIRM_TOKEN,
              }).then((r) => {
                if (!r.ok) {
                  setErr(r.error);
                  return;
                }
                setPassport(r.financialPassport as Record<string, unknown>);
                setOk("Passport revealed (audited)");
              })
            }
          >
            Reveal Financial Passport
          </Button>
        ) : null}
      </div>
      {passport ? (
        <pre className="overflow-x-auto rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-3 text-xs">
          {JSON.stringify(passport, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function OrgKycPanel({
  organizationId,
  canVerify,
}: {
  organizationId: string;
  canVerify: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [storageKey, setStorageKey] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  if (!canVerify) return null;
  return (
    <div className="space-y-3">
      {err ? <InlineAlert tone="warning" title="KYC">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      <p className="text-xs text-[var(--text-muted)]">
        Agent/org verification — oddělené od listing verification na Property.
      </p>
      <Field id="kr" label="Decision reason">
        <TextInput id="kr" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {(["VERIFIED", "REJECTED", "PENDING"] as const).map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            variant={d === "VERIFIED" ? "primary" : "secondary"}
            onClick={() =>
              void adminDecideOrgKycAction({
                organizationId,
                decision: d,
                reason,
              }).then((r) => {
                if (!r.ok) setErr(r.error);
                else setOk(d);
              })
            }
          >
            {d}
          </Button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field id="sk" label="Doc storageKey (protected)">
          <TextInput
            id="sk"
            value={storageKey}
            onChange={(e) => setStorageKey(e.target.value)}
          />
        </Field>
        <Field id="fn" label="fileName">
          <TextInput
            id="fn"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </Field>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() =>
          void adminRegisterOrgDocAction({
            organizationId,
            storageKey,
            fileName,
            contentType: "application/pdf",
          }).then((r) => {
            if (!r.ok) setErr(r.error);
            else setOk(`Doc ${r.id}`);
          })
        }
      >
        Register protected document
      </Button>
    </div>
  );
}

export function OrgDocAccessButton({
  documentId,
  canVerify,
}: {
  documentId: string;
  canVerify: boolean;
}) {
  const [msg, setMsg] = React.useState<string | null>(null);
  if (!canVerify) return null;
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() =>
        void adminAccessOrgDocAction({ documentId }).then((r) => {
          if (!r.ok) setMsg(r.error);
          else setMsg(`Access audited · key ${r.storageKey}`);
        })
      }
    >
      Access (audited)
      {msg ? ` — ${msg}` : ""}
    </Button>
  );
}

export function LeadAssignForm({
  leadId,
  canWrite,
}: {
  leadId: string;
  canWrite: boolean;
}) {
  const [assigneeUserId, setAssigneeUserId] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  if (!canWrite) return null;
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void adminAssignLeadAction({ leadId, assigneeUserId }).then((r) => {
          if (!r.ok) setErr(r.error);
          else setOk("Assigned");
        });
      }}
    >
      {err ? <span className="text-xs text-[var(--status-danger)]">{err}</span> : null}
      {ok ? <span className="text-xs">{ok}</span> : null}
      <Field id={`as-${leadId}`} label="assigneeUserId">
        <TextInput
          id={`as-${leadId}`}
          value={assigneeUserId}
          onChange={(e) => setAssigneeUserId(e.target.value)}
        />
      </Field>
      <Button type="submit" size="sm">
        Assign
      </Button>
    </form>
  );
}

export function PricingGovernanceForms({
  canWrite,
  canApprove,
  draftPlanId,
}: {
  canWrite: boolean;
  canApprove: boolean;
  draftPlanId?: string;
}) {
  const [key, setKey] = React.useState("basic_analysis");
  const [versionKey, setVersionKey] = React.useState("");
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("49900");
  const [changeReason, setChangeReason] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState(
    new Date().toISOString().slice(0, 16),
  );
  const [approveReason, setApproveReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      {err ? <InlineAlert tone="warning" title="Pricing">{err}</InlineAlert> : null}
      {ok ? <InlineAlert tone="info" title="OK">{ok}</InlineAlert> : null}
      {canWrite ? (
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void adminCreatePricingDraftAction({
              key,
              versionKey,
              name,
              priceGrossMinor: Number(price),
              changeReason,
              effectiveFrom,
            }).then((r) => {
              if (!r.ok) setErr(r.error);
              else setOk(`Draft ${r.id}`);
            });
          }}
        >
          <Field id="pk" label="key">
            <TextInput id="pk" value={key} onChange={(e) => setKey(e.target.value)} />
          </Field>
          <Field id="pv" label="versionKey">
            <TextInput
              id="pv"
              value={versionKey}
              onChange={(e) => setVersionKey(e.target.value)}
            />
          </Field>
          <Field id="pn" label="name">
            <TextInput id="pn" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="pp" label="priceGrossMinor">
            <TextInput id="pp" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field id="pe" label="effectiveFrom">
            <TextInput
              id="pe"
              type="datetime-local"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </Field>
          <Field id="pr" label="changeReason">
            <TextInput
              id="pr"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
            />
          </Field>
          <Button type="submit" size="sm" className="sm:col-span-2">
            Create DRAFT version
          </Button>
        </form>
      ) : null}
      {canApprove && draftPlanId ? (
        <div className="space-y-2">
          <Field id="pa" label="Approve reason + CONFIRM_ACTION">
            <TextInput
              id="pa"
              value={approveReason}
              onChange={(e) => setApproveReason(e.target.value)}
            />
          </Field>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              void adminActivatePricingPlanAction({
                planId: draftPlanId,
                reason: approveReason,
                confirmToken: SENSITIVE_CONFIRM_TOKEN,
              }).then((r) => {
                if (!r.ok) setErr(r.error);
                else setOk("ACTIVE");
              })
            }
          >
            Approve & activate draft
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-[var(--text-muted)]">
        Platební status SUCCEEDED nelze přepsat ručně — jen provider reconcile.
      </p>
    </div>
  );
}
