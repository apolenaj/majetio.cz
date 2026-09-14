/**
 * Fraud / abuse protection foundations (checklist 159).
 * Free-account velocity, promotion abuse, fake listing signals.
 */

import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";

export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export type AbuseSignal = {
  code: string;
  severity: "low" | "medium" | "high";
  messageCs: string;
};

/**
 * Soft check: many new FREE users from same IP / email domain in a short window.
 */
export async function detectFreeAccountVelocity(input: {
  ip?: string | null;
  email?: string | null;
  windowHours?: number;
  maxAccounts?: number;
}): Promise<{ ok: true; signals: AbuseSignal[] }> {
  const signals: AbuseSignal[] = [];
  const hours = input.windowHours ?? 24;
  const max = input.maxAccounts ?? 5;
  const since = new Date(Date.now() - hours * 3_600_000);

  if (input.email) {
    const domain = input.email.split("@")[1]?.toLowerCase();
    if (domain && ["mailinator.com", "guerrillamail.com", "tempmail.com"].includes(domain)) {
      signals.push({
        code: "disposable_email",
        severity: "high",
        messageCs: "Detekována jednorázová e-mailová doména.",
      });
    }
  }

  if (input.ip && input.ip !== "unknown") {
    const recent = await prisma.auditLog.count({
      where: {
        action: { in: ["auth.register", "auth.login.success"] },
        ip: input.ip,
        createdAt: { gte: since },
      },
    });
    if (recent >= max * 2) {
      signals.push({
        code: "ip_velocity",
        severity: "high",
        messageCs: `Extrémní frekvence účtů/přihlášení z IP za ${hours}h — blokováno.`,
      });
    } else if (recent >= max) {
      signals.push({
        code: "ip_velocity",
        severity: "high",
        messageCs: `Vysoká frekvence účtů/přihlášení z IP za ${hours}h — ochrana free abuse.`,
      });
    }
  }

  return { ok: true, signals };
}

/**
 * Promotion abuse — over redemption or multi-account pattern.
 * Covers both `Promotion` and legacy `PromoCode` tables.
 */
export async function detectPromotionAbuse(input: {
  userId: string;
  promoCode?: string | null;
}): Promise<{ ok: true; signals: AbuseSignal[]; allowRedeem: boolean }> {
  const signals: AbuseSignal[] = [];
  if (!input.promoCode?.trim()) {
    return { ok: true, signals, allowRedeem: true };
  }

  const code = input.promoCode.trim().toUpperCase();
  const promo = await prisma.promotion.findFirst({
    where: { code, active: true },
  });
  if (promo) {
    if (
      promo.maxRedemptions != null &&
      promo.redemptionCount >= promo.maxRedemptions
    ) {
      signals.push({
        code: "promo_exhausted",
        severity: "high",
        messageCs: "Promo kód vyčerpal globální limit.",
      });
      return { ok: true, signals, allowRedeem: false };
    }

    if (promo.maxPerUser != null) {
      const userCount = await prisma.promotionRedemption.count({
        where: { promotionId: promo.id, userId: input.userId },
      });
      if (userCount >= promo.maxPerUser) {
        signals.push({
          code: "promo_per_user",
          severity: "high",
          messageCs: "Uživatel překročil limit použití promo kódu.",
        });
        return { ok: true, signals, allowRedeem: false };
      }
    }

    return { ok: true, signals, allowRedeem: true };
  }

  const legacy = await prisma.promoCode.findFirst({
    where: { code, active: true },
  });
  if (!legacy) {
    return {
      ok: true,
      signals: [
        {
          code: "unknown_promo",
          severity: "low",
          messageCs: "Neznámý promo kód.",
        },
      ],
      allowRedeem: false,
    };
  }

  if (
    legacy.maxRedemptions != null &&
    legacy.redemptionCount >= legacy.maxRedemptions
  ) {
    signals.push({
      code: "promo_exhausted",
      severity: "high",
      messageCs: "Promo kód vyčerpal globální limit.",
    });
    return { ok: true, signals, allowRedeem: false };
  }

  const legacyUserCount = await prisma.promoRedemption.count({
    where: { promoCodeId: legacy.id, userId: input.userId },
  });
  if (legacyUserCount >= 1) {
    signals.push({
      code: "promo_per_user",
      severity: "medium",
      messageCs: "Opakované použití legacy promo kódu stejným uživatelem.",
    });
  }

  return { ok: true, signals, allowRedeem: !isBlockedByAbuse(signals) };
}

/**
 * Fake listing heuristics — demo / incomplete / unverified spam patterns.
 */
export function detectFakeListingSignals(property: {
  isDemo?: boolean | null;
  status?: string | null;
  listingVerificationStatus?: string | null;
  askingPrice?: number | null;
  title?: string | null;
  publicCity?: string | null;
}): AbuseSignal[] {
  const signals: AbuseSignal[] = [];
  if (property.isDemo) {
    signals.push({
      code: "demo_listing",
      severity: "high",
      messageCs: "Demo nemovitost nelze monetizovat / boostovat.",
    });
  }
  if (property.listingVerificationStatus === "UNVERIFIED") {
    signals.push({
      code: "unverified_listing",
      severity: "medium",
      messageCs: "Neověřený inzerát — zvýšené riziko fake listingu.",
    });
  }
  if (property.askingPrice != null && property.askingPrice <= 0) {
    signals.push({
      code: "invalid_price",
      severity: "high",
      messageCs: "Neplatná nabídková cena.",
    });
  }
  if (!property.title?.trim() || !property.publicCity?.trim()) {
    signals.push({
      code: "incomplete_listing",
      severity: "medium",
      messageCs: "Neúplný inzerát (chybí název nebo město).",
    });
  }
  const spamTitle = property.title?.toLowerCase() ?? "";
  if (/whatsapp|telegram|xxx|crypto|garantovan[yý] v[yý]nos/i.test(spamTitle)) {
    signals.push({
      code: "spam_title",
      severity: "high",
      messageCs: "Podezřelý obsah v názvu inzerátu.",
    });
  }
  return signals;
}

export function isBlockedByAbuse(signals: AbuseSignal[]): boolean {
  return signals.some((s) => s.severity === "high");
}
