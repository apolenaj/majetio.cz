"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  acceptAllConsent,
  defaultRejectedConsent,
  type CookieConsentChoices,
  COOKIE_POLICY_VERSION,
} from "@/domains/privacy/cookie-consent";
import {
  createPrivacyExportToken,
  requestAccountDeletionSoft,
  syncCookieConsentRecords,
  withdrawConsentRecord,
} from "@/domains/privacy/consent-records-service";
import { setMarketingConsent } from "@/lib/privacy/consents";

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

const cookieChoicesSchema = z.object({
  preferences: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  visitorId: z.string().min(8).max(128),
  source: z.string().min(1).max(80).default("consent_banner"),
});

export async function saveCookieConsentAction(
  input: z.infer<typeof cookieChoicesSchema>,
): Promise<{ ok: true; state: ReturnType<typeof acceptAllConsent> } | { ok: false; error: string }> {
  const parsed = cookieChoicesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Neplatná volba cookies." };

  const choices: CookieConsentChoices = {
    necessary: true,
    preferences: parsed.data.preferences,
    analytics: parsed.data.analytics,
    marketing: parsed.data.marketing,
  };
  const state = {
    ...choices,
    v: COOKIE_POLICY_VERSION,
    updatedAt: new Date().toISOString(),
  };

  const userId = await requireUserId();
  try {
    await syncCookieConsentRecords({
      userId,
      visitorId: parsed.data.visitorId,
      state,
      source: parsed.data.source,
    });
  } catch {
    /* Anonymous / DB lag — client cookie still authoritative for gating */
  }

  if (userId && typeof choices.marketing === "boolean") {
    await setMarketingConsent({
      granted: choices.marketing,
      source: "cookie_consent",
      syncChannelPrefs: true,
    }).catch(() => undefined);
  }

  return { ok: true, state };
}

export async function acceptAllCookiesAction(input: {
  visitorId: string;
}): Promise<{ ok: true; state: ReturnType<typeof acceptAllConsent> } | { ok: false; error: string }> {
  return saveCookieConsentAction({
    preferences: true,
    analytics: true,
    marketing: true,
    visitorId: input.visitorId,
    source: "consent_banner_accept_all",
  });
}

export async function rejectOptionalCookiesAction(input: {
  visitorId: string;
}): Promise<{ ok: true; state: ReturnType<typeof defaultRejectedConsent> } | { ok: false; error: string }> {
  return saveCookieConsentAction({
    preferences: false,
    analytics: false,
    marketing: false,
    visitorId: input.visitorId,
    source: "consent_banner_reject",
  });
}

export async function withdrawPrivacyConsentAction(input: {
  recordId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };
  return withdrawConsentRecord({ userId, recordId: input.recordId });
}

export async function requestSecureDataExportAction(input: {
  format: "json" | "csv";
}): Promise<
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };
  return createPrivacyExportToken({ userId, format: input.format });
}

export async function requestAccountDeletionAction(input: {
  confirmEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };
  return requestAccountDeletionSoft({
    userId,
    confirmEmail: input.confirmEmail,
  });
}
