"use client";

import { useActionState } from "react";

import {
  submitPropertyInquiryAction,
  type ListingActionResult,
} from "@/domains/listings/seller/actions";

const initial: ListingActionResult | null = null;

export function PropertyInquiryForm({
  propertyId,
  defaultName,
  defaultEmail,
}: {
  propertyId: string;
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  const action = async (
    _prev: ListingActionResult | null,
    formData: FormData,
  ) => submitPropertyInquiryAction(formData);

  const [state, formAction, pending] = useActionState(action, initial);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="propertyId" value={propertyId} />
      {state && !state.ok ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-800">
          {state.message ?? "Poptávka odeslána."}
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        Jméno
        <input
          name="buyerName"
          defaultValue={defaultName ?? ""}
          className={fieldClass}
          maxLength={120}
        />
      </label>
      <label className="block text-sm font-medium">
        E-mail
        <input
          name="buyerEmail"
          type="email"
          defaultValue={defaultEmail ?? ""}
          className={fieldClass}
          maxLength={200}
        />
      </label>
      <label className="block text-sm font-medium">
        Telefon
        <input name="buyerPhone" className={fieldClass} maxLength={40} />
      </label>
      <label className="block text-sm font-medium">
        Zpráva
        <textarea
          name="message"
          required
          rows={4}
          className={fieldClass}
          maxLength={4000}
          placeholder="Mám zájem o prohlídku / více informací…"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Odesílám…" : "Odeslat poptávku"}
      </button>
      <p className="text-xs text-[var(--text-muted)]">
        Odesláním nevzniká závazek ani automatická odměna portálu.
      </p>
    </form>
  );
}
