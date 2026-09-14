"use client";

import * as React from "react";

import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { Switch } from "@/components/forms/controls";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  markAllInboxRead,
  markNotificationRead,
  markPropertyAlertRead,
  saveNotificationPrefs,
  type InboxItem,
  type NotificationsPageData,
} from "@/lib/account/notifications-actions";
import { formatDateTime } from "@/lib/format";

export function NotificationsPanel({ initial }: { initial: NotificationsPageData }) {
  const [prefs, setPrefs] = React.useState(initial.prefs);
  const [items, setItems] = React.useState(initial.items);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const unreadCount = items.filter((i) => i.unread).length;

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

  function markLocalRead(id: string) {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, unread: false, readAt: new Date().toISOString() } : n,
      ),
    );
  }

  async function onMarkRead(item: InboxItem) {
    if (item.kind === "property_alert") {
      await markPropertyAlertRead(item.id);
    } else {
      await markNotificationRead(item.id);
    }
    markLocalRead(item.id);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-[var(--text-primary)]">Upozornění</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Inbox změn u oblíbených nemovitostí a uložených hledání. Transakční
            zprávy jsou oddělené od marketingu.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              void markAllInboxRead().then((r) => {
                if (!r.ok) {
                  setError(r.error);
                  return;
                }
                setItems((prev) =>
                  prev.map((n) => ({
                    ...n,
                    unread: false,
                    readAt: n.readAt ?? new Date().toISOString(),
                  })),
                );
              });
            }}
          >
            Označit vše přečtené ({unreadCount})
          </Button>
        ) : null}
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
              Ceny, stavy nabídek, shody s hledáním, bezpečnost a objednávky.
              Nikdy nevyžadují marketingový souhlas.
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
              Tipové a tipovací zprávy. Výchozí stav je vypnuto — musíte je zapnout
              sami. Property alerty sem nepatří.
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
            description="Až se změní cena nebo stav oblíbené nemovitosti, uvidíte to tady."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={`${item.kind}:${item.id}`}>
                <Card padding="md" variant={item.unread ? "static" : "muted"}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.kind === "property_alert" ? (
                          <StatusBadge tone="neutral">{item.typeLabel}</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">{item.category}</StatusBadge>
                        )}
                        {item.unread ? (
                          <StatusBadge tone="info">Nepřečtené</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">Přečtené</StatusBadge>
                        )}
                      </div>
                      <p className="mt-2 font-medium text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      {item.body ? (
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {item.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        {formatDateTime(item.createdAt)}
                        {item.kind === "property_alert" && item.propertyTitle
                          ? ` · ${item.propertyTitle}`
                          : null}
                        {` · ${item.channel}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.href ? (
                        <ButtonLink href={item.href} size="sm" variant="secondary">
                          {item.ctaLabel}
                        </ButtonLink>
                      ) : null}
                      {item.unread ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            void onMarkRead(item);
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
