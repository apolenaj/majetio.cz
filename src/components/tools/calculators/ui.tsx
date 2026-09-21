"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

import { formatCzk, formatPct } from "@/components/marketing/format";

export function moneyText(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatCzk(value);
}

export function pctText(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatPct(value, digits);
}

export function groupDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

export function MoneyField({
  label,
  value,
  onChange,
  hint,
  signed = false,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  hint?: string;
  signed?: boolean;
}) {
  const [text, setText] = useState(() => groupDigits(String(Math.round(value))));
  useEffect(() => {
    const rounded = Math.round(Number.isFinite(value) ? value : 0);
    const body = groupDigits(String(Math.abs(rounded)));
    setText(signed && rounded < 0 ? `−${body}` : body);
  }, [value, signed]);

  return (
    <div className="calc-field">
      <label>{label}</label>
      <input
        inputMode={signed ? "decimal" : "numeric"}
        value={text}
        onChange={(event) => {
          const raw = event.target.value;
          if (signed) {
            const negative = raw.trim().startsWith("-") || raw.trim().startsWith("−");
            const grouped = groupDigits(raw);
            setText(negative ? `−${grouped}` : grouped);
            const amount = Number(grouped.replace(/\D/g, "") || "0");
            onChange(negative ? -amount : amount);
            return;
          }
          const grouped = groupDigits(raw);
          setText(grouped);
          onChange(Number(grouped.replace(/\D/g, "") || "0"));
        }}
      />
      {hint ? <span className="calc-field-hint">{hint}</span> : null}
    </div>
  );
}

export function PercentField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  hint?: string;
}) {
  const [text, setText] = useState(() => String(value).replace(".", ","));
  useEffect(() => {
    setText(String(Number.isFinite(value) ? value : 0).replace(".", ","));
  }, [value]);

  return (
    <div className="calc-field">
      <label>{label}</label>
      <input
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          const next = event.target.value.replace(".", ",");
          setText(next);
          const parsed = Number(next.replace(/\s/g, "").replace(",", "."));
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
      />
      {hint ? <span className="calc-field-hint">{hint}</span> : null}
    </div>
  );
}

export function IntField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  hint?: string;
}) {
  return (
    <div className="calc-field">
      <label>{label}</label>
      <input
        inputMode="numeric"
        value={String(value)}
        onChange={(event) => {
          const parsed = Number(event.target.value.replace(/\D/g, ""));
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
      />
      {hint ? <span className="calc-field-hint">{hint}</span> : null}
    </div>
  );
}

export function Kpi({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
  hint?: string;
}) {
  return (
    <div className={`calc-stat calc-kpi calc-kpi-${tone ?? "neutral"}`}>
      <span>
        {label}
        {hint ? <InfoTip text={hint} /> : null}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  const id = useId();
  return (
    <button
      type="button"
      className="calc-tip"
      aria-describedby={id}
      title={text}
    >
      i
      <span id={id} role="tooltip" className="calc-tip-bubble">
        {text}
      </span>
    </button>
  );
}

export function Breakdown({
  rows,
}: {
  rows: { label: string; value: string; sign?: "+" | "−" | "=" }[];
}) {
  return (
    <ol className="calc-breakdown">
      {rows.map((row) => (
        <li key={row.label}>
          <span>
            {row.sign ? `${row.sign} ` : ""}
            {row.label}
          </span>
          <strong>{row.value}</strong>
        </li>
      ))}
    </ol>
  );
}

export function BarCompare({
  items,
}: {
  items: { label: string; value: number; display: string }[];
}) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return (
    <div className="calc-bars">
      {items.map((item) => (
        <div key={item.label} className="calc-bar-row">
          <div className="calc-bar-label">
            <span>{item.label}</span>
            <strong>{item.display}</strong>
          </div>
          <div className="calc-progress-track">
            <div
              className="calc-progress-fill"
              style={{ width: `${Math.min(100, (Math.abs(item.value) / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToolActions({
  onDemo,
  onReset,
}: {
  onDemo: () => void;
  onReset: () => void;
}) {
  return (
    <div className="calc-inline-actions">
      <button type="button" className="tools-btn-outline" onClick={onDemo}>
        Načíst modelový příklad
      </button>
      <button type="button" className="tools-btn-outline" onClick={onReset}>
        Vymazat
      </button>
    </div>
  );
}

export function ModeToggle({
  advanced,
  onChange,
}: {
  advanced: boolean;
  onChange: (advanced: boolean) => void;
}) {
  return (
    <div className="calc-mode" role="group" aria-label="Rozsah vstupů">
      <button
        type="button"
        aria-pressed={!advanced}
        className="tools-filter"
        onClick={() => onChange(false)}
      >
        Základní
      </button>
      <button
        type="button"
        aria-pressed={advanced}
        className="tools-filter"
        onClick={() => onChange(true)}
      >
        Pokročilé
      </button>
    </div>
  );
}

export const CALC_DISCLAIMER =
  "Výpočty jsou orientační model založený na zadaných předpokladech. Skutečné náklady, financování, výnosy a budoucí vývoj se mohou lišit.";

export function Disclaimer({ extra }: { extra?: string }) {
  return (
    <p className="calc-disclaimer">
      {CALC_DISCLAIMER}
      {extra ? ` ${extra}` : ""}
    </p>
  );
}

export function CrossLinks({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <div className="calc-links">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function readQueryNumber(
  query: Record<string, string | string[] | undefined> | undefined,
  key: string,
): number | null {
  const raw = query?.[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
