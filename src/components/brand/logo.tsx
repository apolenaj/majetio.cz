import { BrandSymbol } from "@/components/brand/brand-symbol";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

export type LogoVariant = "light" | "dark" | "compact" | "symbol";

type LogoProps = {
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: { symbol: "h-6 w-6", gap: "gap-2", text: "text-lg" },
  md: { symbol: "h-7 w-7", gap: "gap-2.5", text: "text-xl" },
  lg: { symbol: "h-9 w-9", gap: "gap-3", text: "text-2xl" },
} as const;

/**
 * Brand logo lockup.
 * - light: for dark backgrounds (inherits light currentColor — set text color on parent)
 * - dark: for light backgrounds
 * - compact: symbol + wordmark tighter
 * - symbol: mark only
 */
export function Logo({
  variant = "dark",
  size = "md",
  className,
  label = "Majetio — úvodní stránka",
}: LogoProps) {
  const s = sizeMap[size];
  const colorClass =
    variant === "light"
      ? "text-[var(--color-canvas)]"
      : "text-[var(--color-ink)]";

  if (variant === "symbol") {
    return (
      <span className={cn("inline-flex", colorClass, className)} aria-label={label}>
        <BrandSymbol className={s.symbol} decorative />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center",
        s.gap,
        variant === "compact" && "gap-2",
        className,
      )}
      aria-label={label}
    >
      <BrandSymbol
        className={cn(
          s.symbol,
          variant === "light" ? "text-[#5ec4c1]" : "text-[var(--home-teal,#008f8c)]",
        )}
        decorative
      />
      <Wordmark
        className={cn(
          s.text,
          variant === "light" ? "text-[var(--color-canvas)]" : "text-[var(--home-navy,#07344a)]",
        )}
      />
    </span>
  );
}
