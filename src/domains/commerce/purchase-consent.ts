/**
 * Purchase Terms acceptance — checklist 211 / 212.
 * Marketing consent is NEVER collected or required at checkout.
 */

import { ConsentType } from "@prisma/client";

import { CURRENT_CONSENT_VERSIONS } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import { track } from "@/lib/analytics/events";

export const PURCHASE_TERMS_VERSION = CURRENT_CONSENT_VERSIONS.TERMS;

export const PURCHASE_CONSENT_COPY_CS = {
  termsLabel:
    "Souhlasím s Obchodními podmínkami a beru na vědomí, že po zaplacení získám digitální přístup k produktu.",
  termsRequired: "Pro dokončení nákupu je nutný souhlas s Obchodními podmínkami.",
  marketingSeparation:
    "Marketingový souhlas není součástí nákupu a zde se nevyžaduje.",
  privacyLinkLabel: "Ochrana osobních údajů",
  termsLinkHref: "/podminky",
  privacyLinkHref: "/ochrana-soukromi",
} as const;

/**
 * Persist versioned Terms acceptance tied to a purchase (211).
 * Does not create or imply MARKETING consent (212).
 */
export async function recordPurchaseTermsAcceptance(input: {
  userId: string;
  orderId: string;
  productKey: string;
  termsVersion?: string;
  source?: string;
}): Promise<{ ok: true; consentId: string; version: string }> {
  const version = input.termsVersion ?? PURCHASE_TERMS_VERSION;
  const now = new Date();
  const source = input.source ?? "checkout";

  const consent = await prisma.consent.create({
    data: {
      userId: input.userId,
      type: ConsentType.TERMS,
      granted: true,
      version,
      grantedAt: now,
      metadata: {
        source,
        purpose: "purchase_terms",
        orderId: input.orderId,
        productKey: input.productKey,
        /** Explicit: purchase must never piggy-back marketing (212). */
        marketingBundled: false,
      },
    },
    select: { id: true },
  });

  await writeAuditLog({
    action: "consent.grant",
    entity: "Consent",
    entityId: consent.id,
    actorId: input.userId,
    meta: {
      type: "TERMS",
      purpose: "purchase_terms",
      orderId: input.orderId,
      version,
      marketingBundled: false,
    },
  });

  track({
    name: "consent_given",
    props: { type: "TERMS", source },
  });

  return { ok: true, consentId: consent.id, version };
}

/**
 * Guard — checkout payload must never carry marketing opt-in.
 */
export function assertNoMarketingBundledWithPurchase(input: {
  acceptMarketing?: unknown;
  marketingOptIn?: unknown;
  marketingConsent?: unknown;
}): { ok: true } | { ok: false; error: string } {
  if (
    input.acceptMarketing === true ||
    input.marketingOptIn === true ||
    input.marketingConsent === true
  ) {
    return {
      ok: false,
      error:
        "Marketingový souhlas nesmí být součástí nákupu. Spravujte jej samostatně v účtu.",
    };
  }
  return { ok: true };
}
