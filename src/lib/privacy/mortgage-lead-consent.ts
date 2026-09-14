"use server";

import { auth } from "@/lib/auth";
import { requestMortgageLeadPiiDeletion } from "@/domains/leads/service/retention";

export async function withdrawMortgageLeadConsent(input: {
  correlationId: string;
}): Promise<
  | { ok: true; message: string }
  | { ok: false; error: string; code?: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Přihlášení je povinné." };
  }

  const result = await requestMortgageLeadPiiDeletion({
    userId: session.user.id,
    correlationId: input.correlationId,
    reason: "consent_withdrawal",
  });

  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  return {
    ok: true,
    message:
      "Citlivá data jsme v Majetio redigovali. Data již odeslaná do HypotekaJasne (banky) zůstávají u partnera — výmaz u partnera musíte řešit přímo s ním.",
  };
}
