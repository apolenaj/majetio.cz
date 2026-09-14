import { cn } from "@/lib/utils";

export function ButtonGroup({
  className,
  children,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("inline-flex flex-wrap items-center gap-2", className)}
    >
      {children}
    </div>
  );
}
