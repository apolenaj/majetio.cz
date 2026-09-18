"use client";

import { useActionState, useState } from "react";

import {
  createListingDraftAction,
  saveListingDraftAction,
  type ListingActionResult,
} from "@/domains/listings/seller/actions";

const initial: ListingActionResult | null = null;

type Defaults = {
  title?: string;
  description?: string;
  propertyType?: string;
  transactionType?: string;
  askingPrice?: number | null;
  currency?: string;
  usableArea?: number | null;
  layout?: string | null;
  condition?: string | null;
  ownershipType?: string | null;
  energyRating?: string | null;
  publicCity?: string | null;
  publicDistrict?: string | null;
  publicRegion?: string | null;
  marketCode?: string | null;
  rentMonthly?: number | null;
  servicesMonthly?: number | null;
  utilitiesMonthly?: number | null;
  deposit?: number | null;
  otherOneOffCosts?: number | null;
  availableFrom?: string | null;
  leaseTermMonths?: number | null;
  offerPriceEnabled?: boolean;
  privateThreshold?: number | null;
  willingToSwap?: boolean;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-primary)]";
const labelClass = "block text-sm font-medium text-[var(--text-primary)]";

export function SellerListingForm({
  mode,
  propertyId,
  defaults,
}: {
  mode: "create" | "edit";
  propertyId?: string;
  defaults?: Defaults;
}) {
  const [transactionType, setTransactionType] = useState(
    defaults?.transactionType ?? "SALE",
  );

  const action = async (
    _prev: ListingActionResult | null,
    formData: FormData,
  ): Promise<ListingActionResult> => {
    if (mode === "create") {
      return createListingDraftAction(formData);
    }
    if (!propertyId) return { ok: false, error: "Chybí ID nabídky." };
    return saveListingDraftAction(propertyId, formData);
  };

  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-8">
      {state && !state.ok ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {state.message}
        </p>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-[var(--text-primary)]">
          Základní údaje
        </legend>
        <label className={labelClass}>
          Název nabídky
          <input
            name="title"
            required
            defaultValue={defaults?.title ?? ""}
            className={fieldClass}
            maxLength={200}
          />
        </label>
        <label className={labelClass}>
          Popis
          <textarea
            name="description"
            rows={5}
            defaultValue={defaults?.description ?? ""}
            className={fieldClass}
            maxLength={20000}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Typ nemovitosti
            <select
              name="propertyType"
              defaultValue={defaults?.propertyType ?? "APARTMENT"}
              className={fieldClass}
            >
              <option value="APARTMENT">Byt</option>
              <option value="HOUSE">Dům</option>
              <option value="VILLA">Vila</option>
              <option value="TOWNHOUSE">Řadový dům</option>
              <option value="LAND">Pozemek</option>
              <option value="COMMERCIAL">Komerční</option>
              <option value="OTHER">Jiné</option>
            </select>
          </label>
          <label className={labelClass}>
            Transakce
            <select
              name="transactionType"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className={fieldClass}
            >
              <option value="SALE">Prodej</option>
              <option value="RENT">Pronájem</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-[var(--text-primary)]">
          Lokalita a cena
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            Město
            <input
              name="publicCity"
              required
              defaultValue={defaults?.publicCity ?? ""}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Čtvrť / okres
            <input
              name="publicDistrict"
              defaultValue={defaults?.publicDistrict ?? ""}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Kraj
            <input
              name="publicRegion"
              defaultValue={defaults?.publicRegion ?? ""}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            {transactionType === "RENT" ? "Nájemné (měsíčně)" : "Cena"}
            <input
              name="askingPrice"
              type="number"
              required
              min={1}
              defaultValue={defaults?.askingPrice ?? ""}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Měna
            <input
              name="currency"
              defaultValue={defaults?.currency ?? "CZK"}
              className={fieldClass}
              maxLength={3}
            />
          </label>
          <label className={labelClass}>
            Trh (kód)
            <input
              name="marketCode"
              defaultValue={defaults?.marketCode ?? "CZ"}
              className={fieldClass}
              maxLength={8}
            />
          </label>
        </div>
      </fieldset>

      {transactionType === "RENT" ? (
        <fieldset className="space-y-4">
          <legend className="font-display text-lg text-[var(--text-primary)]">
            Pronájem — oddělené náklady
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Služby / měsíc
              <input
                name="servicesMonthly"
                type="number"
                min={0}
                defaultValue={defaults?.servicesMonthly ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Energie / měsíc
              <input
                name="utilitiesMonthly"
                type="number"
                min={0}
                defaultValue={defaults?.utilitiesMonthly ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Kauce
              <input
                name="deposit"
                type="number"
                min={0}
                defaultValue={defaults?.deposit ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Další jednorázové náklady
              <input
                name="otherOneOffCosts"
                type="number"
                min={0}
                defaultValue={defaults?.otherOneOffCosts ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Dostupnost od
              <input
                name="availableFrom"
                type="date"
                defaultValue={defaults?.availableFrom ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Délka nájmu (měsíce)
              <input
                name="leaseTermMonths"
                type="number"
                min={1}
                defaultValue={defaults?.leaseTermMonths ?? ""}
                className={fieldClass}
              />
            </label>
          </div>
        </fieldset>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-[var(--text-primary)]">
          Parametry
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={labelClass}>
            Plocha (m²)
            <input
              name="usableArea"
              type="number"
              min={1}
              step="0.1"
              defaultValue={defaults?.usableArea ?? ""}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Dispozice
            <input
              name="layout"
              placeholder="3+kk"
              defaultValue={defaults?.layout ?? ""}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Stav
            <select
              name="condition"
              defaultValue={defaults?.condition ?? "UNKNOWN"}
              className={fieldClass}
            >
              <option value="UNKNOWN">Neuvedeno</option>
              <option value="NEW">Novostavba</option>
              <option value="EXCELLENT">Výborný</option>
              <option value="GOOD">Dobrý</option>
              <option value="AVERAGE">Průměrný</option>
              <option value="NEEDS_RENOVATION">K rekonstrukci</option>
            </select>
          </label>
          <label className={labelClass}>
            Vlastnictví
            <select
              name="ownershipType"
              defaultValue={defaults?.ownershipType ?? "UNKNOWN"}
              className={fieldClass}
            >
              <option value="UNKNOWN">Neuvedeno</option>
              <option value="PERSONAL">Osobní</option>
              <option value="COOPERATIVE">Družstevní</option>
              <option value="COMPANY">Firemní</option>
            </select>
          </label>
          <label className={labelClass}>
            Energetická náročnost
            <select
              name="energyRating"
              defaultValue={defaults?.energyRating ?? "UNKNOWN"}
              className={fieldClass}
            >
              <option value="UNKNOWN">Neuvedeno</option>
              {["A", "B", "C", "D", "E", "F", "G"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-[var(--text-primary)]">
          Režimy nabídky
        </legend>
        <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            name="offerPriceEnabled"
            value="on"
            defaultChecked={defaults?.offerPriceEnabled}
            className="mt-1"
          />
          <span>
            Aktivovat „Nabídněte cenu“ — zájemci posílají nezávazné nabídky. Neveřejný
            práh neuvidí nikdo kromě vás.
          </span>
        </label>
        <label className={labelClass}>
          Neveřejný cenový práh (volitelné)
          <input
            name="privateThreshold"
            type="number"
            min={1}
            defaultValue={defaults?.privateThreshold ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            name="willingToSwap"
            value="on"
            defaultChecked={defaults?.willingToSwap}
            className="mt-1"
          />
          <span>Ochota ke směně (protinabídky v dalším kroku jednání).</span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending
          ? "Ukládám…"
          : mode === "create"
            ? "Uložit koncept"
            : "Uložit změny"}
      </button>
      <p className="text-xs text-[var(--text-muted)]">
        Při chybě zůstanou vyplněná pole ve formuláři. Publikaci spustíte až po uložení
        konceptu.
      </p>
    </form>
  );
}
