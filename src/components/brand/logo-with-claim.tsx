import { Logo } from "@/components/brand/logo";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type LogoWithClaimProps = {
  className?: string;
  claim?: string;
  variant?: "light" | "dark";
};

/** Optional lockup — claim is never part of the core logo mark. */
export function LogoWithClaim({
  className,
  claim = brand.claims.short,
  variant = "dark",
}: LogoWithClaimProps) {
  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <Logo variant={variant} size="lg" />
      <p
        className={cn(
          "max-w-xs text-sm leading-snug",
          variant === "light"
            ? "text-[color-mix(in_srgb,var(--color-canvas)_80%,transparent)]"
            : "text-[var(--color-ink-soft)]",
        )}
      >
        {claim}
      </p>
    </div>
  );
}
