"use client";

import { useMemo, useState } from "react";

import {
  proportionalAskingShare,
  validateCoPurchase,
  validatePriceOffer,
  outcomeMessage,
} from "@/domains/listings/negotiations/validate";
import { formatCzk } from "@/lib/format";

const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm";

/**
 * Formulář ukázkového inzerátu. Nevolá server a nezakládá produkční poptávku.
 */
export function DemoNegotiationForms({
  askingPrice,
  allowPriceOffers,
  allowSeekPartner,
  allowSellerRetains,
}: {
  askingPrice: number;
  allowPriceOffers: boolean;
  allowSeekPartner: boolean;
  allowSellerRetains: boolean;
}) {
  return (
    <div className="mt-6 space-y-6 border-t border-[var(--border-default)] pt-4">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Demonstrace. Záznam se neukládá a fiktivnímu inzerentovi se nic neposílá.
      </p>
      {allowPriceOffers ? <DemoPriceForm askingPrice={askingPrice} /> : null}
      {allowSeekPartner || allowSellerRetains ? (
        <DemoCoPurchaseForm
          askingPrice={askingPrice}
          allowSeekPartner={allowSeekPartner}
          allowSellerRetains={allowSellerRetains}
        />
      ) : null}
    </div>
  );
}

function DemoPriceForm({ askingPrice }: { askingPrice: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const parsed = validatePriceOffer({
          amount: data.get("amount"),
          currency: String(data.get("currency") ?? ""),
          financing: String(data.get("financing") ?? ""),
          timeline: String(data.get("timeline") ?? ""),
          message: String(data.get("message") ?? ""),
          buyerName: String(data.get("buyerName") ?? ""),
          buyerEmail: String(data.get("buyerEmail") ?? ""),
          buyerPhone: String(data.get("buyerPhone") ?? ""),
          honeypot: String(data.get("companyWebsite") ?? ""),
        });
        if (!parsed.ok) {
          setError(parsed.error);
          setMessage(null);
          return;
        }
        setError(null);
        setMessage(
          `Demonstrace je vyplněná správně. ${outcomeMessage("STORED_ONLY").text.replace("Návrh je uložený.", "V ukázce se návrh neukládá.")}`,
        );
      }}
    >
      <h3 className="font-display text-lg">Navrhnout kupní cenu</h3>
      <p className="text-sm text-[var(--text-secondary)]">
        Návrh se týká koupě celé nabízené nemovitosti. Výchozí cena je nabídková, ne sleva.
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm">{message}</p> : null}
      <label className="block text-sm font-medium">
        Požadovaná kupní cena
        <input name="amount" type="number" min={1} required defaultValue={askingPrice} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium">
        Měna
        <select name="currency" defaultValue="CZK" className={fieldClass}>
          <option value="CZK">CZK</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Financování
        <select name="financing" defaultValue="UNKNOWN" className={fieldClass}>
          <option value="OWN_FUNDS">Vlastní prostředky</option>
          <option value="LOAN">Úvěr</option>
          <option value="MIXED">Kombinace</option>
          <option value="UNKNOWN">Zatím nevím</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Jméno
        <input name="buyerName" required className={fieldClass} />
      </label>
      <label className="block text-sm font-medium">
        E-mail
        <input name="buyerEmail" type="email" required className={fieldClass} />
      </label>
      <button type="submit" className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
        Vyzkoušet cenový návrh
      </button>
      <p className="text-xs text-[var(--text-muted)]">Odesíláte nezávazný cenový návrh k projednání. V ukázce se nikam neposílá.</p>
    </form>
  );
}

function DemoCoPurchaseForm({
  askingPrice,
  allowSeekPartner,
  allowSellerRetains,
}: {
  askingPrice: number;
  allowSeekPartner: boolean;
  allowSellerRetains: boolean;
}) {
  const [share, setShare] = useState("50");
  const [custom, setCustom] = useState("");
  const [simulateShare, setSimulateShare] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const sharePercent = share === "custom" ? Number(custom) : Number(share);
  const proportion = useMemo(() => {
    if (!Number.isInteger(sharePercent)) return null;
    return proportionalAskingShare({
      askingPrice,
      sharePercent,
      shareReference: simulateShare && reference === "OFFERED_SHARE" ? "OFFERED_SHARE" : "WHOLE_PROPERTY",
      offeredOwnershipPercent: simulateShare ? 50 : null,
    });
  }, [askingPrice, reference, sharePercent, simulateShare]);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const pick = String(data.get("sharePercent") ?? "");
        const parsed = validateCoPurchase({
          situation: String(data.get("situation") ?? ""),
          allowSeekPartner,
          allowSellerRetains,
          sharePercent: pick === "custom" ? data.get("shareCustom") : pick,
          shareReference: simulateShare ? String(data.get("shareReference") ?? "") : "WHOLE_PROPERTY",
          offeredOwnershipPercent: simulateShare ? 50 : null,
          cashContributionCzk: data.get("cashContributionCzk"),
          proposedTotalPriceCzk: data.get("proposedTotalPriceCzk"),
          purpose: String(data.get("purpose") ?? ""),
          hasCoInvestor: String(data.get("hasCoInvestor") ?? ""),
          financing: String(data.get("financing") ?? ""),
          message: String(data.get("message") ?? ""),
          buyerName: String(data.get("buyerName") ?? ""),
          buyerEmail: String(data.get("buyerEmail") ?? ""),
          buyerPhone: "",
        });
        if (!parsed.ok) {
          setError(parsed.error);
          setMessage(null);
          return;
        }
        setError(null);
        setMessage("Demonstrace je vyplněná správně. Produkční poptávka nevznikla a nikomu se neposlala.");
      }}
    >
      <h3 className="font-display text-lg">Mám zájem o společnou koupi</h3>
      <p className="text-sm text-[var(--text-secondary)]">
        Dvě různé situace. Majetio dalšího kupujícího nehledá, peníze nevybírá a veřejnou nabídku spoluinvestování nezakládá.
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm">{message}</p> : null}
      {allowSeekPartner ? (
        <label className="flex gap-2 text-sm">
          <input type="radio" name="situation" value="SEEK_PARTNER" required />
          Chci část a dalšího kupujícího pro zbytek si musím zajistit sám.
        </label>
      ) : null}
      {allowSellerRetains ? (
        <label className="flex gap-2 text-sm">
          <input type="radio" name="situation" value="SELLER_RETAINS" required />
          Ptám se, zda by prodávající nechal zbytek sobě.
        </label>
      ) : null}
      {["25", "50", "75"].map((value) => (
        <label key={value} className="flex gap-2 text-sm">
          <input type="radio" name="sharePercent" value={value} checked={share === value} onChange={() => setShare(value)} />
          {value} % vlastnického podílu
        </label>
      ))}
      <label className="flex gap-2 text-sm">
        <input type="radio" name="sharePercent" value="custom" checked={share === "custom"} onChange={() => setShare("custom")} />
        Vlastní procento
      </label>
      {share === "custom" ? (
        <input name="shareCustom" value={custom} onChange={(event) => setCustom(event.target.value)} className={fieldClass} />
      ) : null}
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={simulateShare} onChange={(event) => setSimulateShare(event.target.checked)} />
        Demonstrace: simulovat, že inzerát nabízí jen 50% podíl. Není to údaj této ukázky.
      </label>
      {simulateShare ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Procento se vztahuje k</legend>
          <label className="flex gap-2 text-sm">
            <input type="radio" name="shareReference" value="WHOLE_PROPERTY" checked={reference === "WHOLE_PROPERTY"} onChange={() => setReference("WHOLE_PROPERTY")} />
            celé nemovitosti
          </label>
          <label className="flex gap-2 text-sm">
            <input type="radio" name="shareReference" value="OFFERED_SHARE" checked={reference === "OFFERED_SHARE"} onChange={() => setReference("OFFERED_SHARE")} />
            nabízeného podílu
          </label>
        </fieldset>
      ) : null}
      {proportion && "label" in proportion ? (
        <p className="text-sm">{proportion.label}: {formatCzk(proportion.amount)}.</p>
      ) : proportion && "note" in proportion ? (
        <p className="text-sm text-[var(--text-muted)]">{proportion.note}</p>
      ) : null}
      <label className="block text-sm font-medium">
        Peněžní vklad v Kč
        <input name="cashContributionCzk" type="number" min={1} required className={fieldClass} />
      </label>
      <label className="block text-sm font-medium">
        Návrh celkové ceny (volitelně)
        <input name="proposedTotalPriceCzk" type="number" min={1} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium">
        Účel
        <select name="purpose" required defaultValue="OWN_LIVING" className={fieldClass}>
          <option value="OWN_LIVING">Vlastní bydlení</option>
          <option value="LONG_TERM_RENT">Dlouhodobý pronájem</option>
          <option value="OTHER">Jiné</option>
        </select>
      </label>
      <label className="flex gap-2 text-sm"><input type="radio" name="hasCoInvestor" value="no" required /> Dalšího spoluinvestora nemám</label>
      <label className="flex gap-2 text-sm"><input type="radio" name="hasCoInvestor" value="yes" /> Dalšího spoluinvestora mám</label>
      <label className="block text-sm font-medium">
        Financování
        <select name="financing" defaultValue="UNKNOWN" className={fieldClass}>
          <option value="OWN_FUNDS">Vlastní prostředky</option>
          <option value="LOAN">Úvěr</option>
          <option value="MIXED">Kombinace</option>
          <option value="UNKNOWN">Zatím nevím</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Jméno
        <input name="buyerName" required className={fieldClass} />
      </label>
      <label className="block text-sm font-medium">
        E-mail
        <input name="buyerEmail" type="email" required className={fieldClass} />
      </label>
      <label className="block text-sm font-medium">
        Zpráva
        <textarea name="message" rows={2} className={fieldClass} />
      </label>
      <button type="submit" className="w-full rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-semibold">
        Vyzkoušet zájem o společnou koupi
      </button>
    </form>
  );
}
