"use client";

import type { MortgageLeadWorkflowStatus } from "@prisma/client";

import Link from "next/link";

import { InlineAlert } from "@/components/feedback/states";
import {
  buildMortgageLeadSubmitConfirmation,
  mortgageLeadFinancingPageHref,
} from "@/domains/leads/service/user-messaging";
import type { HandoffConfirmSuccess } from "@/lib/financing/handoff-actions";

export function MortgageLeadSubmitSuccess({
  result,
}: {
  result: Pick<
    HandoffConfirmSuccess,
    "correlationId" | "isMock" | "pending" | "workflowStatus" | "statusLabel"
  >;
}) {
  const confirmation = buildMortgageLeadSubmitConfirmation({
    pending: result.pending,
    workflowStatus: result.workflowStatus as MortgageLeadWorkflowStatus,
  });

  return (
    <InlineAlert tone="success" title={confirmation.title}>
      {confirmation.body}{" "}
      {result.isMock ? (
        <span className="text-[var(--text-muted)]">(demo prostředí)</span>
      ) : null}{" "}
      Reference: {result.correlationId}.{" "}
      <Link href={mortgageLeadFinancingPageHref(result.correlationId)} className="underline">
        Sledovat stav financování
      </Link>
      {" · "}
      <Link href="/ucet/soukromi" className="underline">
        Souhlasy
      </Link>
      .
    </InlineAlert>
  );
}
