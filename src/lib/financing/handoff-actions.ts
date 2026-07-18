"use server";

import { ConsentType, LeadStatus, LeadType } from "@prisma/client";
import { z } from "zod";

import { writeAuditLog } from "@/lib/auth/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createHypotekaJasneClient } from "@/integrations/hypotekajasne";
import { track } from "@/lib/analytics/events";
import {
  HYPOTEKAJASNE_RECIPIENT,
  HYPOTEKAJASNE_SHAREABLE_FIELDS,
  consentVersionFor,
  type HypotekaShareFieldKey,
} from "@/lib/privacy/constants";

export type ShareableFieldValue = {
  key: HypotekaShareFieldKey;
  label: string;
  value: string | null;
  included: boolean;
  always: boolean;
};

export type HandoffPreviewData = {
  recipient: typeof HYPOTEKAJASNE_RECIPIENT;
  consentVersion: string;
  fields: ShareableFieldValue[];
};

function formatValue(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return new Intl.NumberFormat("cs-CZ").format(value);
  }
  return String(value);
}

export async function loadHypotekaHandoffPreview(): Promise<
  { ok: true; data: HandoffPreviewData } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };
  const userId = session.user.id;

  const [user, profile, financial, property] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.financialProfile.findUnique({ where: { userId } }),
    prisma.propertyPreference.findUnique({ where: { userId } }),
  ]);

  const values: Record<HypotekaShareFieldKey, string | null> = {
    email: user?.email ?? session.user.email ?? null,
    phone: profile?.phone ?? null,
    maxPriceCzk: formatValue(property?.maxPriceCzk),
    availableEquityCzk: formatValue(financial?.availableEquityCzk),
    financingMode: financial?.financingMode ?? null,
    monthlyIncomeCzk: formatValue(financial?.monthlyIncomeCzk),
    monthlyLiabilitiesCzk: formatValue(financial?.monthlyLiabilitiesCzk),
  };

  const fields: ShareableFieldValue[] = HYPOTEKAJASNE_SHAREABLE_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    value: values[f.key],
    always: f.always,
    included: f.always || Boolean(values[f.key]),
  }));

  return {
    ok: true,
    data: {
      recipient: HYPOTEKAJASNE_RECIPIENT,
      consentVersion: consentVersionFor(ConsentType.HYPOTEKAJASNE_HANDOFF),
      fields,
    },
  };
}

const confirmSchema = z.object({
  explicitConsent: z.literal(true),
  selectedFields: z.array(z.string()).min(1).max(12),
  source: z.string().max(64).default("ucet/financni-profil"),
});

/**
 * Confirms HypotekaJasne handoff ONLY after explicit user consent.
 * Never call this without DataSharingPreview confirmation.
 */
export async function confirmHypotekaJasneHandoff(
  raw: z.input<typeof confirmSchema>,
): Promise<
  | { ok: true; externalLeadId: string; isMock: boolean }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };
  const userId = session.user.id;

  const parsed = confirmSchema.safeParse(raw);
  if (!parsed.success || parsed.data.explicitConsent !== true) {
    return {
      ok: false,
      error: "Bez výslovného souhlasu nelze data předat.",
    };
  }

  const preview = await loadHypotekaHandoffPreview();
  if (!preview.ok) return preview;

  const allowedKeys = new Set(
    preview.data.fields.filter((f) => f.included || f.always).map((f) => f.key),
  );
  const selected = parsed.data.selectedFields.filter((k) =>
    allowedKeys.has(k as HypotekaShareFieldKey),
  );
  if (!selected.includes("email")) {
    return { ok: false, error: "E-mail je pro předání povinný." };
  }

  const [user, profile, financial, property] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.financialProfile.findUnique({ where: { userId } }),
    prisma.propertyPreference.findUnique({ where: { userId } }),
  ]);

  const email = user?.email;
  if (!email) return { ok: false, error: "Účet nemá e-mail." };

  const version = preview.data.consentVersion;
  const sharedLabels = preview.data.fields
    .filter((f) => selected.includes(f.key))
    .map((f) => f.label);

  const payloadNumeric = {
    propertyPriceCzk: selected.includes("maxPriceCzk")
      ? (property?.maxPriceCzk ?? undefined)
      : undefined,
    availableEquityCzk: selected.includes("availableEquityCzk")
      ? (financial?.availableEquityCzk ?? undefined)
      : undefined,
    phone: selected.includes("phone") ? (profile?.phone ?? undefined) : undefined,
    financingMode: selected.includes("financingMode")
      ? (financial?.financingMode ?? undefined)
      : undefined,
    monthlyIncomeCzk: selected.includes("monthlyIncomeCzk")
      ? (financial?.monthlyIncomeCzk ?? undefined)
      : undefined,
    monthlyLiabilitiesCzk: selected.includes("monthlyLiabilitiesCzk")
      ? (financial?.monthlyLiabilitiesCzk ?? undefined)
      : undefined,
  };

  const now = new Date();
  const consent = await prisma.consent.create({
    data: {
      userId,
      type: ConsentType.HYPOTEKAJASNE_HANDOFF,
      granted: true,
      version,
      grantedAt: now,
      metadata: {
        source: parsed.data.source,
        recipient: HYPOTEKAJASNE_RECIPIENT.name,
        purpose: HYPOTEKAJASNE_RECIPIENT.purpose,
        sharedFields: selected,
        sharedFieldLabels: sharedLabels,
      },
    },
  });

  const client = createHypotekaJasneClient();
  const handoff = await client.handoffLead({
    email,
    phone: payloadNumeric.phone,
    propertyPriceCzk: payloadNumeric.propertyPriceCzk,
    consentVersion: version,
    note: [
      payloadNumeric.financingMode
        ? `financingMode=${payloadNumeric.financingMode}`
        : null,
      payloadNumeric.availableEquityCzk != null
        ? `equity=${payloadNumeric.availableEquityCzk}`
        : null,
      payloadNumeric.monthlyIncomeCzk != null
        ? `income=${payloadNumeric.monthlyIncomeCzk}`
        : null,
    ]
      .filter(Boolean)
      .join("; "),
  });

  if (handoff.status !== "accepted") {
    await prisma.consent.update({
      where: { id: consent.id },
      data: { revokedAt: new Date(), granted: false },
    });
    return { ok: false, error: "Partner předání nepřijal. Data nebyla předána." };
  }

  const lead = await prisma.lead.create({
    data: {
      type: LeadType.FINANCING,
      status: LeadStatus.HANDED_OFF,
      userId,
      email,
      phone: payloadNumeric.phone ?? null,
      payload: {
        recipient: HYPOTEKAJASNE_RECIPIENT.name,
        purpose: HYPOTEKAJASNE_RECIPIENT.purpose,
        consentVersion: version,
        consentId: consent.id,
        source: parsed.data.source,
        sharedFields: selected,
        sharedFieldLabels: sharedLabels,
        externalLeadId: handoff.externalLeadId,
        isMock: handoff.isMock,
        ...payloadNumeric,
      },
      activities: {
        create: {
          type: "handoff.confirmed",
          note: "Uživatel výslovně potvrdil předání dat HypotekaJasne.",
          meta: { externalLeadId: handoff.externalLeadId, isMock: handoff.isMock },
        },
      },
    },
  });

  await prisma.consent.update({
    where: { id: consent.id },
    data: {
      metadata: {
        source: parsed.data.source,
        recipient: HYPOTEKAJASNE_RECIPIENT.name,
        purpose: HYPOTEKAJASNE_RECIPIENT.purpose,
        sharedFields: selected,
        sharedFieldLabels: sharedLabels,
        leadId: lead.id,
        externalLeadId: handoff.externalLeadId,
      },
    },
  });

  await writeAuditLog({
    action: "consent.grant",
    entity: "Consent",
    entityId: consent.id,
    actorId: userId,
    meta: {
      type: "HYPOTEKAJASNE_HANDOFF",
      version,
      leadId: lead.id,
      externalLeadId: handoff.externalLeadId,
      sharedFields: selected,
      source: parsed.data.source,
    },
  });

  await writeAuditLog({
    action: "partner.handoff.hypotekajasne",
    entity: "Lead",
    entityId: lead.id,
    actorId: userId,
    meta: {
      externalLeadId: handoff.externalLeadId,
      isMock: handoff.isMock,
    },
  });

  track({
    name: "partner_handoff_confirmed",
    props: {
      partner: "hypotekajasne",
      field_count: selected.length,
      is_mock: handoff.isMock,
    },
  });
  track({
    name: "consent_given",
    props: { type: "HYPOTEKAJASNE_HANDOFF", source: parsed.data.source },
  });

  return {
    ok: true,
    externalLeadId: handoff.externalLeadId,
    isMock: handoff.isMock,
  };
}
