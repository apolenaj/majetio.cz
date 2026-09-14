/**
 * Transactional notifications for mortgage lead status changes.
 * No financial PII in message bodies — status label + link only.
 */

import { prisma } from "@/lib/db";
import {
  logEmailInDev,
  mortgageLeadStatusUpdatedEmail,
} from "@/lib/email/templates";

export async function notifyMortgageLeadStatusChange(input: {
  leadId: string;
  correlationId: string;
  statusLabel: string;
  previousStatusLabel?: string;
}): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: {
      userId: true,
      user: { select: { email: true } },
    },
  });

  if (!lead?.userId || !lead.user?.email) return;

  const detailUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://majetio.cz"}/ucet/financovani/${input.correlationId}`;
  const template = mortgageLeadStatusUpdatedEmail({
    statusLabel: input.statusLabel,
    previousStatusLabel: input.previousStatusLabel,
    detailUrl,
  });

  // Foundation only — wire to email provider in production infra.
  logEmailInDev(template, lead.user.email);

  await prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: "mortgage_lead.notification_queued",
      note: "Transakční notifikace o změně stavu financování.",
      meta: {
        correlationId: input.correlationId,
        statusLabel: input.statusLabel,
        channel: "email",
      },
    },
  });
}
