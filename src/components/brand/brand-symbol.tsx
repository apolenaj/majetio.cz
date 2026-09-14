import { cn } from "@/lib/utils";

type BrandSymbolProps = {
  className?: string;
  title?: string;
  decorative?: boolean;
};

/** Layered Asset symbol — single source for in-app logo marks. */
export function BrandSymbol({
  className,
  title = "Majetio",
  decorative = true,
}: BrandSymbolProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <path d="M4 6h4.2c.66 0 1.2.54 1.2 1.2v17.6c0 .66-.54 1.2-1.2 1.2H4c-.66 0-1.2-.54-1.2-1.2V7.2C2.8 6.54 3.34 6 4 6zm8.2 0H27c.66 0 1.2.54 1.2 1.2v2.6c0 .66-.54 1.2-1.2 1.2H12.2c-.66 0-1.2-.54-1.2-1.2V7.2c0-.66.54-1.2 1.2-1.2zm0 8H23.5c.66 0 1.2.54 1.2 1.2v2.6c0 .66-.54 1.2-1.2 1.2H12.2c-.66 0-1.2-.54-1.2-1.2v-2.6c0-.66.54-1.2 1.2-1.2zm0 8H20c.66 0 1.2.54 1.2 1.2v2.6c0 .66-.54 1.2-1.2 1.2h-7.8c-.66 0-1.2-.54-1.2-1.2v-2.6c0-.66.54-1.2 1.2-1.2z" />
    </svg>
  );
}
