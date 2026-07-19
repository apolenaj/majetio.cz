"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSavedSearch } from "@/domains/saved-searches/service/actions";
import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { buildPropertySearchHref } from "@/domains/properties/search/url-state";

function defaultName(state: PropertyUrlFilterState): string {
  const parts: string[] = [];
  if (state.lokalita) parts.push(state.lokalita);
  if (state.cenaDo != null) {
    parts.push(`do ${(state.cenaDo / 1_000_000).toFixed(1)} mil.`);
  }
  if (state.typ.length) parts.push(state.typ.join(", "));
  if (parts.length === 0) return `Hledání ${new Date().toLocaleDateString("cs-CZ")}`;
  return parts.join(" · ").slice(0, 80);
}

export function SaveSearchButton({
  state,
  isAuthenticated,
}: {
  state: PropertyUrlFilterState;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(() => defaultName(state));
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(defaultName(state));
  }, [state]);

  async function onSave() {
    setError(null);
    setMessage(null);
    if (!isAuthenticated) {
      const callback = buildPropertySearchHref(state);
      router.push(buildLoginUrl(callback));
      return;
    }
    setPending(true);
    const result = await createSavedSearch({
      name: name.trim() || defaultName(state),
      state,
      sort: state.razeni ?? "newest",
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Hledání uloženo.");
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          if (!isAuthenticated) {
            router.push(buildLoginUrl(buildPropertySearchHref(state)));
            return;
          }
          setOpen((v) => !v);
        }}
      >
        <BookmarkPlus className="size-4" aria-hidden />
        Uložit hledání
      </Button>

      {message ? (
        <p className="mt-2 text-xs text-[var(--status-success)]" role="status">
          {message}{" "}
          <a
            href="/ucet/ulozena-hledani"
            className="underline-offset-2 hover:underline"
          >
            Zobrazit
          </a>
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-[var(--status-error)]" role="alert">
          {error}
        </p>
      ) : null}

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-overlay)]">
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            Název
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              maxLength={80}
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              size="sm"
              loading={pending}
              onClick={() => void onSave()}
            >
              Uložit
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
