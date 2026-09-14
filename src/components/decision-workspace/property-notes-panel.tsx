"use client";

import * as React from "react";
import Link from "next/link";

import { Field, TextArea } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  deleteMyPropertyNoteAction,
  getMyPropertyNoteAction,
  saveMyPropertyNoteAction,
} from "@/domains/decision-workspace/server/actions";
import {
  NOTE_QUICK_TAGS,
  noteTagLabel,
} from "@/domains/decision-workspace/notes/tags";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";

/**
 * Private "Moje poznámky" — owner-only; never tracked / SEO.
 */
export function PropertyNotesPanel({
  propertyId,
  slug,
  isAuthenticated,
  returnPath,
}: {
  propertyId: string;
  slug: string;
  isAuthenticated: boolean;
  returnPath: string;
}) {
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const result = await getMyPropertyNoteAction({
        propertyIdOrSlug: propertyId,
      });
      if (cancelled) return;
      if (result.ok && result.note) {
        setContent(result.note.content.trim());
        setTags(result.note.tags);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, propertyId]);

  function toggleTag(id: string) {
    setTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function onSave() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await saveMyPropertyNoteAction({
      propertyIdOrSlug: propertyId,
      content,
      tags,
      slug,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error === "unauthorized" ? "Přihlášení je povinné." : result.error);
      return;
    }
    setMessage("Poznámka uložena (jen pro vás).");
    setContent(result.note.content.trim());
    setTags(result.note.tags);
  }

  async function onDelete() {
    setPending(true);
    setError(null);
    const result = await deleteMyPropertyNoteAction({
      propertyIdOrSlug: propertyId,
      slug,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setContent("");
    setTags([]);
    setMessage("Poznámka smazána.");
  }

  if (!isAuthenticated) {
    return (
      <Card padding="lg" className="space-y-3">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Moje poznámky
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Soukromé poznámky a štítky (prohlídka, SVJ, …) — jen pro přihlášené,
          bez SEO a bez analytiky obsahu.
        </p>
        <ButtonLink href={buildLoginUrl(returnPath)} variant="secondary" size="sm">
          Přihlásit se
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Moje poznámky
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Vidíte jen vy. Obsah se neindexuje a neodesílá do analytiky.
        </p>
      </div>

      {error ? (
        <InlineAlert tone="error" title="Uložení se nezdařilo">
          {error}
        </InlineAlert>
      ) : null}
      {message ? (
        <InlineAlert tone="success" title="Hotovo">
          {message}
        </InlineAlert>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
          Rychlé štítky
        </p>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_QUICK_TAGS.map((t) => {
            const active = tags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-[var(--action-primary)] bg-[color-mix(in_srgb,var(--action-primary)_12%,white)] text-[var(--text-primary)]"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {tags.length > 0 ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Vybrané: {tags.map(noteTagLabel).join(" · ")}
          </p>
        ) : null}
      </div>

      <Field id="property-note" label="Poznámka">
        <TextArea
          id="property-note"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={8000}
          placeholder={
            loaded ? "Např. dojem z prohlídky, otázky na SVJ…" : "Načítám…"
          }
          disabled={!loaded}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="button" loading={pending} onClick={() => void onSave()}>
          Uložit poznámku
        </Button>
        {content || tags.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => void onDelete()}
          >
            Smazat
          </Button>
        ) : null}
        <Link
          href="/ucet/oblibene"
          className="self-center text-sm text-[var(--text-muted)] underline-offset-2 hover:underline"
        >
          Oblíbené
        </Link>
      </div>
    </Card>
  );
}

/** Short private preview for comparison columns. */
export function NotePreviewChip({
  preview,
  tags,
}: {
  preview: string;
  tags: string[];
}) {
  if (!preview && tags.length === 0) return null;
  return (
    <div className="mt-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-2 py-1.5 text-xs text-[var(--text-secondary)]">
      <p className="font-medium text-[var(--text-muted)]">Moje poznámka</p>
      {tags.length > 0 ? (
        <p className="mt-0.5">{tags.map(noteTagLabel).join(" · ")}</p>
      ) : null}
      {preview ? (
        <p className="mt-0.5 line-clamp-2">{preview}</p>
      ) : null}
    </div>
  );
}
