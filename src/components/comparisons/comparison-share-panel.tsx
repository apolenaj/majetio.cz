"use client";

/**
 * Explicit comparison sharing UI (BOD 78–81).
 * Never auto-publishes a public URL — user must choose include flags + create link.
 */

import * as React from "react";

import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createComparisonShareAction,
  listComparisonSharesAction,
  revokeComparisonShareAction,
} from "@/domains/comparisons/share/actions";
import {
  DEFAULT_SHARE_INCLUDE,
  type ShareIncludeFlags,
} from "@/domains/comparisons/share/share-safe";

const FLAG_LABELS: Record<keyof ShareIncludeFlags, string> = {
  basics: "Základní údaje (cena, lokalita)",
  valuation: "Odhad hodnoty",
  investment: "Výnosové metriky",
  renovation: "Rekonstrukce",
  risks: "Rizika",
  scores: "Majetio skóre",
};

type ShareRow = {
  id: string;
  mode: "INVITED_USERS" | "SECRET_LINK";
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  tokenPrefix: string | null;
  inviteCount: number;
};

export function ComparisonSharePanel({
  comparisonId,
}: {
  comparisonId: string;
}) {
  const [flags, setFlags] = React.useState<ShareIncludeFlags>({
    ...DEFAULT_SHARE_INCLUDE,
  });
  const [expiresInDays, setExpiresInDays] = React.useState(14);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [secretUrl, setSecretUrl] = React.useState<string | null>(null);
  const [shareId, setShareId] = React.useState<string | null>(null);
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null);
  const [shares, setShares] = React.useState<ShareRow[]>([]);

  async function refreshShares() {
    const result = await listComparisonSharesAction({ comparisonId });
    if (result.ok) setShares(result.shares);
  }

  React.useEffect(() => {
    void refreshShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per comparison
  }, [comparisonId]);

  async function createSecretLink() {
    setBusy(true);
    setError(null);
    setSecretUrl(null);
    try {
      const result = await createComparisonShareAction({
        comparisonId,
        mode: "SECRET_LINK",
        includeFlags: flags,
        expiresInDays,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShareId(result.shareId);
      setExpiresAt(result.expiresAt ?? null);
      if (result.rawToken) {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        setSecretUrl(`${origin}/sdilene/porovnani/${result.rawToken}`);
      }
      await refreshShares();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await revokeComparisonShareAction({ shareId: id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (shareId === id) {
        setShareId(null);
        setSecretUrl(null);
        setExpiresAt(null);
      }
      await refreshShares();
    } finally {
      setBusy(false);
    }
  }

  const activeShares = shares.filter((s) => !s.revokedAt);

  return (
    <Card className="space-y-4 p-5 print:hidden">
      <div>
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Sdílet porovnání
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Secret read-only odkaz pro partnera nebo poradce — high-entropy token,
          expirace a revokace. Nikdy neobsahuje Finanční pas, příjmy, osobní
          financování, soukromé poznámky ani důvody zamítnutí.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--text-primary)]">
          Co zahrnout (výslovný výběr)
        </legend>
        {(Object.keys(FLAG_LABELS) as Array<keyof ShareIncludeFlags>).map(
          (key) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
            >
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={(e) =>
                  setFlags((prev) => ({ ...prev, [key]: e.target.checked }))
                }
              />
              {FLAG_LABELS[key]}
            </label>
          ),
        )}
      </fieldset>

      <label className="block text-sm text-[var(--text-secondary)]">
        Platnost (dny)
        <select
          className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2"
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(Number(e.target.value))}
        >
          <option value={7}>7 dní</option>
          <option value={14}>14 dní</option>
          <option value={30}>30 dní</option>
          <option value={90}>90 dní</option>
        </select>
      </label>

      {error ? (
        <InlineAlert tone="warning" title="Sdílení se nepodařilo">
          {error}
        </InlineAlert>
      ) : null}

      {secretUrl ? (
        <InlineAlert tone="info" title="Secret odkaz (zobrazí se jen teď)">
          <p className="break-all text-sm">{secretUrl}</p>
          {expiresAt ? (
            <p className="mt-1 text-xs">
              Platnost do {new Date(expiresAt).toLocaleString("cs-CZ")}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void navigator.clipboard?.writeText(secretUrl)}
            >
              Kopírovat
            </Button>
            {shareId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                loading={busy}
                onClick={() => void revoke(shareId)}
              >
                Zrušit odkaz
              </Button>
            ) : null}
          </div>
        </InlineAlert>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={busy}
          onClick={() => void createSecretLink()}
        >
          Vytvořit secret odkaz
        </Button>
      )}

      {activeShares.length > 0 ? (
        <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Aktivní sdílení
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {activeShares.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {s.mode === "SECRET_LINK" ? "Secret odkaz" : "Pozvaní"}
                  {s.tokenPrefix ? ` · ${s.tokenPrefix}…` : ""}
                  {s.expiresAt
                    ? ` · do ${new Date(s.expiresAt).toLocaleDateString("cs-CZ")}`
                    : ""}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  loading={busy}
                  onClick={() => void revoke(s.id)}
                >
                  Revokovat
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-[var(--text-muted)]">
        Režim pozvaných uživatelů (partner / poradce bez veřejné URL) je dostupný
        přes server action <code className="mx-1">INVITED_USERS</code>. Veřejná
        URL se negeneruje automaticky.
      </p>
    </Card>
  );
}
