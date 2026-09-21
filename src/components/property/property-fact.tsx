"use client";

import { Check, CircleHelp, Minus } from "lucide-react";

import {
  type FactStatus,
  type VerifyItemStatus,
  VERIFY_LABEL,
} from "@/domains/properties/presentation";

const STATUS_CLASS: Record<FactStatus, string> = {
  known: "pd-fact-known",
  absent: "pd-fact-absent",
  verify: "pd-fact-verify",
  hidden: "",
};

export function PropertyFact({
  label,
  display,
  status,
  tooltip,
}: {
  label: string;
  display: string | null;
  status: FactStatus;
  tooltip?: string;
}) {
  if (status === "hidden" || display == null) return null;

  return (
    <div className={`pd-fact-row ${STATUS_CLASS[status]}`}>
      <dt>{label}</dt>
      <dd>
        <FactStatusMark status={status} label={display} tooltip={tooltip} />
      </dd>
    </div>
  );
}

export function FactStatusMark({
  status,
  label,
  tooltip,
}: {
  status: FactStatus | VerifyItemStatus;
  label: string;
  tooltip?: string;
}) {
  const tip = tooltip ?? (status === "verify" || status === "check_required"
    ? "Tuto informaci zatím nemáme ověřenou."
    : undefined);

  return (
    <span className="pd-status" title={tip}>
      <StatusIcon status={status} />
      <span>{label}</span>
      {tip && (status === "verify" || status === "check_required") ? (
        <span className="pd-status-info" aria-label={tip} title={tip}>
          <CircleHelp aria-hidden className="size-3.5" />
        </span>
      ) : null}
    </span>
  );
}

function StatusIcon({
  status,
}: {
  status: FactStatus | VerifyItemStatus;
}) {
  if (status === "known" || status === "verified") {
    return <Check aria-hidden className="size-3.5 pd-icon-ok" />;
  }
  if (status === "absent" || status === "not_applicable") {
    return <Minus aria-hidden className="size-3.5 pd-icon-absent" />;
  }
  if (status === "issue") {
    return <Minus aria-hidden className="size-3.5 pd-icon-issue" />;
  }
  return <CircleHelp aria-hidden className="size-3.5 pd-icon-verify" />;
}

export function VerifyStatusLabel(status: VerifyItemStatus): string {
  if (status === "verified") return "Ověřeno";
  if (status === "issue") return "Problém";
  if (status === "not_applicable") return "Netýká se";
  return VERIFY_LABEL;
}
