"use client";

import { useActionState, useMemo, useState } from "react";

import {
  manageNegotiationAction,
  submitCoPurchaseAction,
  submitPriceOfferAction,
  type NegotiationActionResult,
} from "@/domains/listings/negotiations/actions";
import { proportionalAskingShare } from "@/domains/listings/negotiations/validate";
import { formatCzk } from "@/lib/format";

const initial: NegotiationActionResult | null = null;
const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm";

function Honeypot() {
  return (
    <label className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
      Webová stránka
      <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
    </label>
  );
}

function ContactFields({
  defaultName,
  defaultEmail,
}: {
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  return (
    <>
      <label className="block text-sm font-medium">
        Jméno
        <input name="buyerName" required defaultValue={defaultName ?? ""} className={fieldClass} maxLength={120} />
      </label>
      <label className="block text-sm font-medium">
        Kontaktní e-mail
        <input name="buyerEmail" type="email" required defaultValue={defaultEmail ?? ""} className={fieldClass} maxLength={200} />
      </label>
      <label className="block text-sm font-medium">
        Telefon (volitelně)
        <input name="buyerPhone" className={fieldClass} maxLength={40} />
      </label>
    </>
  );
}

function FinancingField() {
  return (
    <label className="block text-sm font-medium">
      Financování
      <select name="financing" defaultValue="UNKNOWN" className={fieldClass}>
        <option value="OWN_FUNDS">Vlastní prostředky</option>
        <option value="LOAN">Úvěr</option>
        <option value="MIXED">Kombinace</option>
        <option value="UNKNOWN">Zatím nevím</option>
      </select>
    </label>
  );
}

export function PriceOfferForm({
  propertyId,
  askingPrice,
  currency,
  defaultName,
  defaultEmail,
}: {
  propertyId: string;
  askingPrice: number | null;
  currency: string;
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: NegotiationActionResult | null, formData: FormData) => submitPriceOfferAction(formData),
    initial,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="relative space-y-3">
        <input type="hidden" name="propertyId" value={propertyId} />
        <Honeypot />
        <p className="text-sm text-[var(--text-secondary)]">
          Návrh se týká koupě celé nabízené nemovitosti, nebo celého nabízeného podílu. Není to sleva dopočítaná Majetiem.
        </p>
        {state && !state.ok ? <p className="text-sm text-red-700">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-[var(--text-primary)]">{state.message}</p> : null}
        <label className="block text-sm font-medium">
          Požadovaná kupní cena
          <span className="mt-1 block text-xs font-normal text-[var(--text-muted)]">
            {askingPrice != null
              ? "Výchozí hodnota je nabídková cena, ne automatická sleva."
              : "Nabídková cena není uvedená. Doplňte vlastní částku, sleva se nedoplňuje."}
          </span>
          <input
            name="amount"
            type="number"
            min={1}
            required
            defaultValue={askingPrice ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Měna
          <select name="currency" defaultValue={currency === "EUR" ? "EUR" : "CZK"} className={fieldClass}>
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <FinancingField />
        <label className="block text-sm font-medium">
          Termín koupě (volitelně)
          <input name="timeline" className={fieldClass} maxLength={120} />
        </label>
        <label className="block text-sm font-medium">
          Zpráva a podmínky (volitelně)
          <textarea name="message" rows={3} className={fieldClass} maxLength={4000} />
        </label>
        <ContactFields defaultName={defaultName} defaultEmail={defaultEmail} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Ukládám…" : "Odeslat cenový návrh"}
        </button>
        <p className="text-xs text-[var(--text-muted)]">Odesíláte nezávazný cenový návrh k projednání.</p>
      </form>
      {state?.ok && state.negotiationId && state.withdrawToken ? (
        <BuyerFollowUp negotiationId={state.negotiationId} withdrawToken={state.withdrawToken} />
      ) : null}
    </div>
  );
}

export function CoPurchaseForm({
  propertyId,
  askingPrice,
  offeredOwnershipPercent,
  allowSeekPartner,
  allowSellerRetains,
  defaultName,
  defaultEmail,
}: {
  propertyId: string;
  askingPrice: number | null;
  offeredOwnershipPercent: number | null;
  allowSeekPartner: boolean;
  allowSellerRetains: boolean;
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  const [share, setShare] = useState("50");
  const [custom, setCustom] = useState("");
  const [reference, setReference] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: NegotiationActionResult | null, formData: FormData) => submitCoPurchaseAction(formData),
    initial,
  );
  const listingIsShare =
    offeredOwnershipPercent != null && offeredOwnershipPercent >= 1 && offeredOwnershipPercent <= 99;
  const sharePercent = share === "custom" ? Number(custom) : Number(share);
  const proportion = useMemo(() => {
    if (!Number.isInteger(sharePercent) || sharePercent < 1 || sharePercent > 99) return null;
    if (listingIsShare && reference !== "WHOLE_PROPERTY" && reference !== "OFFERED_SHARE") return null;
    return proportionalAskingShare({
      askingPrice,
      sharePercent,
      shareReference: listingIsShare ? (reference as "WHOLE_PROPERTY" | "OFFERED_SHARE") : "WHOLE_PROPERTY",
      offeredOwnershipPercent,
    });
  }, [askingPrice, listingIsShare, offeredOwnershipPercent, reference, sharePercent]);

  if (!allowSeekPartner && !allowSellerRetains) return null;

  return (
    <div className="space-y-4">
      <form action={formAction} className="relative space-y-3">
        <input type="hidden" name="propertyId" value={propertyId} />
        <Honeypot />
        <p className="text-sm text-[var(--text-secondary)]">
          Nezávazná soukromá poptávka. Nevzniká rezervace, spoluvlastnictví ani potvrzené financování. Majetio dalšího kupujícího nehledá a peníze nevybírá.
        </p>
        {state && !state.ok ? <p className="text-sm text-red-700">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-[var(--text-primary)]">{state.message}</p> : null}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Situace</legend>
          {allowSeekPartner ? (
            <label className="flex gap-2 text-sm">
              <input type="radio" name="situation" value="SEEK_PARTNER" required defaultChecked={!allowSellerRetains} />
              Chci koupit část a hledám dalšího kupujícího pro zbytek. Hledání za mě nikdo nezajistí.
            </label>
          ) : null}
          {allowSellerRetains ? (
            <label className="flex gap-2 text-sm">
              <input type="radio" name="situation" value="SELLER_RETAINS" required defaultChecked={!allowSeekPartner} />
              Ptám se, zda by prodávající prodal jen část a zbytek si ponechal.
            </label>
          ) : null}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Požadovaný vlastnický podíl</legend>
          <p className="text-xs text-[var(--text-muted)]">Podíl v procentech není totéž co peněžní vklad. Z částky se právní podíl neodvozuje.</p>
          {["25", "50", "75"].map((value) => (
            <label key={value} className="flex gap-2 text-sm">
              <input type="radio" name="sharePercent" value={value} checked={share === value} onChange={() => setShare(value)} />
              {value} %
            </label>
          ))}
          <label className="flex gap-2 text-sm">
            <input type="radio" name="sharePercent" value="custom" checked={share === "custom"} onChange={() => setShare("custom")} />
            Vlastní hodnota
          </label>
          {share === "custom" ? (
            <input
              name="shareCustom"
              inputMode="numeric"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              className={fieldClass}
              placeholder="např. 33"
            />
          ) : null}
        </fieldset>

        {listingIsShare ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Čeho se procento týká</legend>
            <p className="text-xs text-[var(--text-muted)]">
              Tato nabídka prodává podíl {offeredOwnershipPercent} % celé nemovitosti. Bez této volby návrh neodešleme.
            </p>
            <label className="flex gap-2 text-sm">
              <input type="radio" name="shareReference" value="WHOLE_PROPERTY" required checked={reference === "WHOLE_PROPERTY"} onChange={() => setReference("WHOLE_PROPERTY")} />
              Část celé nemovitosti
            </label>
            <label className="flex gap-2 text-sm">
              <input type="radio" name="shareReference" value="OFFERED_SHARE" required checked={reference === "OFFERED_SHARE"} onChange={() => setReference("OFFERED_SHARE")} />
              Část nabízeného podílu
            </label>
          </fieldset>
        ) : (
          <input type="hidden" name="shareReference" value="WHOLE_PROPERTY" />
        )}

        {proportion && "label" in proportion ? (
          <p className="text-sm text-[var(--text-secondary)]">
            {proportion.label}: {formatCzk(proportion.amount)}. Není to ocenění podílu ani potvrzená cena spolukoupě.
          </p>
        ) : proportion && "note" in proportion ? (
          <p className="text-sm text-[var(--text-muted)]">{proportion.note}</p>
        ) : null}

        <label className="block text-sm font-medium">
          Plánovaný peněžní vklad v Kč
          <input name="cashContributionCzk" type="number" min={1} required className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          Návrh celkové kupní ceny (volitelně)
          <input name="proposedTotalPriceCzk" type="number" min={1} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">
          Účel
          <select name="purpose" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Vyberte</option>
            <option value="OWN_LIVING">Vlastní bydlení</option>
            <option value="LONG_TERM_RENT">Dlouhodobý pronájem</option>
            <option value="OTHER">Jiné</option>
          </select>
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Máte už dalšího spoluinvestora?</legend>
          <label className="flex gap-2 text-sm"><input type="radio" name="hasCoInvestor" value="yes" required /> Ano</label>
          <label className="flex gap-2 text-sm"><input type="radio" name="hasCoInvestor" value="no" required /> Ne</label>
        </fieldset>
        <FinancingField />
        <label className="block text-sm font-medium">
          Zpráva
          <textarea name="message" rows={3} className={fieldClass} maxLength={4000} />
        </label>
        <ContactFields defaultName={defaultName} defaultEmail={defaultEmail} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Ukládám…" : "Odeslat zájem o společnou koupi"}
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          Odesíláte nezávaznou poptávku k projednání. Nejde o rezervaci ani o veřejnou nabídku spoluinvestování.
        </p>
      </form>
      {state?.ok && state.negotiationId && state.withdrawToken ? (
        <BuyerFollowUp negotiationId={state.negotiationId} withdrawToken={state.withdrawToken} />
      ) : null}
    </div>
  );
}

function BuyerFollowUp({
  negotiationId,
  withdrawToken,
}: {
  negotiationId: string;
  withdrawToken: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: NegotiationActionResult | null, formData: FormData) => manageNegotiationAction(formData),
    initial,
  );
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border-default)] p-3">
      {state && !state.ok ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm">{state.message}</p> : null}
      <form action={action} className="space-y-2">
        <input type="hidden" name="negotiationId" value={negotiationId} />
        <input type="hidden" name="withdrawToken" value={withdrawToken} />
        <input type="hidden" name="intent" value="revise" />
        <label className="block text-sm font-medium">
          Upravit částku
          <input name="amount" type="number" min={1} required className={fieldClass} />
        </label>
        <button type="submit" disabled={pending} className="text-sm font-medium underline">
          Uložit novou verzi částky
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="negotiationId" value={negotiationId} />
        <input type="hidden" name="withdrawToken" value={withdrawToken} />
        <input type="hidden" name="intent" value="withdraw" />
        <button type="submit" disabled={pending} className="text-sm font-medium underline">
          Stáhnout návrh
        </button>
      </form>
    </div>
  );
}
