import Link from "next/link";

import { MortgageLeadTimeline } from "@/components/financing/mortgage-lead-timeline";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MortgageLeadDetailDto } from "@/domains/leads/schemas/mortgage-lead";
import { formatCzk, formatDateTime } from "@/lib/format";

function statusTone(
  workflowStatus: string,
): "neutral" | "info" | "success" | "warning" | "error" {
  if (workflowStatus === "APPROVED" || workflowStatus === "CLOSED") return "success";
  if (workflowStatus === "REJECTED") return "error";
  if (workflowStatus === "SUBMISSION_PENDING" || workflowStatus === "DOCUMENTS_NEEDED") {
    return "warning";
  }
  if (
    workflowStatus === "RECEIVED" ||
    workflowStatus === "CONTACTED" ||
    workflowStatus === "QUALIFICATION_IN_PROGRESS"
  ) {
    return "info";
  }
  return "neutral";
}

export function MortgageLeadDetailCard({ lead }: { lead: MortgageLeadDetailDto }) {
  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>
                {lead.propertyTitle ?? "Požadavek na financování"}
              </CardTitle>
              <CardDescription className="mt-1">
                Reference {lead.correlationId}
                {lead.isMock ? " · demo prostředí" : ""}
              </CardDescription>
            </div>
            <StatusBadge tone={statusTone(lead.workflowStatus)}>
              {lead.statusLabel}
            </StatusBadge>
          </div>
        </CardHeader>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {lead.propertySlug ? (
            <div>
              <dt className="text-[var(--text-muted)]">Nemovitost</dt>
              <dd className="font-medium">
                <Link
                  href={`/nemovitosti/${lead.propertySlug}`}
                  className="underline-offset-2 hover:underline"
                >
                  {lead.propertyTitle ?? lead.propertySlug}
                </Link>
              </dd>
            </div>
          ) : null}
          {lead.purchasePriceCzk != null ? (
            <div>
              <dt className="text-[var(--text-muted)]">Požadovaná hypotéka (kontext)</dt>
              <dd className="font-medium font-metric">
                Kupní cena {formatCzk(lead.purchasePriceCzk)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[var(--text-muted)]">Poslední aktualizace</dt>
            <dd className="font-medium">{formatDateTime(lead.lastUpdatedAt)}</dd>
          </div>
          {lead.submittedAt ? (
            <div>
              <dt className="text-[var(--text-muted)]">Odesláno</dt>
              <dd className="font-medium">{formatDateTime(lead.submittedAt)}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--background-secondary)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Další krok
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {lead.nextStepLabel}
          </p>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Průběh</CardTitle>
          <CardDescription>
            Stav odpovídá informacím od partnera HypotekaJasne — nejde o schválení
            hypotéky ze strany Majetio.
          </CardDescription>
        </CardHeader>
        <MortgageLeadTimeline steps={lead.timeline} className="mt-4" />
      </Card>
    </div>
  );
}
