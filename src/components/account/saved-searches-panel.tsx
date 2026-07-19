"use client";

import Link from "next/link";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { Label } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteSavedSearch,
  renameSavedSearch,
  setSavedSearchAlertFrequency,
  type SavedSearchDto,
} from "@/domains/saved-searches/service/actions";
import { formatDateTime } from "@/lib/format";

const ALERT_OPTIONS = [
  { value: "OFF" as const, label: "Vypnuto" },
  { value: "INSTANT" as const, label: "Okamžitě" },
  { value: "WEEKLY" as const, label: "Týdně" },
];

type AlertFrequency = (typeof ALERT_OPTIONS)[number]["value"];

function summarizeFilters(item: SavedSearchDto): string {
  const s = item.state;
  const parts: string[] = [];
  if (s.lokalita) parts.push(s.lokalita);
  if (s.cenaDo != null) parts.push(`do ${Math.round(s.cenaDo / 1_000_000)} mil. Kč`);
  if (s.typ.length) parts.push(s.typ.join(", "));
  if (s.dispozice.length) parts.push(s.dispozice.join(", "));
  if (parts.length === 0) return "Bez filtrů (všechny nabídky)";
  return parts.join(" · ");
}

export function SavedSearchesPanel({
  initialItems,
}: {
  initialItems: SavedSearchDto[];
}) {
  const [items, setItems] = React.useState(initialItems);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function onRename(id: string) {
    setBusyId(id);
    setError(null);
    const result = await renameSavedSearch({ id, name: renameValue });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? result.item : i)));
    setRenamingId(null);
    setMessage("Hledání přejmenováno.");
  }

  async function onDelete(id: string) {
    if (!window.confirm("Opravdu smazat toto uložené hledání?")) return;
    setBusyId(id);
    setError(null);
    const result = await deleteSavedSearch(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setMessage("Hledání smazáno.");
  }

  async function onAlert(id: string, alertFrequency: AlertFrequency) {
    setBusyId(id);
    setError(null);
    const result = await setSavedSearchAlertFrequency({ id, alertFrequency });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? result.item : i)));
    setMessage("Upozornění aktualizováno.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">Uložená hledání</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Uložte filtry z katalogu a nastavte upozornění na nové nabídky nebo
          pokles ceny. Doručování e-mailů přijde později — zatím jen příprava.
        </p>
      </div>

      {message ? (
        <InlineAlert tone="success" title="Hotovo">
          {message}
        </InlineAlert>
      ) : null}
      {error ? (
        <InlineAlert tone="error" title="Chyba">
          {error}
        </InlineAlert>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Zatím žádná uložená hledání"
          description="Na stránce Nemovitosti nastavte filtry a klikněte na „Uložit hledání“."
          action={
            <ButtonLink href="/nemovitosti" size="sm">
              Procházet nemovitosti
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <Card padding="lg">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {renamingId === item.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="min-w-[12rem] flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2 text-sm"
                          maxLength={80}
                          aria-label="Nový název"
                        />
                        <Button
                          type="button"
                          size="sm"
                          loading={busyId === item.id}
                          onClick={() => void onRename(item.id)}
                        >
                          Uložit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setRenamingId(null)}
                        >
                          Zrušit
                        </Button>
                      </div>
                    ) : (
                      <CardTitle>
                        <Link href={item.href} className="hover:underline">
                          {item.name}
                        </Link>
                      </CardTitle>
                    )}
                    <CardDescription className="mt-1">
                      {summarizeFilters(item)}
                    </CardDescription>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Vytvořeno {formatDateTime(item.createdAt)} · filtry v
                      {item.filtersVersion}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRenamingId(item.id);
                        setRenameValue(item.name);
                      }}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Přejmenovat
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      loading={busyId === item.id}
                      onClick={() => void onDelete(item.id)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Smazat
                    </Button>
                  </div>
                </CardHeader>

                <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xs flex-1 space-y-1.5">
                    <Label htmlFor={`alert-${item.id}`}>Upozornění</Label>
                    <Select
                      id={`alert-${item.id}`}
                      value={item.alertFrequency}
                      disabled={busyId === item.id}
                      onChange={(e) =>
                        void onAlert(item.id, e.target.value as AlertFrequency)
                      }
                    >
                      {ALERT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <ButtonLink href={item.href} size="sm" variant="outline">
                    Spustit hledání
                  </ButtonLink>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
