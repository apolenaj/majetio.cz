"use server";

import { ConsentType } from "@prisma/client";
import { z } from "zod";

import { writeAuditLog } from "@/lib/auth/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { track } from "@/lib/analytics/events";
import {
  HYPOTEKAJASNE_RECIPIENT,
  consentVersionFor,
} from "@/lib/privacy/constants";
import { persistConsentRecord } from "@/domains/privacy/consent-records-service";
import {
  MORTGAGE_LEAD_CONSENT_TEXT_VERSION,
  MORTGAGE_LEAD_CONSENT_TYPE,
  MORTGAGE_LEAD_EXCLUDED_CATEGORIES,
  MORTGAGE_LEAD_SHAREABLE_FIELDS,
  type MortgageLeadShareFieldKey,
  type MortgageLeadConsentReceipt,
} from "@/lib/privacy/mortgage-lead-transfer";
import {
  mortgageLeadService,
  mortgageLeadStatusLabel,
  type MortgageLeadDuplicateInfo,
  type MortgageLeadStatusDto,
} from "@/domains/leads";
import {
  sanitizeMortgageLeadAuditMeta,
  toAuditJson,
} from "@/domains/leads/service/privacy-guards";

export type ShareableFieldValue = {
  key: MortgageLeadShareFieldKey;
  label: string;
  value: string | null;
  included: boolean;
  always: boolean;
  category: "contact" | "property" | "financial";
};

export type HandoffContext = {
  analysisId?: string;
  propertyId?: string;
  propertySlug?: string;
  propertyTitle?: string;
  purchasePriceCzk?: number;
  valuationCzk?: number | null;
  requestedLoanCzk?: number | null;
  ltvOnAskingPricePct?: number | null;
  nominalInterestRatePp?: number | null;
  aprPp?: number | null;
  termYears?: number | null;
  estimatedMonthlyPaymentCzk?: number | null;
};

export type GuestHandoffContact = {
  email: string;
  phone?: string | null;
  name?: string | null;
};

export type HandoffPreviewData = {
  recipient: typeof HYPOTEKAJASNE_RECIPIENT;
  consentType: typeof MORTGAGE_LEAD_CONSENT_TYPE;
  consentVersion: string;
  consentTextVersion: string;
  fields: ShareableFieldValue[];
  excludedCategories: readonly string[];
  contextSummary: string | null;
  existingActiveLead: MortgageLeadDuplicateInfo | null;
};

export type HandoffConfirmSuccess = {
  externalLeadId: string;
  isMock: boolean;
  consentId: string;
  correlationId: string;
  statusLabel: string;
  pending: boolean;
  workflowStatus: string;
};

const handoffContextSchema = z
  .object({
    analysisId: z.string().max(128).optional(),
    propertyId: z.string().max(128).optional(),
    propertySlug: z.string().max(128).optional(),
    propertyTitle: z.string().max(256).optional(),
    purchasePriceCzk: z.number().int().positive().optional(),
    valuationCzk: z.number().int().positive().nullish(),
    requestedLoanCzk: z.number().int().nonnegative().nullish(),
    ltvOnAskingPricePct: z.number().min(0).max(100).nullish(),
    nominalInterestRatePp: z.number().min(0).max(30).nullish(),
    aprPp: z.number().min(0).max(30).nullish(),
    termYears: z.number().int().min(1).max(40).nullish(),
    estimatedMonthlyPaymentCzk: z.number().int().nonnegative().nullish(),
  })
  .optional();

const guestContactSchema = z.object({
  email: z.string().email().max(254),
  phone: z.string().max(32).optional().nullable(),
  name: z.string().max(120).optional().nullable(),
});

const confirmSchema = z.object({
  explicitConsent: z.literal(true),
  selectedFields: z.array(z.string()).min(1).max(12),
  source: z.string().max(128).default("kalkulacky/financovani"),
  handoffContext: handoffContextSchema,
  guestContact: guestContactSchema.optional(),
});

function formatValue(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return new Intl.NumberFormat("cs-CZ").format(value);
  }
  return String(value);
}

function buildFieldValues(
  user: { email: string | null; name: string | null } | null,
  profile: { phone: string | null } | null,
  financial: {
    availableEquityCzk: number | null;
    monthlyIncomeCzk: number | null;
    monthlyLiabilitiesCzk: number | null;
  } | null,
  context: HandoffContext | undefined,
  sessionEmail: string | null | undefined,
): Record<MortgageLeadShareFieldKey, string | null> {
  const propertyRef =
    context?.propertySlug != null
      ? `Nemovitost ${context.propertySlug}`
      : context?.analysisId != null
        ? `Analýza (ref. ${context.analysisId.slice(-8)})`
        : context?.propertyId != null
          ? `Nemovitost (ref. ${context.propertyId.slice(-8)})`
          : null;

  return {
    email: user?.email ?? sessionEmail ?? null,
    name: user?.name ?? null,
    phone: profile?.phone ?? null,
    propertyReference: propertyRef,
    purchasePriceCzk:
      context?.purchasePriceCzk != null
        ? formatValue(context.purchasePriceCzk)
        : null,
    availableEquityCzk: formatValue(financial?.availableEquityCzk),
    monthlyIncomeCzk: formatValue(financial?.monthlyIncomeCzk),
    monthlyLiabilitiesCzk: formatValue(financial?.monthlyLiabilitiesCzk),
  };
}

function buildContextSummary(context: HandoffContext | undefined): string | null {
  if (!context) return null;
  const parts: string[] = [];
  if (context.analysisId) parts.push(`Analýza: ${context.analysisId.slice(-8)}`);
  if (context.propertySlug) parts.push(`Nemovitost: ${context.propertySlug}`);
  else if (context.propertyId) parts.push("Nemovitost (ref.)");
  if (context.purchasePriceCzk != null) {
    parts.push(
      `Kupní cena ze scénáře: ${formatValue(context.purchasePriceCzk)} Kč`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function parseContext(
  raw: z.input<typeof handoffContextSchema> | undefined,
): HandoffContext | undefined {
  const parsed = handoffContextSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export async function checkMortgageLeadDuplicate(
  rawContext?: z.input<typeof handoffContextSchema>,
): Promise<
  | { ok: true; duplicate: MortgageLeadDuplicateInfo | null }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };

  const context = parseContext(rawContext);
  const duplicate = await mortgageLeadService.findActiveDuplicate({
    userId: session.user.id,
    propertyId: context?.propertyId,
    analysisId: context?.analysisId,
  });

  return { ok: true, duplicate };
}

export async function getMortgageLeadStatus(
  correlationId: string,
): Promise<
  | { ok: true; data: MortgageLeadStatusDto }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };

  const result = await mortgageLeadService.getLeadStatusForUser({
    userId: session.user.id,
    correlationId,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

export async function loadHypotekaHandoffPreview(
  rawContext?: z.input<typeof handoffContextSchema>,
): Promise<{ ok: true; data: HandoffPreviewData } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };
  const userId = session.user.id;
  const context = parseContext(rawContext);

  const [user, profile, financial, duplicateResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.financialProfile.findUnique({ where: { userId } }),
    mortgageLeadService.findActiveDuplicate({
      userId,
      propertyId: context?.propertyId,
      analysisId: context?.analysisId,
    }),
  ]);

  const values = buildFieldValues(user, profile, financial, context, session.user.email);

  const fields: ShareableFieldValue[] = MORTGAGE_LEAD_SHAREABLE_FIELDS.map(
    (field) => ({
      key: field.key,
      label: field.label,
      value: values[field.key],
      always: field.always,
      category: field.category,
      included:
        field.always ? true : field.defaultIncluded && Boolean(values[field.key]),
    }),
  );

  return {
    ok: true,
    data: {
      recipient: HYPOTEKAJASNE_RECIPIENT,
      consentType: MORTGAGE_LEAD_CONSENT_TYPE,
      consentVersion: consentVersionFor(ConsentType.MORTGAGE_LEAD_DATA_TRANSFER),
      consentTextVersion: MORTGAGE_LEAD_CONSENT_TEXT_VERSION,
      fields,
      excludedCategories: MORTGAGE_LEAD_EXCLUDED_CATEGORIES,
      contextSummary: buildContextSummary(context),
      existingActiveLead: duplicateResult,
    },
  };
}

export async function confirmHypotekaJasneHandoff(
  raw: z.input<typeof confirmSchema>,
): Promise<
  | { ok: true } & HandoffConfirmSuccess
  | { ok: false; error: string; code?: string; existingLead?: MortgageLeadDuplicateInfo }
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

  const context = parsed.data.handoffContext;
  const preview = await loadHypotekaHandoffPreview(context);
  if (!preview.ok) return preview;

  if (preview.data.existingActiveLead) {
    return {
      ok: false,
      error: "Financování této nemovitosti už řešíte.",
      code: "DUPLICATE",
      existingLead: preview.data.existingActiveLead,
    };
  }

  const allowedKeys = new Set(
    preview.data.fields
      .filter((f) => f.always || (f.value && f.value.length > 0))
      .map((f) => f.key),
  );
  const selected = parsed.data.selectedFields.filter((k) =>
    allowedKeys.has(k as MortgageLeadShareFieldKey),
  ) as MortgageLeadShareFieldKey[];

  if (!selected.includes("email")) {
    return { ok: false, error: "E-mail je pro předání povinný." };
  }

  const [user, profile, financial, property] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.financialProfile.findUnique({ where: { userId } }),
    context?.propertyId
      ? prisma.property.findUnique({
          where: { id: context.propertyId },
          select: { propertyType: true, title: true },
        })
      : Promise.resolve(null),
  ]);

  const email = user?.email;
  if (!email) return { ok: false, error: "Účet nemá e-mail." };

  const version = preview.data.consentVersion;
  const sharedLabels = preview.data.fields
    .filter((f) => selected.includes(f.key))
    .map((f) => f.label);

  const now = new Date();

  const receipt: MortgageLeadConsentReceipt = {
    consentTextVersion: MORTGAGE_LEAD_CONSENT_TEXT_VERSION,
    consentAt: now.toISOString(),
    recipient: HYPOTEKAJASNE_RECIPIENT.name,
    recipientUrl: HYPOTEKAJASNE_RECIPIENT.url,
    purpose: HYPOTEKAJASNE_RECIPIENT.purpose,
    sharedFields: selected,
    sharedFieldLabels: sharedLabels,
    source: parsed.data.source,
    handoffContext: context
      ? {
          analysisId: context.analysisId,
          propertyId: context.propertyId,
          purchasePriceCzk: context.purchasePriceCzk,
        }
      : undefined,
  };

  const consent = await prisma.consent.create({
    data: {
      userId,
      type: ConsentType.MORTGAGE_LEAD_DATA_TRANSFER,
      granted: true,
      version,
      grantedAt: now,
      metadata: receipt satisfies MortgageLeadConsentReceipt as object,
    },
  });

  await persistConsentRecord({
    userId,
    purpose: "PARTNER_DATA_SHARE",
    recipient: HYPOTEKAJASNE_RECIPIENT.name,
    sharedScope: selected,
    version,
    granted: true,
    legalDocVersion: MORTGAGE_LEAD_CONSENT_TEXT_VERSION,
    metadata: {
      source: parsed.data.source,
      legacyConsentId: consent.id,
      purposeDetail: HYPOTEKAJASNE_RECIPIENT.purpose,
    },
  });

  const sensitive = {
    purchasePriceCzk: selected.includes("purchasePriceCzk")
      ? (context?.purchasePriceCzk ?? null)
      : null,
    availableEquityCzk: selected.includes("availableEquityCzk")
      ? (financial?.availableEquityCzk ?? null)
      : null,
    monthlyIncomeCzk: selected.includes("monthlyIncomeCzk")
      ? (financial?.monthlyIncomeCzk ?? null)
      : null,
    monthlyLiabilitiesCzk: selected.includes("monthlyLiabilitiesCzk")
      ? (financial?.monthlyLiabilitiesCzk ?? null)
      : null,
  };

  const createResult = await mortgageLeadService.createLead({
    userId,
    email,
    phone: selected.includes("phone") ? (profile?.phone ?? null) : null,
    propertyId: context?.propertyId ?? null,
    analysisId: context?.analysisId ?? null,
    propertySlug: context?.propertySlug ?? null,
    propertyTitle: context?.propertyTitle ?? property?.title ?? null,
    consentId: consent.id,
    source: parsed.data.source,
    sharedFields: selected,
    sensitive,
    contactName: selected.includes("name") ? (user?.name ?? null) : null,
    marketCountry: "CZ",
    propertyType: property?.propertyType ?? null,
    propertyPurpose: "investment",
    contextSnapshot: {
      valuationCzk: context?.valuationCzk,
      requestedLoanCzk: context?.requestedLoanCzk,
      ltvOnAskingPricePct: context?.ltvOnAskingPricePct,
      nominalInterestRatePp: context?.nominalInterestRatePp,
      aprPp: context?.aprPp,
      termYears: context?.termYears,
      estimatedMonthlyPaymentCzk: context?.estimatedMonthlyPaymentCzk,
    },
  });

  if (!createResult.ok) {
    await prisma.consent.update({
      where: { id: consent.id },
      data: { revokedAt: new Date(), granted: false },
    });
    return {
      ok: false,
      error: createResult.error,
      code: createResult.code,
      existingLead: createResult.existingLead,
    };
  }

  const submitResult = await mortgageLeadService.submitLead({
    leadId: createResult.data.leadId,
    userId,
    email,
    phone: selected.includes("phone") ? (profile?.phone ?? null) : null,
    source: parsed.data.source,
    propertyId: context?.propertyId ?? null,
    analysisId: context?.analysisId ?? null,
    propertySlug: context?.propertySlug ?? null,
    consentVersion: version,
    sharedFields: selected,
    contactName: selected.includes("name") ? (user?.name ?? null) : null,
    sensitive,
  });

  if (!submitResult.ok) {
    await prisma.consent.update({
      where: { id: consent.id },
      data: { revokedAt: new Date(), granted: false },
    });
    return { ok: false, error: submitResult.error, code: submitResult.code };
  }

  await prisma.consent.update({
    where: { id: consent.id },
    data: {
      metadata: {
        ...receipt,
        leadId: createResult.data.leadId,
        correlationId: createResult.data.correlationId,
        externalLeadId: submitResult.data.externalLeadId,
      } satisfies MortgageLeadConsentReceipt as object,
    },
  });

  await writeAuditLog({
    action: "consent.grant",
    entity: "Consent",
    entityId: consent.id,
    actorId: userId,
    meta: toAuditJson(
      sanitizeMortgageLeadAuditMeta({
        type: MORTGAGE_LEAD_CONSENT_TYPE,
        version,
        consentTextVersion: MORTGAGE_LEAD_CONSENT_TEXT_VERSION,
        leadId: createResult.data.leadId,
        correlationId: createResult.data.correlationId,
        externalLeadId: submitResult.data.externalLeadId,
        fieldCount: selected.length,
        source: parsed.data.source,
      }),
    ),
  });

  await writeAuditLog({
    action: "partner.handoff.hypotekajasne",
    entity: "Lead",
    entityId: createResult.data.leadId,
    actorId: userId,
    meta: toAuditJson(
      sanitizeMortgageLeadAuditMeta({
        correlationId: createResult.data.correlationId,
        externalLeadId: submitResult.data.externalLeadId,
        isMock: submitResult.data.isMock,
        consentId: consent.id,
      }),
    ),
  });

  track({
    name: "partner_handoff_confirmed",
    props: {
      partner: "hypotekajasne",
      field_count: selected.length,
      is_mock: submitResult.data.isMock,
      consent_type: MORTGAGE_LEAD_CONSENT_TYPE,
    },
  });
  track({
    name: "consent_given",
    props: {
      type: MORTGAGE_LEAD_CONSENT_TYPE,
      source: parsed.data.source,
    },
  });

  return {
    ok: true,
    externalLeadId: submitResult.data.externalLeadId,
    isMock: submitResult.data.isMock,
    consentId: consent.id,
    correlationId: submitResult.data.correlationId,
    statusLabel: mortgageLeadStatusLabel(submitResult.data.workflowStatus),
    pending: submitResult.data.pending,
    workflowStatus: submitResult.data.workflowStatus,
  };
}

/** Guest funnel — no session; contact + consent required (Prompt 13/10). */
export async function loadGuestMortgageHandoffPreview(input: {
  guestContact: GuestHandoffContact;
  rawContext?: z.input<typeof handoffContextSchema>;
}): Promise<{ ok: true; data: HandoffPreviewData } | { ok: false; error: string }> {
  const contactParsed = guestContactSchema.safeParse(input.guestContact);
  if (!contactParsed.success) {
    return { ok: false, error: "Zadejte platný e-mail pro kontakt." };
  }

  const context = parseContext(input.rawContext);
  const email = contactParsed.data.email.toLowerCase().trim();

  const duplicate = await mortgageLeadService.findActiveDuplicateByEmail({
    email,
    propertyId: context?.propertyId,
    analysisId: context?.analysisId,
  });

  const values: Record<MortgageLeadShareFieldKey, string | null> = {
    email,
    name: contactParsed.data.name ?? null,
    phone: contactParsed.data.phone ?? null,
    propertyReference:
      context?.propertySlug != null
        ? `Nemovitost ${context.propertySlug}`
        : context?.analysisId != null
          ? `Analýza (ref. ${context.analysisId.slice(-8)})`
          : null,
    purchasePriceCzk:
      context?.purchasePriceCzk != null
        ? formatValue(context.purchasePriceCzk)
        : null,
    availableEquityCzk: null,
    monthlyIncomeCzk: null,
    monthlyLiabilitiesCzk: null,
  };

  const fields: ShareableFieldValue[] = MORTGAGE_LEAD_SHAREABLE_FIELDS.map(
    (field) => ({
      key: field.key,
      label: field.label,
      value: values[field.key],
      always: field.always,
      category: field.category,
      included:
        field.always ? true : field.defaultIncluded && Boolean(values[field.key]),
    }),
  );

  return {
    ok: true,
    data: {
      recipient: HYPOTEKAJASNE_RECIPIENT,
      consentType: MORTGAGE_LEAD_CONSENT_TYPE,
      consentVersion: consentVersionFor(ConsentType.MORTGAGE_LEAD_DATA_TRANSFER),
      consentTextVersion: MORTGAGE_LEAD_CONSENT_TEXT_VERSION,
      fields,
      excludedCategories: MORTGAGE_LEAD_EXCLUDED_CATEGORIES,
      contextSummary: buildContextSummary(context),
      existingActiveLead: duplicate,
    },
  };
}

export async function confirmGuestMortgageHandoff(
  raw: z.input<typeof confirmSchema>,
): Promise<
  | { ok: true } & HandoffConfirmSuccess
  | { ok: false; error: string; code?: string; existingLead?: MortgageLeadDuplicateInfo }
> {
  const parsed = confirmSchema.safeParse(raw);
  if (!parsed.success || parsed.data.explicitConsent !== true) {
    return {
      ok: false,
      error: "Bez výslovného souhlasu nelze data předat.",
    };
  }

  if (!parsed.data.guestContact) {
    return { ok: false, error: "Pro odeslání bez účtu zadejte kontaktní e-mail." };
  }

  const contact = guestContactSchema.parse(parsed.data.guestContact);
  const context = parsed.data.handoffContext;
  const preview = await loadGuestMortgageHandoffPreview({
    guestContact: contact,
    rawContext: context,
  });
  if (!preview.ok) return preview;

  if (preview.data.existingActiveLead) {
    return {
      ok: false,
      error: "Požadavek pro tuto nemovitost už evidujeme pod tímto e-mailem.",
      code: "DUPLICATE",
      existingLead: preview.data.existingActiveLead,
    };
  }

  const allowedKeys = new Set(
    preview.data.fields
      .filter((f) => f.always || (f.value && f.value.length > 0))
      .map((f) => f.key),
  );
  const selected = parsed.data.selectedFields.filter((k) =>
    allowedKeys.has(k as MortgageLeadShareFieldKey),
  ) as MortgageLeadShareFieldKey[];

  if (!selected.includes("email")) {
    return { ok: false, error: "E-mail je pro předání povinný." };
  }

  const property = context?.propertyId
    ? await prisma.property.findUnique({
        where: { id: context.propertyId },
        select: { propertyType: true, title: true },
      })
    : null;

  const email = contact.email.toLowerCase().trim();
  const version = preview.data.consentVersion;
  const sharedLabels = preview.data.fields
    .filter((f) => selected.includes(f.key))
    .map((f) => f.label);
  const now = new Date();

  const receipt: MortgageLeadConsentReceipt = {
    consentTextVersion: MORTGAGE_LEAD_CONSENT_TEXT_VERSION,
    consentAt: now.toISOString(),
    recipient: HYPOTEKAJASNE_RECIPIENT.name,
    recipientUrl: HYPOTEKAJASNE_RECIPIENT.url,
    purpose: HYPOTEKAJASNE_RECIPIENT.purpose,
    sharedFields: selected,
    sharedFieldLabels: sharedLabels,
    source: parsed.data.source,
    handoffContext: context
      ? {
          analysisId: context.analysisId,
          propertyId: context.propertyId,
          purchasePriceCzk: context.purchasePriceCzk,
        }
      : undefined,
  };

  const sensitive = {
    purchasePriceCzk: selected.includes("purchasePriceCzk")
      ? (context?.purchasePriceCzk ?? null)
      : null,
    availableEquityCzk: null,
    monthlyIncomeCzk: null,
    monthlyLiabilitiesCzk: null,
  };

  const createResult = await mortgageLeadService.createLead({
    email,
    phone: selected.includes("phone") ? (contact.phone ?? null) : null,
    propertyId: context?.propertyId ?? null,
    analysisId: context?.analysisId ?? null,
    propertySlug: context?.propertySlug ?? null,
    propertyTitle: context?.propertyTitle ?? property?.title ?? null,
    consentReceipt: receipt as unknown as Record<string, unknown>,
    source: parsed.data.source,
    sharedFields: selected,
    sensitive,
    contactName: selected.includes("name") ? (contact.name ?? null) : null,
    marketCountry: "CZ",
    propertyType: property?.propertyType ?? null,
    propertyPurpose: "investment",
    contextSnapshot: {
      valuationCzk: context?.valuationCzk,
      requestedLoanCzk: context?.requestedLoanCzk,
      ltvOnAskingPricePct: context?.ltvOnAskingPricePct,
      nominalInterestRatePp: context?.nominalInterestRatePp,
      aprPp: context?.aprPp,
      termYears: context?.termYears,
      estimatedMonthlyPaymentCzk: context?.estimatedMonthlyPaymentCzk,
    },
  });

  if (!createResult.ok) {
    return {
      ok: false,
      error: createResult.error,
      code: createResult.code,
      existingLead: createResult.existingLead,
    };
  }

  const submitResult = await mortgageLeadService.submitLead({
    leadId: createResult.data.leadId,
    email,
    phone: selected.includes("phone") ? (contact.phone ?? null) : null,
    source: parsed.data.source,
    propertyId: context?.propertyId ?? null,
    analysisId: context?.analysisId ?? null,
    propertySlug: context?.propertySlug ?? null,
    consentVersion: version,
    sharedFields: selected,
    contactName: selected.includes("name") ? (contact.name ?? null) : null,
    sensitive,
  });

  if (!submitResult.ok) {
    return { ok: false, error: submitResult.error, code: submitResult.code };
  }

  track({
    name: "partner_handoff_confirmed",
    props: {
      partner: "hypotekajasne",
      field_count: selected.length,
      is_mock: submitResult.data.isMock,
      consent_type: MORTGAGE_LEAD_CONSENT_TYPE,
    },
  });

  return {
    ok: true,
    externalLeadId: submitResult.data.externalLeadId,
    isMock: submitResult.data.isMock,
    consentId: "",
    correlationId: submitResult.data.correlationId,
    statusLabel: mortgageLeadStatusLabel(submitResult.data.workflowStatus),
    pending: submitResult.data.pending,
    workflowStatus: submitResult.data.workflowStatus,
  };
}
