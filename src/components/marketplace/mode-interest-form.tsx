"use client";

import { useActionState } from "react";

import {
  declareModeInterestAction,
  type ModeActionResult,
} from "@/domains/marketplace-modes/actions";

const initial: ModeActionResult | null = null;

export function ModeInterestForm({
  mode,
  propertyId,
  showSharePct,
  showAmount,
  extraFields,
}: {
  mode: string;
  propertyId?: string;
  showSharePct?: boolean;
  showAmount?: boolean;
  extraFields?: React.ReactNode;
}) {
  const action = async (_p: ModeActionResult | null, formData: FormData) =>
    declareModeInterestAction(formData);
  const [state, formAction, pending] = useActionState(action, initial);
  const field =
    "mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm";

  return (
    <form action={formAction} className="mt-6 max-w-lg space-y-4">
      <input type="hidden" name="mode" value={mode} />
      {propertyId ? (
        <input type="hidden" name="propertyId" value={propertyId} />
      ) : null}
      {showSharePct ? (
        <label className="block text-sm font-medium">
          Požadovaný podíl (%)
          <input
            name="sharePct"
            type="number"
            min={0.1}
            max={100}
            step="0.1"
            required
            className={field}
          />
        </label>
      ) : null}
      {showAmount ? (
        <label className="block text-sm font-medium">
          Částka (haléře / minor units)
          <input name="amountMinor" type="number" min={1} required className={field} />
        </label>
      ) : null}
      {extraFields}
      <label className="block text-sm font-medium">
        Zpráva
        <textarea name="message" rows={3} className={field} maxLength={4000} />
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
        className="inline-flex h-11 items-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Odesílám…" : "Zaznamenat nezávazný zájem"}
      </button>
    </form>
  );
}
