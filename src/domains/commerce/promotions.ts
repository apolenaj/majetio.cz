/**
 * Promotion validation & discount application (server-only).
 */

import { prisma } from "@/lib/db";
import { applyPromoDiscount, type PromoDefinition } from "@/domains/payments/service/pricing";

export type ResolvedPromotion = PromoDefinition & {
  id: string;
  source: "promotion" | "promo_code";
  maxPerUser: number | null;
};

export async function resolvePromotionByCode(input: {
  code: string;
  planKey: string;
  userId?: string | null;
  now?: Date;
}): Promise<
  | { ok: true; promotion: ResolvedPromotion }
  | { ok: false; error: string }
> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Neplatný promo kód." };
  const now = input.now ?? new Date();

  const promotion = await prisma.promotion.findUnique({ where: { code } });
  if (promotion) {
    if (input.userId && promotion.maxPerUser != null) {
      const used = await prisma.promotionRedemption.count({
        where: { promotionId: promotion.id, userId: input.userId },
      });
      if (used >= promotion.maxPerUser) {
        return { ok: false, error: "Promo kód jste již vyčerpali." };
      }
    }

    const def: ResolvedPromotion = {
      id: promotion.id,
      source: "promotion",
      code: promotion.code,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      productKeys: promotion.planKeys,
      active: promotion.active,
      activeFrom: promotion.activeFrom,
      activeTo: promotion.activeTo,
      maxRedemptions: promotion.maxRedemptions,
      redemptionCount: promotion.redemptionCount,
      maxPerUser: promotion.maxPerUser,
    };

    const check = applyPromoDiscount({
      listGrossMinor: 1,
      productKey: input.planKey,
      promo: def,
      now,
    });
    // applyPromoDiscount with list=1 only validates eligibility when discount would apply;
    // re-check eligibility explicitly for empty planKeys / expiry
    if (check.error) return { ok: false, error: check.error };
    return { ok: true, promotion: def };
  }

  // Legacy PromoCode table
  const legacy = await prisma.promoCode.findUnique({ where: { code } });
  if (!legacy) return { ok: false, error: "Neplatný promo kód." };

  const def: ResolvedPromotion = {
    id: legacy.id,
    source: "promo_code",
    code: legacy.code,
    discountType: legacy.discountType,
    discountValue: legacy.discountValue,
    productKeys: legacy.productKeys,
    active: legacy.active,
    activeFrom: legacy.activeFrom,
    activeTo: legacy.activeTo,
    maxRedemptions: legacy.maxRedemptions,
    redemptionCount: legacy.redemptionCount,
    maxPerUser: null,
  };
  const check = applyPromoDiscount({
    listGrossMinor: 1,
    productKey: input.planKey,
    promo: def,
    now,
  });
  if (check.error) return { ok: false, error: check.error };
  return { ok: true, promotion: def };
}

export function computePromotionDiscount(input: {
  listGrossMinor: number;
  planKey: string;
  promotion: ResolvedPromotion | null;
  now?: Date;
}): { discountMinor: number; grossMinor: number; error?: string } {
  return applyPromoDiscount({
    listGrossMinor: input.listGrossMinor,
    productKey: input.planKey,
    promo: input.promotion,
    now: input.now,
  });
}
