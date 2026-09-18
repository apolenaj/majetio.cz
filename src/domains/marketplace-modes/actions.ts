"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import {
  declareModeInterest,
  withdrawModeInterest,
  placeAuctionBid,
} from "@/domains/marketplace-modes/service";
import { SUCCESS_FEE_BILLING_ENABLED } from "@/config/success-fee-packages";
import { prisma } from "@/lib/db";

export type ModeActionResult =
  | { ok: true; message?: string; status?: string }
  | { ok: false; error: string };

export async function declareModeInterestAction(
  formData: FormData,
): Promise<ModeActionResult> {
  const session = await auth();
  const parsed = z
    .object({
      mode: z.enum([
        "SHARED_INVESTMENT",
        "PARTIAL_BUY",
        "SHARED_RENT",
        "OFFER_PRICE",
        "SWAP",
        "HOUSING_HELP",
        "AUCTION",
        "FOREIGN_INFO",
      ]),
      propertyId: z.string().optional(),
      sharePct: z.coerce.number().optional(),
      amountMinor: z.coerce.number().optional(),
      message: z.string().max(4000).optional(),
      payloadJson: z.string().optional(),
    })
    .safeParse({
      mode: formData.get("mode"),
      propertyId: formData.get("propertyId") || undefined,
      sharePct: formData.get("sharePct") || undefined,
      amountMinor: formData.get("amountMinor") || undefined,
      message: formData.get("message") || undefined,
      payloadJson: formData.get("payloadJson") || undefined,
    });

  if (!parsed.success) {
    return { ok: false, error: "Neplatný formulář." };
  }

  let payload: Prisma.InputJsonValue | undefined;
  if (parsed.data.payloadJson) {
    try {
      payload = JSON.parse(parsed.data.payloadJson) as Prisma.InputJsonValue;
    } catch {
      return { ok: false, error: "Neplatný payload." };
    }
  }

  const result = await declareModeInterest({
    mode: parsed.data.mode,
    propertyId: parsed.data.propertyId,
    userId: session?.user?.id,
    sharePct: parsed.data.sharePct,
    amountMinor: parsed.data.amountMinor,
    message: parsed.data.message,
    payload,
  });
  if (!result.ok) return result;

  const waitlistNote =
    result.status === "WAITLIST"
      ? " Požadovaný podíl přesahuje dostupnou kapacitu — jste na čekací listině."
      : "";

  return {
    ok: true,
    message: `Zájem zaznamenán (${result.status}). Nejde o převod vlastnictví ani o přijetí peněz.${waitlistNote}`,
    status: result.status,
  };
}

export async function withdrawModeInterestAction(
  interestId: string,
): Promise<ModeActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlaste se." };
  const result = await withdrawModeInterest({
    interestId,
    userId: session.user.id,
  });
  if (!result.ok) return result;
  return { ok: true, message: "Zájem odvolán." };
}

export async function placeAuctionBidAction(
  formData: FormData,
): Promise<ModeActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlaste se." };
  const auctionId = String(formData.get("auctionId") || "");
  const amountMinor = Number(formData.get("amountMinor"));
  const result = await placeAuctionBid({
    auctionId,
    bidderUserId: session.user.id,
    amountMinor,
  });
  if (!result.ok) return result;
  return {
    ok: true,
    message:
      "Příhoz přijat (serverový čas). Nejvyšší příhoz ≠ převod nemovitosti — ostrá aukce čeká na právní pravidla.",
  };
}

export async function requestSuccessFeeEngagementAction(
  formData: FormData,
): Promise<ModeActionResult> {
  if (SUCCESS_FEE_BILLING_ENABLED) {
    return {
      ok: false,
      error: "Automatické účtování zatím není aktivní — kontaktujte provoz.",
    };
  }
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlaste se." };

  const actorKind = String(formData.get("actorKind") || "");
  const tier = String(formData.get("tier") || "");
  const ratePct = Number(formData.get("ratePct"));
  const ratePctMaxRaw = formData.get("ratePctMax");
  const transaction = String(formData.get("transaction") || "SALE");
  const propertyId = String(formData.get("propertyId") || "") || null;
  const notes = String(formData.get("notes") || "") || null;

  if (!actorKind || !tier || !(ratePct > 0)) {
    return { ok: false, error: "Vyberte balíček." };
  }

  await prisma.successFeeEngagement.create({
    data: {
      userId: session.user.id,
      propertyId,
      actorKind,
      tier,
      ratePct,
      ratePctMax:
        ratePctMaxRaw != null && String(ratePctMaxRaw) !== ""
          ? Number(ratePctMaxRaw)
          : null,
      transaction,
      status: "REQUESTED",
      notes,
    },
  });

  return {
    ok: true,
    message:
      "Nezávazné sjednání balíčku odesláno. Automatická platba se nespouští — viz otevřené obchodní otázky.",
  };
}
