"use client";

import { useActionState } from "react";

import {
  manageNegotiationAction,
  type NegotiationActionResult,
} from "@/domains/listings/negotiations/actions";
import { formatCzk } from "@/lib/format";

const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Nové",
  IN_DISCUSSION: "V jednání",
  INFO_REQUESTED: "Vyžádáno doplnění",
  COUNTERED: "Protinávrh",
  REJECTED: "Odmítnuto",
  WITHDRAWN: "Staženo",
  CLOSED: "Uzavřeno",
};

const FINANCING_LABEL: Record<string, string> = {
  OWN_FUNDS: "Vlastní prostředky",
  LOAN: "Úvěr",
  MIXED: "Kombinace",
  UNKNOWN: "Zatím nevím",
};

const SITUATION_LABEL: Record<string, string> = {
  SEEK_PARTNER: "Zájemce hledá dalšího kupujícího pro zbytek",
  SELLER_RETAINS: "Dotaz, zda prodávající ponechá zbytek",
};

const PURPOSE_LABEL: Record<string, string> = {
  OWN_LIVING: "Vlastní bydlení",
  LONG_TERM_RENT: "Dlouhodobý pronájem",
  OTHER: "Jiné",
};

const SHARE_LABEL: Record<string, string> = {
  WHOLE_PROPERTY: "část celé nemovitosti",
  OFFERED_SHARE: "část nabízeného podílu",
};

export type NegotiationView = {
  id: string;
  kind: "PRICE_OFFER" | "CO_PURCHASE";
  status: string;
  amountCzk: number;
  currency: string;
  financing: string;
  timeline: string | null;
  message: string | null;
  situation: string | null;
  sharePercent: number | null;
  shareReference: string | null;
  cashContributionCzk: number | null;
  proposedTotalPriceCzk: number | null;
  purpose: string | null;
  hasCoInvestor: boolean | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  noticeStatus: string;
  createdAt: string;
  versions: Array<{
    id: string;
    actor: string;
    amountCzk: number | null;
    message: string | null;
    status: string;
    createdAt: string;
  }>;
};

const initial: NegotiationActionResult | null = null;

export function NegotiationManageCard({ item }: { item: NegotiationView }) {
  const [state, action, pending] = useActionState(
    async (_prev: NegotiationActionResult | null, formData: FormData) => manageNegotiationAction(formData),
    initial,
  );
  const closed = item.status === "REJECTED" || item.status === "WITHDRAWN" || item.status === "CLOSED";

  return (
    <article className="space-y-3 rounded-lg border border-[var(--border-default)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{STATUS_LABEL[item.status] ?? item.status}</p>
        <time className="text-xs text-[var(--text-muted)]" dateTime={item.createdAt}>
          {new Date(item.createdAt).toLocaleString("cs-CZ")}
        </time>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--text-muted)]">Částka zájemce</dt>
          <dd>{item.currency === "EUR" ? `${item.amountCzk} EUR` : formatCzk(item.amountCzk)}</dd>
        </div>
        {item.sharePercent != null ? (
          <div>
            <dt className="text-[var(--text-muted)]">Vlastnický podíl</dt>
            <dd>
              {`${item.sharePercent} procent${item.shareReference ? ` (${SHARE_LABEL[item.shareReference] ?? ""})` : ""}`}
            </dd>
          </div>
        ) : null}
        {item.cashContributionCzk != null ? (
          <div>
            <dt className="text-[var(--text-muted)]">Peněžní vklad</dt>
            <dd>{formatCzk(item.cashContributionCzk)}</dd>
          </div>
        ) : null}
        {item.situation ? (
          <div>
            <dt className="text-[var(--text-muted)]">Typ poptávky</dt>
            <dd>{SITUATION_LABEL[item.situation] ?? item.situation}</dd>
          </div>
        ) : (
          <div>
            <dt className="text-[var(--text-muted)]">Typ</dt>
            <dd>Cenový návrh na celou nabídku</dd>
          </div>
        )}
        <div>
          <dt className="text-[var(--text-muted)]">Financování</dt>
          <dd>{FINANCING_LABEL[item.financing] ?? item.financing}</dd>
        </div>
        {item.purpose ? (
          <div>
            <dt className="text-[var(--text-muted)]">Účel</dt>
            <dd>{PURPOSE_LABEL[item.purpose] ?? item.purpose}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[var(--text-muted)]">Kontakt</dt>
          <dd>
            {item.buyerName}
            <br />
            {item.buyerEmail}
            {item.buyerPhone ? <><br />{item.buyerPhone}</> : null}
          </dd>
        </div>
      </dl>
      {item.message ? <p className="text-sm text-[var(--text-secondary)]">{item.message}</p> : null}
      {item.timeline ? <p className="text-sm">Termín: {item.timeline}</p> : null}
      {item.proposedTotalPriceCzk != null ? (
        <p className="text-sm">Návrh celkové ceny: {formatCzk(item.proposedTotalPriceCzk)}</p>
      ) : null}
      {item.hasCoInvestor != null ? (
        <p className="text-sm">
          Další spoluinvestor: {item.hasCoInvestor ? "ano" : "ne"}. Majetio ho nehledá.
        </p>
      ) : null}
      <p className="text-xs text-[var(--text-muted)]">
        {item.noticeStatus === "SENT"
          ? "E-mailové upozornění odešlo."
          : item.noticeStatus === "FAILED"
            ? "Záznam je uložený, e-mail se neodeslal."
            : "Záznam je uložený. E-mailové upozornění se neodeslalo."}
      </p>
      {item.versions.length > 0 ? (
        <ol className="space-y-1 border-t border-[var(--border-default)] pt-2 text-xs text-[var(--text-secondary)]">
          {item.versions.map((version) => (
            <li key={version.id}>
              {new Date(version.createdAt).toLocaleString("cs-CZ")} · {version.actor === "SELLER" ? "Inzerent" : "Zájemce"} · {STATUS_LABEL[version.status] ?? version.status}
              {version.amountCzk != null ? ` · ${formatCzk(version.amountCzk)}` : ""}
              {version.message ? ` · ${version.message}` : ""}
            </li>
          ))}
        </ol>
      ) : null}
      {state && !state.ok ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm">{state.message}</p> : null}
      {!closed ? (
        <div className="flex flex-wrap gap-2">
          <form action={action}>
            <input type="hidden" name="negotiationId" value={item.id} />
            <input type="hidden" name="intent" value="IN_DISCUSSION" />
            <button type="submit" disabled={pending} className="rounded-full border px-3 py-1.5 text-sm">
              Souhlasím pokračovat v jednání
            </button>
          </form>
          <form action={action}>
            <input type="hidden" name="negotiationId" value={item.id} />
            <input type="hidden" name="intent" value="INFO_REQUESTED" />
            <button type="submit" disabled={pending} className="rounded-full border px-3 py-1.5 text-sm">
              Vyžádat doplnění
            </button>
          </form>
          <form action={action}>
            <input type="hidden" name="negotiationId" value={item.id} />
            <input type="hidden" name="intent" value="REJECTED" />
            <button type="submit" disabled={pending} className="rounded-full border px-3 py-1.5 text-sm">
              Odmítnout
            </button>
          </form>
          <form action={action}>
            <input type="hidden" name="negotiationId" value={item.id} />
            <input type="hidden" name="intent" value="CLOSED" />
            <button type="submit" disabled={pending} className="rounded-full border px-3 py-1.5 text-sm">
              Uzavřít jednání
            </button>
          </form>
        </div>
      ) : null}
      {!closed ? (
        <form action={action} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="negotiationId" value={item.id} />
          <input type="hidden" name="intent" value="counter" />
          <label className="text-sm">
            Protinávrh
            <input name="amount" type="number" min={1} required className={fieldClass} />
          </label>
          <label className="text-sm">
            Zpráva
            <input name="message" className={fieldClass} maxLength={4000} />
          </label>
          <button type="submit" disabled={pending} className="rounded-full bg-slate-900 px-3 py-2 text-sm text-white">
            Poslat protinávrh
          </button>
        </form>
      ) : null}
      <p className="text-xs text-[var(--text-muted)]">
        Souhlas znamená jen pokračovat v jednání. Nabídku nerezervuje a původní návrh zájemce nepřepisuje.
      </p>
    </article>
  );
}
