"use client";

import * as React from "react";

import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { Switch } from "@/components/forms/controls";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  markNotificationRead,
  saveNotificationPrefs,
  type NotificationsPageData,
} from "@/lib/account/notifications-actions";
import { formatDateTime } from "@/lib/format";

export function NotificationsPanel({ initial }: { initial: NotificationsPageData }) {
  const [prefs, setPrefs] = React.useState(initial.prefs);
  const [items, setItems] = React.useState(initial.items);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function persist(next: typeof prefs) {
    setSaving(true);
    setError(null);
    setMessage(null);
    const result = await saveNotificationPrefs(next);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPrefs(next);
    setMessage("Preference upozornění uloženy.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">Upozornění</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Transakční zprávy (bezpečnost, objednávky) a marketing odděleně. Marketing není
          předvyplněný.
        </p>
      </div>

      {message ? (
        <InlineAlert tone="success" title="Uloženo">
          {message}
        </InlineAlert>
      ) : null}
      {error ? (
        <InlineAlert tone="error" title="Chyba">
          {error}
        </InlineAlert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Transakční</CardTitle>
            <CardDescription>
              Potřebné provozní zprávy. Reset hesla a kritická bezpečnostní upozornění mohou přijít
              i při vypnutí e-mailu.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Switch
              label="E-mail — transakční"
              checked={prefs.transactionalEmail}
              disabled={saving}
              onCheckedChange={(checked) =>
                void persist({ ...prefs, transactionalEmail: checked })
              }
            />
            <Switch
              label="V aplikaci — transakční"
              checked={prefs.transactionalInApp}
              disabled={saving}
              onCheckedChange={(checked) =>
                void persist({ ...prefs, transactionalInApp: checked })
              }
            />
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Marketingové</CardTitle>
            <CardDescription>
              Tipové a tipovací zprávy. Výchozí stav je vypnuto — musíte je zapnout sami.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Switch
              label="E-mail — marketing"
              checked={prefs.marketingEmail}
              disabled={saving}
              onCheckedChange={(checked) =>
                void persist({ ...prefs, marketingEmail: checked })
              }
            />
            <Switch
              label="V aplikaci — marketing"
              checked={prefs.marketingInApp}
              disabled={saving}
              onCheckedChange={(checked) =>
                void persist({ ...prefs, marketingInApp: checked })
              }
            />
          </div>
        </Card>
      </div>

      <section className="space-y-4" aria-labelledby="notif-list">
        <h2 id="notif-list" className="text-h3 text-[var(--text-primary)]">
          Schránka
        </h2>
        {items.length === 0 ? (
          <EmptyState
            title="Zatím žádná upozornění"
            description="Až vám přijde transakční nebo marketingová zpráva, uvidíte ji tady."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Card padding="md" variant={item.readAt ? "muted" : "static"}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                      {item.body ? (
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.body}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        {formatDateTime(item.createdAt)} · {item.channel} · {item.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!item.readAt ? <StatusBadge tone="info">Nové</StatusBadge> : null}
                      {!item.readAt ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            void markNotificationRead(item.id).then(() => {
                              setItems((prev) =>
                                prev.map((n) =>
                                  n.id === item.id
                                    ? { ...n, readAt: new Date().toISOString() }
                                    : n,
                                ),
                              );
                            });
                          }}
                        >
                          Označit přečtené
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
