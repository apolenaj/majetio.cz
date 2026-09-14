"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  createCheckoutOrder,
  getOrderForUser,
} from "@/domains/orders/service/create-order";
import { parseCheckoutOrderInput } from "@/domains/orders/server/checkout-input";
import { commerceConfig, formatCzkFromMinor } from "@/config/commerce";
import {
  getActivePricingPlanByKey,
  buildCommerceLineQuote,
  resolvePromotionByCode,
} from "@/domains/commerce";
import { prisma } from "@/lib/db";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function previewCheckoutQuoteAction(input: {
  productKey: string;
  promoCode?: string | null;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const plan = await getActivePricingPlanByKey(input.productKey);
  if (!plan) return { ok: false as const, error: "Neznámý nebo neaktivní plán." };

  let promotion = null;
  if (input.promoCode?.trim()) {
    const resolved = await resolvePromotionByCode({
      code: input.promoCode,
      planKey: plan.key,
      userId,
    });
    if (!resolved.ok) return { ok: false as const, error: resolved.error };
    promotion = resolved.promotion;
  }

  const line = buildCommerceLineQuote({ plan, promotion, quantity: 1 });
  if ("error" in line) return { ok: false as const, error: line.error };

  return {
    ok: true as const,
    productName: plan.name,
    quote: {
      productKey: line.planKey,
      priceVersionKey: line.planVersionKey,
      currency: line.currency,
      listGrossMinor: line.unitListGrossMinor,
      discountMinor: line.discountMinor,
      grossMinor: line.lineGrossMinor,
      netMinor: line.lineNetMinor,
      vatMinor: line.lineVatMinor,
      vatRateBp: line.vatRateBp,
      promoCode: line.promoCode,
    },
    display: {
      list: formatCzkFromMinor(line.unitListGrossMinor),
      discount: formatCzkFromMinor(line.discountMinor),
      net: formatCzkFromMinor(line.lineNetMinor),
      vat: formatCzkFromMinor(line.lineVatMinor),
      gross: formatCzkFromMinor(line.lineGrossMinor),
      vatRatePct: (line.vatRateBp / 100).toFixed(0),
    },
  };
}

export async function startCheckoutAction(input: {
  productKey: string;
  analysisId?: string | null;
  propertyId?: string | null;
  organizationId?: string | null;
  promoCode?: string | null;
  billing: {
    name: string;
    email: string;
    company?: string;
    street?: string;
    city?: string;
    zip?: string;
    country?: string;
    vatId?: string;
  };
  acceptPurchaseTerms: true;
  idempotencyKey?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const { assertNoMarketingBundledWithPurchase } = await import(
    "@/domains/commerce/purchase-consent"
  );
  const marketingGuard = assertNoMarketingBundledWithPurchase(
    input as {
      acceptMarketing?: unknown;
      marketingOptIn?: unknown;
      marketingConsent?: unknown;
    },
  );
  if (!marketingGuard.ok) {
    return { ok: false as const, error: marketingGuard.error };
  }

  const parsed = parseCheckoutOrderInput(input);

  if (!parsed.success) {
    return { ok: false as const, error: "Neplatné údaje objednávky." };
  }

  const result = await createCheckoutOrder({
    userId,
    productKey: parsed.data.productKey,
    analysisId: parsed.data.analysisId,
    propertyId: parsed.data.propertyId,
    organizationId: parsed.data.organizationId,
    promoCode: parsed.data.promoCode,
    billing: parsed.data.billing,
    acceptPurchaseTerms: true,
    idempotencyKey: parsed.data.idempotencyKey,
    currency: commerceConfig.currency,
  });

  if (!result.ok) return result;

  revalidatePath("/ucet/objednavky");
  revalidatePath("/checkout");
  return result;
}

export async function getMyOrderAction(input: { orderId: string }) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const order = await getOrderForUser({ userId, orderId: input.orderId });
  if (!order) return { ok: false as const, error: "Objednávka nenalezena." };
  return { ok: true as const, order };
}

export async function listMyOrdersAction() {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const, orders: [] };
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      productKey: true,
      priceVersionKey: true,
      amountGrossMinor: true,
      amountNetMinor: true,
      amountVatMinor: true,
      vatRateBp: true,
      currency: true,
      discountMinor: true,
      promoCodeSnapshot: true,
      createdAt: true,
      paidAt: true,
      items: {
        select: {
          planName: true,
          planVersionKey: true,
          lineGrossMinor: true,
          unitListGrossMinor: true,
        },
      },
    },
  });
  return { ok: true as const, orders };
}
