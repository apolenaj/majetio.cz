"use client";

import Link from "next/link";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Label } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteSavedSearch,
  renameSavedSearch,
  setSavedSearchAlertFrequency,
  type SavedSearchDto,
} from "@/domains/saved-searches/service/actions";
import { acknowledgeSavedSearchMatchesAction } from "@/domains/saved-searches/service/match-actions";
import { formatDateTime } from "@/lib/format";

const ALERT_OPTIONS = [
  { value: "OFF" as const, label: "Vypnuto" },
  { value: "INSTANT" as const, label: "Okamžitě" },
  { value: "DAILY" as const, label: "Denně" },
  { value: "WEEKLY" as const, label: "Týdně" },
];

type AlertFrequency = (typeof ALERT_OPTIONS)[number]["value"];

export type SavedSearchCardModel = {
  id: string;
  name: string;
  href: string;
  filterSummary: string;
  alertFrequency: string;
  alertFrequencyLabel: string;
  matchCount: number;
  newMatchCount: number;
  lastCheckedAt: string | null;
  createdAt: string;
};

function toCardModel(item: SavedSearchDto & Partial<SavedSearchCardModel>): SavedSearchCardModel {
  return {
    id: item.id,
    name: item.name,
    href: item.href,
    filterSummary: item.filterSummary ?? summarizeFromDto(item),
    alertFrequency: item.alertFrequency,
    alertFrequencyLabel:
      item.alertFrequencyLabel ??
      ALERT_OPTIONS.find((o) => o.value === item.alertFrequency)?.label ??
      item.alertFrequency,
    matchCount: item.matchCount ?? 0,
    newMatchCount: item.newMatchCount ?? 0,
    lastCheckedAt: item.lastCheckedAt ?? null,
    createdAt: item.createdAt,
  };
}

function summarizeFromDto(item: SavedSearchDto): string {
  const s = item.state;
  const parts: string[] = [];
  if (s.lokalita) parts.push(s.lokalita);
  if (s.cenaDo != null) parts.push(`do ${Math.round(s.cenaDo / 1_000_000)} mil. Kč`);
  if (s.typ.length) parts.push(s.typ.join(", "));
  if (s.dispozice.length) parts.push(s.dispozice.join(", "));
  if (parts.length === 0) return "Bez filtrů (všechny nabídky)";
  return parts.join(" · ");
}

export function SavedSearchCard({
  item,
  onChanged,
  onDeleted,
  compact = false,
}: {
  item: SavedSearchCardModel | (SavedSearchDto & Partial<SavedSearchCardModel>);
  onChanged?: (next: SavedSearchCardModel) => void;
  onDeleted?: (id: string) => void;
  compact?: boolean;
}) {
  const model = toCardModel(item as SavedSearchDto & Partial<SavedSearchCardModel>);
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(model.name);
  const [busy, setBusy] = React.useState(false);
  const [local, setLocal] = React.useState(model);

  React.useEffect(() => {
    setLocal(model);
  }, [model.id, model.newMatchCount, model.matchCount, model.name, model.alertFrequency]);

  async function onRename() {
    setBusy(true);
    const result = await renameSavedSearch({ id: local.id, name: renameValue });
    setBusy(false);
    if (!result.ok) return;
    const next = { ...local, name: result.item.name };
    setLocal(next);
    setRenaming(false);
    onChanged?.(next);
  }

  async function onDelete() {
    if (!window.confirm("Opravdu smazat toto uložené hledání?")) return;
    setBusy(true);
    const result = await deleteSavedSearch(local.id);
    setBusy(false);
    if (!result.ok) return;
    onDeleted?.(local.id);
  }

  async function onAlert(alertFrequency: AlertFrequency) {
    setBusy(true);
    const result = await setSavedSearchAlertFrequency({
      id: local.id,
      alertFrequency,
    });
    setBusy(false);
    if (!result.ok) return;
    const next = {
      ...local,
      alertFrequency: result.item.alertFrequency,
      alertFrequencyLabel:
        ALERT_OPTIONS.find((o) => o.value === result.item.alertFrequency)?.label ??
        result.item.alertFrequency,
    };
    setLocal(next);
    onChanged?.(next);
  }

  async function onOpenResults() {
    if (local.newMatchCount > 0) {
      await acknowledgeSavedSearchMatchesAction(local.id);
      const next = { ...local, newMatchCount: 0 };
      setLocal(next);
      onChanged?.(next);
    }
  }

  return (
    <Card padding={compact ? "md" : "lg"}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {renaming ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="min-w-[12rem] flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2 text-sm"
                maxLength={80}
                aria-label="Nový název"
              />
              <Button type="button" size="sm" loading={busy} onClick={() => void onRename()}>
                Uložit
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                Zrušit
              </Button>
            </div>
          ) : (
            <CardTitle>
              <Link href={local.href} className="hover:underline" onClick={() => void onOpenResults()}>
                {local.name}
              </Link>
            </CardTitle>
          )}
          <CardDescription className="mt-1">{local.filterSummary}</CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            {local.newMatchCount > 0 ? (
              <StatusBadge tone="info">
                {local.newMatchCount}{" "}
                {local.newMatchCount === 1
                  ? "nový výsledek"
                  : local.newMatchCount < 5
                    ? "nové výsledky"
                    : "nových výsledků"}
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral">{local.matchCount} odpovídá</StatusBadge>
            )}
            <span>
              Poslední kontrola:{" "}
              {local.lastCheckedAt ? formatDateTime(local.lastCheckedAt) : "ještě neběžela"}
            </span>
            <span>· Upozornění: {local.alertFrequencyLabel}</span>
          </div>
        </div>
        {!compact ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setRenaming(true);
                setRenameValue(local.name);
              }}
            >
              <Pencil className="size-3.5" aria-hidden />
              Přejmenovat
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              loading={busy}
              onClick={() => void onDelete()}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Smazat
            </Button>
          </div>
        ) : null}
      </CardHeader>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xs flex-1 space-y-1.5">
          <Label htmlFor={`alert-${local.id}`}>Frekvence upozornění</Label>
          <Select
            id={`alert-${local.id}`}
            value={local.alertFrequency}
            disabled={busy}
            onChange={(e) => void onAlert(e.target.value as AlertFrequency)}
          >
            {ALERT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <ButtonLink
          href={local.href}
          size="sm"
          variant="outline"
          onClick={() => void onOpenResults()}
        >
          Spustit hledání
        </ButtonLink>
      </div>
    </Card>
  );
}
