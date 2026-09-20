"use client";

import { useState } from "react";

import {
  applicableFeatureDefs,
  LAND_UTILITY_KEYS,
  LAND_UTILITY_LABELS,
  UTILITY_STATUS_LABELS,
  type FeatureKey,
  type FeaturePresence,
} from "@/domains/properties/parameters";

const labelClass = "block text-sm font-medium text-[var(--text-primary)]";
const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm";

function PresenceToggle({
  name,
  label,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  value: FeaturePresence;
  onChange: (value: FeaturePresence) => void;
  error?: string;
}) {
  const option = (presence: FeaturePresence, text: string) => {
    const selected = value === presence;
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onChange(presence)}
        className={`min-w-[4.5rem] rounded-lg border px-3 py-2 text-sm font-medium ${
          selected
            ? "border-[var(--action-primary)] bg-[var(--action-primary)] text-[var(--text-inverse)] ring-2 ring-[var(--focus-ring)] ring-offset-1"
            : "border-[var(--border-default)] text-[var(--text-secondary)]"
        }`}
      >
        {text}
      </button>
    );
  };
  return (
    <div id={name} className="space-y-2">
      <p className={labelClass}>{label}</p>
      <input type="hidden" name={name} value={value === "unset" ? "" : value} />
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {option("yes", "Ano")}
        {option("no", "Ne")}
      </div>
      {value === "unset" ? (
        <p className="text-xs text-[var(--text-muted)]">Zatím nevyplněno — při publikaci je odpověď povinná.</p>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function ListingFeaturesFields({
  propertyType,
  initialAnswers,
  fieldErrors,
}: {
  propertyType: string;
  initialAnswers?: Partial<Record<FeatureKey, FeaturePresence>>;
  fieldErrors?: Record<string, string>;
}) {
  const defs = applicableFeatureDefs(propertyType);
  const [answers, setAnswers] = useState<Partial<Record<FeatureKey, FeaturePresence>>>(
    () => initialAnswers ?? {},
  );

  return (
    <fieldset className="space-y-6">
      <legend className="font-display text-lg text-[var(--text-primary)]">
        Vybavení a příslušenství
      </legend>
      <p className="text-sm text-[var(--text-secondary)]">
        U každé položky výslovně zvolte Ano nebo Ne. Nic není předvybrané. Chybějící odpověď
        není totéž co Ne.
      </p>

      <div className="space-y-6">
        {defs.map((def) => {
          const presence = answers[def.key] ?? "unset";
          return (
            <div
              key={def.key}
              className="rounded-xl border border-[var(--border-default)] p-4"
            >
              <PresenceToggle
                name={`feature_${def.key}`}
                label={def.labelCs}
                value={presence}
                error={fieldErrors?.[`feature_${def.key}`]}
                onChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [def.key]: value }))
                }
              />
              {presence === "yes" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {def.allowsArea ? (
                    <>
                      <label className={labelClass}>
                        Plocha (m²)
                        <input
                          name={`feature_${def.key}_areaSqm`}
                          inputMode="decimal"
                          className={fieldClass}
                          placeholder="např. 6,2"
                        />
                      </label>
                      <label className="flex items-end gap-2 text-sm text-[var(--text-secondary)]">
                        <input type="checkbox" name={`feature_${def.key}_areaUnknown`} />
                        Přesnou výměru neznám
                      </label>
                    </>
                  ) : null}
                  {def.allowsCount ? (
                    <label className={labelClass}>
                      Počet
                      <input
                        name={`feature_${def.key}_count`}
                        inputMode="numeric"
                        className={fieldClass}
                      />
                    </label>
                  ) : null}
                  {def.key === "cellar" ? (
                    <label className={labelClass}>
                      Typ sklepa
                      <select name={`feature_${def.key}_cellarType`} className={fieldClass} defaultValue="">
                        <option value="">Neuvedeno</option>
                        <option value="room">Místnost</option>
                        <option value="cage">Kóje</option>
                        <option value="other">Jiné</option>
                      </select>
                    </label>
                  ) : null}
                  {def.key === "parking" ? (
                    <>
                      <label className={labelClass}>
                        Typ parkování
                        <select name={`feature_${def.key}_parkingType`} className={fieldClass} defaultValue="">
                          <option value="">Neuvedeno</option>
                          <option value="owned">Vlastní</option>
                          <option value="reserved">Vyhrazené</option>
                          <option value="rented">Pronajaté</option>
                          <option value="shared">Společné</option>
                        </select>
                      </label>
                      <label className={labelClass}>
                        Zahrnuto v ceně
                        <select name={`feature_${def.key}_includedInPrice`} className={fieldClass} defaultValue="">
                          <option value="">Neuvedeno</option>
                          <option value="yes">Ano</option>
                          <option value="no">Ne</option>
                        </select>
                      </label>
                    </>
                  ) : null}
                  {def.key === "garage" ? (
                    <label className={labelClass}>
                      Druh garáže
                      <select name={`feature_${def.key}_garageKind`} className={fieldClass} defaultValue="">
                        <option value="">Neuvedeno</option>
                        <option value="separate">Samostatná</option>
                        <option value="in_building">V domě</option>
                        <option value="collective">Hromadná</option>
                      </select>
                    </label>
                  ) : null}
                  {def.key === "garden" ? (
                    <label className={labelClass}>
                      Užívání zahrady
                      <select name={`feature_${def.key}_gardenUse`} className={fieldClass} defaultValue="">
                        <option value="">Neuvedeno</option>
                        <option value="private">Vlastní</option>
                        <option value="shared">Společná</option>
                        <option value="exclusive">Výhradní užívání</option>
                      </select>
                    </label>
                  ) : null}
                  {def.allowsNote ? (
                    <label className={`${labelClass} sm:col-span-2`}>
                      Popis (volitelný, povinný bez známé výměry)
                      <textarea
                        name={`feature_${def.key}_note`}
                        rows={2}
                        maxLength={500}
                        className={fieldClass}
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {propertyType === "LAND" ? (
        <div className="space-y-3 rounded-xl border border-[var(--border-default)] p-4">
          <h3 className="font-medium">Sítě a přístup</h3>
          <p className="text-xs text-[var(--text-muted)]">
            „V dosahu“ není totéž co připojení.
          </p>
          {LAND_UTILITY_KEYS.map((key) => (
            <label key={key} className={labelClass}>
              {LAND_UTILITY_LABELS[key]}
              <select name={`utility_${key}`} className={fieldClass} defaultValue="">
                <option value="">Nevyplněno</option>
                {(Object.keys(UTILITY_STATUS_LABELS) as Array<keyof typeof UTILITY_STATUS_LABELS>).map(
                  (status) => (
                    <option key={status} value={status}>
                      {UTILITY_STATUS_LABELS[status]}
                    </option>
                  ),
                )}
              </select>
            </label>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}
