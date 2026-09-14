import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
  as: Tag = "section",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "aside";
}) {
  return (
    <Tag className={cn("py-12 sm:py-16 lg:py-20", className)} {...props}>
      {children}
    </Tag>
  );
}

export function Stack({
  className,
  gap = "md",
  children,
}: {
  className?: string;
  gap?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  const gapClass = { sm: "gap-2", md: "gap-4", lg: "gap-8" }[gap];
  return <div className={cn("flex flex-col", gapClass, className)}>{children}</div>;
}

export function Inline({
  className,
  gap = "md",
  children,
  wrap = true,
}: {
  className?: string;
  gap?: "sm" | "md" | "lg";
  children: React.ReactNode;
  wrap?: boolean;
}) {
  const gapClass = { sm: "gap-2", md: "gap-3", lg: "gap-6" }[gap];
  return (
    <div className={cn("flex items-center", wrap && "flex-wrap", gapClass, className)}>
      {children}
    </div>
  );
}

export function Grid({
  className,
  cols = 3,
  children,
}: {
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols];
  return <div className={cn("grid gap-6", colClass, className)}>{children}</div>;
}

export function Divider({ className }: { className?: string }) {
  return (
    <hr
      className={cn("border-0 border-t border-[var(--border-default)]", className)}
    />
  );
}

export function Spacer({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const h = { sm: "h-4", md: "h-8", lg: "h-12", xl: "h-16" }[size];
  return <div className={h} aria-hidden />;
}

export function Surface({
  className,
  elevated,
  children,
}: {
  className?: string;
  elevated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)]",
        elevated && "shadow-[var(--shadow-raised)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

export function AspectRatio({
  ratio = "4/3",
  className,
  children,
}: {
  ratio?: "1/1" | "4/3" | "16/9" | "3/2";
  className?: string;
  children: React.ReactNode;
}) {
  const map = {
    "1/1": "aspect-square",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
    "3/2": "aspect-[3/2]",
  } as const;
  return (
    <div className={cn("relative overflow-hidden", map[ratio], className)}>{children}</div>
  );
}
