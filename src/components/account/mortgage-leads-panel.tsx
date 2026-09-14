import Link from "next/link";

import { EmptyState } from "@/components/feedback/states";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import type { MortgageLeadListItemDto } from "@/domains/leads/schemas/mortgage-lead";
import { formatCzk, formatDateTime } from "@/lib/format";

function statusTone(
  workflowStatus: string,
): "neutral" | "info" | "success" | "warning" | "error" {
  if (workflowStatus === "APPROVED" || workflowStatus === "CLOSED") return "success";
  if (workflowStatus === "REJECTED") return "error";
  if (workflowStatus === "SUBMISSION_PENDING" || workflowStatus === "DOCUMENTS_NEEDED") {
    return "warning";
  }
  return "info";
}

function MortgageLeadRow({ lead }: { lead: MortgageLeadListItemDto }) {
  return (
    <li>
      <Link
        href={`/ucet/financovani/${lead.correlationId}`}
        className="block rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 transition-colors hover:bg-[var(--background-secondary)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)]">
              {lead.propertyTitle ?? "Požadavek na financování"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {lead.purchasePriceCzk != null
                ? `${formatCzk(lead.purchasePriceCzk)} · `
                : ""}
              aktualizováno {formatDateTime(lead.lastUpdatedAt)}
            </p>
          </div>
          <StatusBadge tone={statusTone(lead.workflowStatus)}>
            {lead.statusLabel}
          </StatusBadge>
        </div>
        <p className="mt-3 text-sm text-[var(--text-secondary)] line-clamp-2">
          {lead.nextStepLabel}
        </p>
      </Link>
    </li>
  );
}

export function MortgageLeadsPanel({ leads }: { leads: MortgageLeadListItemDto[] }) {
  if (leads.length === 0) {
    return (
      <EmptyState
        title="Zatím nemáte požadavek na financování"
        description="Po výslovném souhlasu u kalkulačky nebo u nemovitosti se zde zobrazí stav předání partnerovi."
        action={
          <ButtonLink href="/kalkulacky/financovani" variant="secondary">
            Kalkulačka financování
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {leads.map((lead) => (
          <MortgageLeadRow key={lead.correlationId} lead={lead} />
        ))}
      </ul>
      <Card padding="md" variant="static">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Majetio neposkytuje úvěr ani nerozhoduje o schválení hypotéky. Stavy
          pocházejí od partnera HypotekaJasne.
        </p>
      </Card>
    </div>
  );
}

export function MortgageLeadsCompactList({
  leads,
}: {
  leads: MortgageLeadListItemDto[];
}) {
  if (leads.length === 0) return null;

  return (
    <>
      {leads.map((lead) => (
        <li key={lead.correlationId}>
          <Link
            href={`/ucet/financovani/${lead.correlationId}`}
            className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--background-secondary)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-[var(--text-primary)] truncate">
                {lead.propertyTitle ?? "Financování"}
              </p>
              <StatusBadge tone={statusTone(lead.workflowStatus)}>
                {lead.statusLabel}
              </StatusBadge>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {formatDateTime(lead.lastUpdatedAt)}
            </p>
          </Link>
        </li>
      ))}
    </>
  );
}
