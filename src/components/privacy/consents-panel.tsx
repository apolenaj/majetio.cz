"use client";

import * as React from "react";
import Link from "next/link";

import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { Switch } from "@/components/forms/controls";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import {
  setMarketingConsent,
  type ConsentsPageData,
} from "@/lib/privacy/consents";

export function ConsentsPanel({ initial }: { initial: ConsentsPageData }) {
  const [data, setData] = React.useState(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const marketing = data.consents.find((c) => c.type === "MARKETING");

  async function onMarketingToggle(granted: boolean) {
    setSaving(true);
    setError(null);
    const result = await setMarketingConsent({
      granted,
      source: "ucet/souhlasy",
      syncChannelPrefs: true,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setData((prev) => ({
      ...prev,
      consents: prev.consents.map((c) =>
        c.type === "MARKETING"
          ? {
              ...c,
              granted,
              grantedAt: granted ? new Date().toISOString() : c.grantedAt,
              revokedAt: granted ? null : new Date().toISOString(),
              source: "ucet/souhlasy",
            }
          : c,
      ),
    }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">Souhlasy a soukromí</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Přehled aktivních souhlasů, verzí textů a historie předání dat partnerům. Marketingový
          souhlas není nikdy předvyplněný.
        </p>
      </div>

      {error ? (
        <InlineAlert tone="error" title="Nelze uložit">
          {error}
        </InlineAlert>
      ) : null}

      <section className="space-y-4" aria-labelledby="active-consents">
        <h2 id="active-consents" className="text-h3 text-[var(--text-primary)]">
          Aktivní souhlasy
        </h2>
        <div className="space-y-3">
          {data.consents.map((consent) => (
            <Card key={consent.type} padding="lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle as="h3">{consent.title}</CardTitle>
                    <StatusBadge tone={consent.granted ? "success" : "neutral"}>
                      {consent.granted ? "Udělěn" : "Neudělěn / odvolán"}
                    </StatusBadge>
                    {consent.required ? (
                      <StatusBadge tone="info">Nutný pro účet</StatusBadge>
                    ) : null}
                  </div>
                  <CardDescription className="mt-2">{consent.description}</CardDescription>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Verze {consent.version}
                    {consent.grantedAt
                      ? ` · uděleno ${formatDateTime(consent.grantedAt)}`
                      : ""}
                    {consent.source ? ` · zdroj: ${consent.source}` : ""}
                  </p>
                </div>
                {consent.type === "MARKETING" ? (
                  <Switch
                    label="Marketingový souhlas"
                    checked={Boolean(marketing?.granted)}
                    disabled={saving}
                    onCheckedChange={(checked) => void onMarketingToggle(checked)}
                  />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="handoff-history">
        <h2 id="handoff-history" className="text-h3 text-[var(--text-primary)]">
          Historie předání dat
        </h2>
        {data.history.length === 0 ? (
          <EmptyState
            title="Zatím žádné předání"
            description="Když potvrdíte předání HypotekaJasne, uvidíte tady příjemce, účel a konkrétní pole."
            action={
              <Link
                href="/ucet/financni-profil"
                className="text-sm font-medium text-[var(--action-primary)] underline-offset-2 hover:underline"
              >
                Otevřít Finanční pas
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {data.history.map((item) => (
              <li key={item.id}>
                <Card padding="md">
                  <CardHeader>
                    <CardTitle as="h3">{item.recipient}</CardTitle>
                    <CardDescription>{item.purpose}</CardDescription>
                  </CardHeader>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">Datum</dt>
                      <dd>{formatDateTime(item.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">Verze souhlasu</dt>
                      <dd className="font-metric">{item.version}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">Zdroj</dt>
                      <dd>{item.source}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">Stav</dt>
                      <dd>{item.status}</dd>
                    </div>
                    {item.externalLeadId ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-[var(--text-muted)]">Reference</dt>
                        <dd className="font-metric">{item.externalLeadId}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-[var(--text-muted)]">Předaná pole</dt>
                      <dd className="mt-1 text-[var(--text-secondary)]">
                        {item.fields.length ? item.fields.join(", ") : "—"}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
