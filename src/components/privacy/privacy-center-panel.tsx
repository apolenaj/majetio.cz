"use client";

import * as React from "react";
import Link from "next/link";

import { ConsentsPanel } from "@/components/privacy/consents-panel";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { ConsentsPageData } from "@/lib/privacy/consents";
import {
  requestAccountDeletionAction,
  requestSecureDataExportAction,
  withdrawPrivacyConsentAction,
} from "@/domains/privacy/privacy-actions";

export type PrivacyCenterConsentRecord = {
  id: string;
  purpose: string;
  recipient: string | null;
  sharedScope: unknown;
  version: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type PrivacyCenterData = {
  consents: ConsentsPageData;
  records: PrivacyCenterConsentRecord[];
  deletionRequestedAt: string | null;
  email: string;
};

export function PrivacyCenterPanel({ initial }: { initial: PrivacyCenterData }) {
  const [records, setRecords] = React.useState(initial.records);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [deletionRequestedAt, setDeletionRequestedAt] = React.useState(
    initial.deletionRequestedAt,
  );

  async function onExport(format: "json" | "csv") {
    setBusy(true);
    setError(null);
    setMessage(null);
    const tokenResult = await requestSecureDataExportAction({ format });
    if (!tokenResult.ok) {
      setBusy(false);
      setError(tokenResult.error);
      return;
    }

    const res = await fetch("/api/account/privacy-export", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenResult.token }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Export se nezdařil.");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      format === "csv" ? "majetio-export.csv" : "majetio-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage(
      "Export stažen. Token byl jednorázový a vyprší — žádná veřejná URL s daty.",
    );
  }

  async function onWithdraw(recordId: string) {
    setBusy(true);
    setError(null);
    const result = await withdrawPrivacyConsentAction({ recordId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              granted: false,
              revokedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
    setMessage("Souhlas byl odvolán (withdrawal).");
  }

  async function onDeletionRequest() {
    setBusy(true);
    setError(null);
    const result = await requestAccountDeletionAction({
      confirmEmail,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDeletionRequestedAt(new Date().toISOString());
    setMessage(
      "Žádost o výmaz účtu byla zaznamenána. Dokončení probíhá dle retenčního postupu.",
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-h2 text-[var(--text-primary)]">Privacy Center</h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          Správa souhlasů, cookies, bezpečný export dat a žádost o výmaz. Předání
          partnerům vždy s přesným příjemcem a účelem — ne obecný souhlas „s
          partnery“.
        </p>
        <p className="text-sm">
          <Link
            href="/ochrana-soukromi"
            className="text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            Ochrana soukromí
          </Link>
          {" · "}
          <Link
            href="/cookies"
            className="text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            Cookies
          </Link>
          {" · "}
          <Link
            href="/podminky"
            className="text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            Podmínky
          </Link>
        </p>
      </header>

      {error ? (
        <InlineAlert tone="error" title="Akce se nezdařila">
          {error}
        </InlineAlert>
      ) : null}
      {message ? (
        <InlineAlert tone="success" title="Hotovo">
          {message}
        </InlineAlert>
      ) : null}

      <ConsentsPanel initial={initial.consents} embedded />

      <section aria-labelledby="consent-ledger" className="space-y-4">
        <h2 id="consent-ledger" className="text-h3 text-[var(--text-primary)]">
          Ledger souhlasů (ConsentRecord)
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Účelové záznamy včetně cookies a partner share. U partnerů je vždy
          uveden příjemce a rozsah.
        </p>
        {records.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Zatím žádné ConsentRecord záznamy.
          </p>
        ) : (
          <ul className="space-y-3">
            {records.map((r) => (
              <li key={r.id}>
                <Card padding="lg">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle as="h3">{r.purpose}</CardTitle>
                      <StatusBadge tone={r.granted ? "success" : "neutral"}>
                        {r.granted ? "Udělěn" : "Odvolán"}
                      </StatusBadge>
                    </div>
                    <CardDescription>
                      Verze {r.version}
                      {r.recipient ? ` · příjemce: ${r.recipient}` : " · Majetio (first-party)"}
                      {r.grantedAt
                        ? ` · ${formatDateTime(r.grantedAt)}`
                        : r.revokedAt
                          ? ` · odvoláno ${formatDateTime(r.revokedAt)}`
                          : null}
                    </CardDescription>
                    {r.sharedScope ? (
                      <p className="mt-2 text-[var(--text-caption)] text-[var(--text-muted)]">
                        Rozsah:{" "}
                        {Array.isArray(r.sharedScope)
                          ? r.sharedScope.join(", ")
                          : JSON.stringify(r.sharedScope)}
                      </p>
                    ) : null}
                  </CardHeader>
                  {r.granted &&
                  r.purpose !== "COOKIE_NECESSARY" &&
                  r.purpose !== "LEGAL_TERMS" &&
                  r.purpose !== "LEGAL_PRIVACY" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onWithdraw(r.id)}
                    >
                      Odvolat souhlas
                    </Button>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="data-export" className="space-y-4">
        <h2 id="data-export" className="text-h3 text-[var(--text-primary)]">
          Export dat
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Stažení probíhá přes autentizovaný one-time token (15 min). Payload se
          neukládá na veřejnou URL.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void onExport("json")}
          >
            Export JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void onExport("csv")}
          >
            Export CSV
          </Button>
        </div>
      </section>

      <section aria-labelledby="account-deletion" className="space-y-4">
        <h2 id="account-deletion" className="text-h3 text-[var(--text-primary)]">
          Žádost o výmaz účtu
        </h2>
        {deletionRequestedAt ? (
          <InlineAlert tone="warning" title="Žádost evidována">
            Výmaz byl požádán {formatDateTime(deletionRequestedAt)}. Okamžité
            smazání s heslem je v{" "}
            <Link
              href="/ucet/nastaveni"
              className="font-medium underline-offset-2 hover:underline"
            >
              Nastavení
            </Link>
            .
          </InlineAlert>
        ) : (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              Zaznamená žádost o výmaz (audit +{" "}
              <code className="text-xs">deletionRequestedAt</code>). Pro okamžité
              smazání použijte Nastavení (heslo + e-mail).
            </p>
            <label className="block max-w-md text-sm">
              <span className="font-medium text-[var(--text-primary)]">
                Potvrďte e-mail účtu
              </span>
              <input
                type="email"
                autoComplete="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2"
                placeholder={initial.email}
              />
            </label>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || !confirmEmail}
              onClick={() => void onDeletionRequest()}
            >
              Požádat o výmaz
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
