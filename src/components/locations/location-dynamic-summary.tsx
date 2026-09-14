/**
 * Dynamic market summary — factual copy from metrics (server component).
 */

export function LocationDynamicSummary({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Pro tuto lokalitu zatím není dostatek agregovaných metrik pro tržní shrnutí.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-5">
      <h2 className="font-display text-lg text-[var(--text-primary)]">
        Tržní shrnutí
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        {text}
      </p>
    </div>
  );
}
