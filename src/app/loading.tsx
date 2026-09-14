import { BrandSymbol } from "@/components/brand/brand-symbol";

export default function Loading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <BrandSymbol className="h-8 w-8 text-[var(--color-ink)]" decorative />
      <div className="skeleton h-2 w-24" />
      <p className="sr-only">Načítání…</p>
      <p className="text-sm text-[var(--color-ink-soft)]" aria-hidden>
        Načítání…
      </p>
    </div>
  );
}
