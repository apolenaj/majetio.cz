"use client";

import { useState } from "react";

const QUESTIONS = [
  "Vlastnictví a případné věcné břemeno",
  "Skutečná podlahová plocha a příslušenství",
  "PENB a stav rozvodů",
  "Měsíční platby domu",
  "Plánované opravy a fond oprav",
  "Co je a není v ceně",
];

export function CatalogViewingChecklist() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");

  return (
    <section id="prohlidka" className="mt-12">
      <h2 className="font-display text-2xl text-[var(--text-primary)]">Co ověřit</h2>
      <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
        PENB ani půdorys u této ukázky nejsou.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Připravit prohlídku
      </button>
      {open ? (
        <div className="mt-4 max-w-xl rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 print:border-0">
          <p className="text-sm text-[var(--text-secondary)]">
            Seznam je jen pro vás a makléři se odsud nic neposílá.
          </p>
          <ul className="mt-3 space-y-2">
            {QUESTIONS.map((question) => (
              <li key={question}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={done[question] === true}
                    onChange={() =>
                      setDone((current) => ({ ...current, [question]: !current[question] }))
                    }
                    className="mt-1"
                  />
                  <span>{question}</span>
                </label>
              </li>
            ))}
          </ul>
          <label className="mt-4 block text-sm">
            Poznámka po prohlídce
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-2"
            />
          </label>
          <button type="button" onClick={() => window.print()} className="mt-3 text-sm underline">
            Tisk seznamu
          </button>
        </div>
      ) : null}
    </section>
  );
}
