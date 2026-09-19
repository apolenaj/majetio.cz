"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  createCoPurchase,
  createPriceOffer,
  manageNegotiation,
} from "@/domains/listings/negotiations/service";

export type NegotiationActionResult =
  | {
      ok: true;
      message: string;
      negotiationId?: string;
      withdrawToken?: string;
    }
  | { ok: false; error: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitPriceOfferAction(
  formData: FormData,
): Promise<NegotiationActionResult> {
  const session = await auth();
  const result = await createPriceOffer({
    propertyId: text(formData, "propertyId"),
    buyerUserId: session?.user?.id ?? null,
    amount: text(formData, "amount"),
    currency: text(formData, "currency"),
    financing: text(formData, "financing"),
    timeline: text(formData, "timeline"),
    message: text(formData, "message"),
    buyerName: text(formData, "buyerName"),
    buyerEmail: text(formData, "buyerEmail"),
    buyerPhone: text(formData, "buyerPhone"),
    honeypot: text(formData, "companyWebsite"),
  });
  if (!result.ok) return result;
  revalidatePath("/ucet/poptavky");
  return {
    ok: true,
    message: result.message,
    negotiationId: result.negotiationId,
    withdrawToken: result.withdrawToken,
  };
}

export async function submitCoPurchaseAction(
  formData: FormData,
): Promise<NegotiationActionResult> {
  const session = await auth();
  const sharePick = text(formData, "sharePercent");
  const result = await createCoPurchase({
    propertyId: text(formData, "propertyId"),
    buyerUserId: session?.user?.id ?? null,
    situation: text(formData, "situation"),
    sharePercent: sharePick === "custom" || sharePick === "" ? text(formData, "shareCustom") : sharePick,
    shareReference: text(formData, "shareReference"),
    cashContributionCzk: text(formData, "cashContributionCzk"),
    proposedTotalPriceCzk: text(formData, "proposedTotalPriceCzk"),
    purpose: text(formData, "purpose"),
    hasCoInvestor: text(formData, "hasCoInvestor"),
    financing: text(formData, "financing"),
    message: text(formData, "message"),
    buyerName: text(formData, "buyerName"),
    buyerEmail: text(formData, "buyerEmail"),
    buyerPhone: text(formData, "buyerPhone"),
    honeypot: text(formData, "companyWebsite"),
  });
  if (!result.ok) return result;
  revalidatePath("/ucet/poptavky");
  return {
    ok: true,
    message: result.message,
    negotiationId: result.negotiationId,
    withdrawToken: result.withdrawToken,
  };
}

export async function manageNegotiationAction(
  formData: FormData,
): Promise<NegotiationActionResult> {
  const session = await auth();
  const intent = text(formData, "intent");
  const negotiationId = text(formData, "negotiationId");
  const withdrawToken = text(formData, "withdrawToken") || null;
  const amount = Number(String(text(formData, "amount")).replace(/\s/g, ""));

  let event:
    | { type: "counter"; amountCzk: number; message?: string | null }
    | { type: "revise"; amountCzk: number }
    | { type: "withdraw" }
    | { type: "status"; status: "IN_DISCUSSION" | "INFO_REQUESTED" | "REJECTED" | "CLOSED" };

  if (intent === "withdraw") event = { type: "withdraw" };
  else if (intent === "revise") {
    if (!Number.isFinite(amount) || amount < 1) {
      return { ok: false, error: "Částka musí být kladná." };
    }
    event = { type: "revise", amountCzk: Math.round(amount) };
  } else if (intent === "counter") {
    if (!Number.isFinite(amount) || amount < 1) {
      return { ok: false, error: "Protinávrh musí být kladná částka." };
    }
    event = {
      type: "counter",
      amountCzk: Math.round(amount),
      message: text(formData, "message") || null,
    };
  } else if (
    intent === "IN_DISCUSSION" ||
    intent === "INFO_REQUESTED" ||
    intent === "REJECTED" ||
    intent === "CLOSED"
  ) {
    event = { type: "status", status: intent };
  } else {
    return { ok: false, error: "Neznámá akce." };
  }

  const result = await manageNegotiation({
    negotiationId,
    actorUserId: session?.user?.id ?? null,
    withdrawToken,
    event,
  });
  if (!result.ok) return result;
  revalidatePath("/ucet/nabidky");
  revalidatePath("/ucet/poptavky");
  return { ok: true, message: "Stav návrhu je uložený. Nabídka ani původní částka se tím nepřepisují." };
}
