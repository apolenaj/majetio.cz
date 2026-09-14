/**
 * Private note quick tags — UI labels only; never sent to analytics.
 */

export const NOTE_QUICK_TAGS = [
  { id: "prohlidka", label: "Prohlídka" },
  { id: "pravni", label: "Právní kontrola" },
  { id: "svj", label: "SVJ" },
  { id: "technicka", label: "Technická prohlídka" },
  { id: "hypoteka", label: "Hypotéka" },
  { id: "rekonstrukce", label: "Rekonstrukce" },
  { id: "cena", label: "Vyjednávání ceny" },
  { id: "dokumenty", label: "Dokumentace" },
  { id: "sousede", label: "Sousedé / lokalita" },
] as const;

export type NoteQuickTagId = (typeof NOTE_QUICK_TAGS)[number]["id"];

export function noteTagLabel(id: string): string {
  return NOTE_QUICK_TAGS.find((t) => t.id === id)?.label ?? id;
}

export function sanitizeNoteTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const allowed = new Set(NOTE_QUICK_TAGS.map((t) => t.id));
  return [
    ...new Set(
      tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter((t) => allowed.has(t as NoteQuickTagId)),
    ),
  ].slice(0, 12);
}
