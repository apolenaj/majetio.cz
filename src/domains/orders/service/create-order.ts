/**
 * Order creation — PricingPlan + OrderItem snapshots; IDOR via session userId.
 */

import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  assertCommerceCurrency,
  formatMoneyFromMinor,
} from "@/config/commerce";
import { resolveCanonicalCheckoutAmount } from "@/config/pricing-architecture";
import {
  getActivePricingPlanByKey,
  buildCommerceLineQuote,
  resolvePromotionByCode,
} from "@/domains/commerce";
import {
  PURCHASE_TERMS_VERSION,
  recordPurchaseTermsAcceptance,
} from "@/domains/commerce/purchase-consent";
import { assertPricingPlanMarketMatch } from "@/domains/commerce/subscription-market-lock";
import type { PriceQuote } from "@/domains/payments/service/pricing";
import { getPaymentProvider, resolvePaymentsConfig } from "@/integrations/payments";

export type BillingInfoInput = {
  name: string;
  email: string;
  company?: string | null;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  vatId?: string | null;
};

/** @deprecated Prefer getActivePricingPlanByKey — kept for PriceVersion compat. */
export async function resolveActivePriceVersion(productKey: string) {
  const plan = await getActivePricingPlanByKey(productKey);
  if (!plan) return null;
  return {
    productKey: plan.key,
    versionKey: plan.versionKey,
    currency: plan.currency,
    amountGrossMinor: plan.priceGrossMinor,
    vatRateBp: plan.vatRateBp,
  };
}

function lineToPriceQuote(line: {
  planKey: string;
  planVersionKey: string;
  currency: string;
  unitListGrossMinor: number;
  discountMinor: number;
  lineGrossMinor: number;
  lineNetMinor: number;
  lineVatMinor: number;
  vatRateBp: number;
  promoCode: string | null;
}): PriceQuote {
  return {
    productKey: line.planKey,
    priceVersionKey: line.planVersionKey,
    currency: line.currency as PriceQuote["currency"],
    listGrossMinor: line.unitListGrossMinor,
    discountMinor: line.discountMinor,
    grossMinor: line.lineGrossMinor,
    netMinor: line.lineNetMinor,
    vatMinor: line.lineVatMinor,
    vatRateBp: line.vatRateBp,
    promoCode: line.promoCode,
  };
}

export async function createCheckoutOrder(input: {
  userId: string;
  productKey: string;
  analysisId?: string | null;
  propertyId?: string | null;
  organizationId?: string | null;
  billing: BillingInfoInput;
  promoCode?: string | null;
  currency?: string;
  /** Checkout market — must match PricingPlan.marketCode (default CZ). */
  marketCode?: string;
  idempotencyKey?: string | null;
  /** Required — purchase Terms acceptance (211); marketing must stay separate (212). */
  acceptPurchaseTerms: true;
  /**
   * Optional client-claimed amount — IGNORED (checklist 171/172).
   * Charge always comes from PricingPlan.
   */
  clientClaimedAmountMinor?: number | null;
}): Promise<
  | {
      ok: true;
      orderId: string;
      paymentId: string;
      checkoutUrl: string | null;
      quote: PriceQuote;
    }
  | { ok: false; error: string }
> {
  if (input.acceptPurchaseTerms !== true) {
    return {
      ok: false,
      error: "Pro dokončení nákupu je nutný souhlas s Obchodními podmínkami.",
    };
  }

  const currency = assertCommerceCurrency(input.currency ?? "CZK");
  const marketCode = (input.marketCode ?? "CZ").toUpperCase();

  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (existing && existing.userId === input.userId) {
      const pay = existing.payments[0];
      return {
        ok: true,
        orderId: existing.id,
        paymentId: pay?.id ?? "",
        checkoutUrl: pay?.providerCheckoutUrl ?? null,
        quote: {
          productKey: existing.productKey,
          priceVersionKey: existing.priceVersionKey,
          currency: existing.currency as "CZK",
          listGrossMinor: existing.amountGrossMinor + existing.discountMinor,
          discountMinor: existing.discountMinor,
          grossMinor: existing.amountGrossMinor,
          netMinor: existing.amountNetMinor,
          vatMinor: existing.amountVatMinor,
          vatRateBp: existing.vatRateBp,
          promoCode: existing.promoCodeSnapshot,
        },
      };
    }
  }

  const plan = await getActivePricingPlanByKey(input.productKey, marketCode);
  if (!plan) return { ok: false, error: "Neznámý nebo neaktivní ceníkový plán." };

  const { assertCatalogProductCheckoutAllowed } = await import(
    "@/domains/commerce/product-availability"
  );
  const allowed = assertCatalogProductCheckoutAllowed(input.productKey);
  if (!allowed.ok) return allowed;

  const { isPaymentsPaused } = await import(
    "@/domains/markets/capabilities/kill-switch"
  );
  if (isPaymentsPaused(marketCode)) {
    return {
      ok: false,
      error: "Platby pro tento trh jsou dočasně pozastaveny.",
    };
  }

  const { isKillSwitchEngaged } = await import(
    "@/domains/platform/admin/feature-flags"
  );
  if (await isKillSwitchEngaged("kill.payments")) {
    return {
      ok: false,
      error: "Platby jsou dočasně vypnuté (údržba platformy).",
    };
  }

  const { isMaintenanceMode } = await import("@/lib/maintenance");
  if (isMaintenanceMode()) {
    return {
      ok: false,
      error: "Probíhá údržba. Platby jsou dočasně nedostupné.",
    };
  }

  try {
    assertPricingPlanMarketMatch({
      planMarketCode: plan.marketCode,
      checkoutMarketCode: marketCode,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Ceník neodpovídá trhu checkoutu.",
    };
  }

  let promotion = null;
  if (input.promoCode?.trim()) {
    const { detectPromotionAbuse, isBlockedByAbuse } = await import(
      "@/domains/fraud",
    );
    const abuse = await detectPromotionAbuse({
      userId: input.userId,
      promoCode: input.promoCode,
    });
    if (!abuse.allowRedeem || isBlockedByAbuse(abuse.signals)) {
      return {
        ok: false,
        error:
          abuse.signals[0]?.messageCs ??
          "Promo kód nelze použít (ochrana proti zneužití).",
      };
    }

    const resolved = await resolvePromotionByCode({
      code: input.promoCode,
      planKey: plan.key,
      userId: input.userId,
    });
    if (!resolved.ok) return { ok: false, error: resolved.error };
    promotion = resolved.promotion;
  }

  const line = buildCommerceLineQuote({ plan, promotion, quantity: 1 });
  if ("error" in line) return { ok: false, error: line.error };

  // 171/172 — canonical PricingPlan price; ignore any client-claimed amount
  const canonicalList = resolveCanonicalCheckoutAmount({
    planPriceGrossMinor: plan.priceGrossMinor,
    clientClaimedAmountMinor: input.clientClaimedAmountMinor,
  });
  if (line.unitListGrossMinor !== canonicalList) {
    return {
      ok: false,
      error: "Cena neodpovídá kanonickému PricingPlan (server autorita).",
    };
  }

  if (line.currency !== currency) {
    return { ok: false, error: `Nepovolená měna: ${currency}` };
  }

  const quote = lineToPriceQuote(line);

  const config = resolvePaymentsConfig();
  if (config.provider === "none" && quote.grossMinor > 0) {
    return {
      ok: false,
      error:
        "Platební brána není nakonfigurována (PAYMENTS_PROVIDER). Pro vývoj nastavte mock.",
    };
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Atomic promo cap claim — prevents oversell under concurrency
      if (promotion?.source === "promotion") {
        if (promotion.maxPerUser != null) {
          const used = await tx.promotionRedemption.count({
            where: { promotionId: promotion.id, userId: input.userId },
          });
          if (used >= promotion.maxPerUser) {
            throw new Error("PROMO_PER_USER");
          }
        }
        const claimed = await tx.promotion.updateMany({
          where: {
            id: promotion.id,
            active: true,
            ...(promotion.maxRedemptions != null
              ? { redemptionCount: { lt: promotion.maxRedemptions } }
              : {}),
          },
          data: { redemptionCount: { increment: 1 } },
        });
        if (claimed.count !== 1) {
          throw new Error("PROMO_EXHAUSTED");
        }
      } else if (promotion?.source === "promo_code") {
        const claimed = await tx.promoCode.updateMany({
          where: {
            id: promotion.id,
            active: true,
            ...(promotion.maxRedemptions != null
              ? { redemptionCount: { lt: promotion.maxRedemptions } }
              : {}),
          },
          data: { redemptionCount: { increment: 1 } },
        });
        if (claimed.count !== 1) {
          throw new Error("PROMO_EXHAUSTED");
        }
      }

      const created = await tx.order.create({
        data: {
          userId: input.userId,
          analysisId: input.analysisId ?? null,
          propertyId: input.propertyId ?? null,
          organizationId: input.organizationId ?? null,
          status: quote.grossMinor === 0 ? "PAID" : "AWAITING_PAYMENT",
          productKey: plan.key,
          priceVersionKey: plan.versionKey,
          pricingPlanId: plan.rowId,
          amountGrossMinor: quote.grossMinor,
          amountNetMinor: quote.netMinor,
          amountVatMinor: quote.vatMinor,
          vatRateBp: quote.vatRateBp,
          currency: quote.currency,
          amountCzk: Math.round(quote.grossMinor / 100),
          discountMinor: quote.discountMinor,
          promoCodeId: promotion?.source === "promo_code" ? promotion.id : null,
          promotionId: promotion?.source === "promotion" ? promotion.id : null,
          promoCodeSnapshot: quote.promoCode,
          billingName: input.billing.name.slice(0, 200),
          billingEmail: input.billing.email.slice(0, 200),
          billingCompany: input.billing.company?.slice(0, 200) ?? null,
          billingStreet: input.billing.street?.slice(0, 200) ?? null,
          billingCity: input.billing.city?.slice(0, 120) ?? null,
          billingZip: input.billing.zip?.slice(0, 32) ?? null,
          billingCountry: (input.billing.country ?? "CZ").slice(0, 2).toUpperCase(),
          billingVatId: input.billing.vatId?.slice(0, 32) ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          paidAt: quote.grossMinor === 0 ? new Date() : null,
          configSnapshot: {
            planKey: plan.key,
            planName: plan.name,
            priceVersionKey: plan.versionKey,
            listGrossMinor: line.unitListGrossMinor,
            discountMinor: quote.discountMinor,
            vatRateBp: quote.vatRateBp,
            displayGross: formatMoneyFromMinor(quote.grossMinor, quote.currency),
            displayNet: formatMoneyFromMinor(quote.netMinor, quote.currency),
            displayVat: formatMoneyFromMinor(quote.vatMinor, quote.currency),
            features: plan.features,
            limits: plan.limits as Prisma.InputJsonValue,
            purchaseTermsAccepted: true,
            purchaseTermsVersion: PURCHASE_TERMS_VERSION,
            marketingBundled: false,
            marketCode,
          } satisfies Prisma.InputJsonValue,
          items: {
            create: {
              pricingPlanId: line.pricingPlanId,
              planKey: line.planKey,
              planVersionKey: line.planVersionKey,
              planName: line.planName,
              billingType: line.billingType,
              quantity: line.quantity,
              unitListGrossMinor: line.unitListGrossMinor,
              unitPriceGrossMinor: line.unitPriceGrossMinor,
              unitPriceNetMinor: line.unitPriceNetMinor,
              unitPriceVatMinor: line.unitPriceVatMinor,
              discountMinor: line.discountMinor,
              lineGrossMinor: line.lineGrossMinor,
              lineNetMinor: line.lineNetMinor,
              lineVatMinor: line.lineVatMinor,
              vatRateBp: line.vatRateBp,
              currency: line.currency,
              limitsSnapshot: line.limitsSnapshot as Prisma.InputJsonValue,
              featuresSnapshot: line.featuresSnapshot,
            },
          },
        },
      });

      if (promotion?.source === "promotion") {
        await tx.promotionRedemption.create({
          data: {
            promotionId: promotion.id,
            userId: input.userId,
            orderId: created.id,
          },
        });
      } else if (promotion?.source === "promo_code") {
        await tx.promoRedemption.create({
          data: {
            promoCodeId: promotion.id,
            userId: input.userId,
            orderId: created.id,
          },
        });
      }

      return created;
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "PROMO_EXHAUSTED") {
      return { ok: false, error: "Promo kód byl již vyčerpán." };
    }
    if (message === "PROMO_PER_USER") {
      return { ok: false, error: "Promo kód jste již vyčerpali." };
    }
    throw err;
  }

  await recordPurchaseTermsAcceptance({
    userId: input.userId,
    orderId: order.id,
    productKey: plan.key,
  });

  const { track } = await import("@/lib/analytics/events");
  track({
    name: "checkout_started",
    props: {
      product_key: plan.key,
      has_promo: Boolean(promotion),
    },
  });

  if (quote.grossMinor === 0) {
    const { grantEntitlementForPaidOrder } = await import(
      "@/domains/payments/service/entitlements"
    );
    // Free products: no PSP webhook — grant with FREE_CHECKOUT source
    await grantEntitlementForPaidOrder({
      userId: input.userId,
      orderId: order.id,
      productKey: plan.entitlesProductKey,
      analysisId: input.analysisId,
      propertyId: input.propertyId,
      organizationId: input.organizationId,
    });
    track({
      name: "checkout_completed",
      props: {
        product_key: plan.key,
        billing_kind:
          line.billingType === "SUBSCRIPTION" ? "subscription" : "one_time",
      },
    });
    return {
      ok: true,
      orderId: order.id,
      paymentId: "",
      checkoutUrl: `/checkout/success?orderId=${order.id}`,
      quote,
    };
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      status: "PENDING",
      amountGrossMinor: quote.grossMinor,
      amountCzk: Math.round(quote.grossMinor / 100),
      currency: quote.currency,
      provider: config.provider === "none" ? "mock" : config.provider,
    },
  });

  const provider = getPaymentProvider();
  const session = await provider.createCheckoutSession({
    orderId: order.id,
    paymentId: payment.id,
    amountGrossMinor: quote.grossMinor,
    currency: quote.currency,
    productKey: plan.key,
    productName: plan.name,
    customerEmail: input.billing.email,
    successUrl: `${config.publicBaseUrl}/checkout/success?orderId=${order.id}`,
    cancelUrl: `${config.publicBaseUrl}/checkout/cancel?orderId=${order.id}`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: session.providerPaymentId,
      providerCheckoutUrl: session.checkoutUrl,
      status: "REQUIRES_ACTION",
    },
  });

  return {
    ok: true,
    orderId: order.id,
    paymentId: payment.id,
    checkoutUrl: session.checkoutUrl,
    quote,
  };
}

export async function getOrderForUser(input: {
  userId: string;
  orderId: string;
}) {
  return prisma.order.findFirst({
    where: { id: input.orderId, userId: input.userId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      entitlements: true,
      refunds: true,
    },
  });
}

export function newCheckoutIdempotencyKey(seed: string): string {
  return createHash("sha256")
    .update(`${seed}:${randomBytes(8).toString("hex")}`)
    .digest("hex")
    .slice(0, 48);
}
