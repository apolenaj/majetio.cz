"use client";

import { useActionState } from "react";

import {
  requestSuccessFeeEngagementAction,
  type ModeActionResult,
} from "@/domains/marketplace-modes/actions";
import {
  ACTOR_LABELS_CS,
  SALE_SUCCESS_FEE_RATES,
  TIER_LABELS_CS,
  type SuccessFeeActor,
  type SuccessFeeTier,
} from "@/config/success-fee-packages";

const initial: ModeActionResult | null = null;

export function SuccessFeeEngageForm() {
  const action = async (_p: ModeActionResult | null, formData: FormData) =>
    requestSuccessFeeEngagementAction(formData);
  const [state, formAction, pending] = useActionState(action, initial);
  const field =
    "mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm";

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <label className="block text-sm font-medium">
        Role
        <select name="actorKind" required className={field} defaultValue="private">
          {(Object.keys(ACTOR_LABELS_CS) as SuccessFeeActor[]).map((a) => (
            <option key={a} value={a}>
              {ACTOR_LABELS_CS[a]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Tier
        <select name="tier" required className={field} defaultValue="basic">
          {(Object.keys(TIER_LABELS_CS) as SuccessFeeTier[]).map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS_CS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Sazba % (dle tabulky)
        <input
          name="ratePct"
          type="number"
          step="0.1"
          required
          defaultValue={SALE_SUCCESS_FEE_RATES.find(
            (r) => r.actor === "private" && r.tier === "basic",
          )?.ratePct}
          className={field}
        />
      </label>
      <input type="hidden" name="transaction" value="SALE" />
      <label className="block text-sm font-medium">
        Poznámka
        <textarea name="notes" rows={2} className={field} />
      </label>
      {state && !state.ok ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-800">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Odesílám…" : "Požádat o nezávazné sjednání"}
      </button>
    </form>
  );
}
