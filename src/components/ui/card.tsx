import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-[var(--radius-card)] border bg-[var(--surface-primary)] text-[var(--text-primary)]",
  {
    variants: {
      variant: {
        static: "border-[var(--border-default)]",
        interactive:
          "border-[var(--border-default)] transition-shadow duration-[var(--duration-fast)] hover:shadow-[var(--shadow-raised)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]",
        selected: "border-[var(--action-primary)] ring-1 ring-[var(--action-primary)]",
        warning: "border-[var(--status-warning)] bg-[color-mix(in_srgb,var(--status-warning)_6%,white)]",
        danger: "border-[var(--status-error)] bg-[color-mix(in_srgb,var(--status-error)_6%,white)]",
        muted: "border-transparent bg-[var(--background-secondary)]",
        disabled: "border-[var(--border-default)] opacity-60",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-5 sm:p-6",
        lg: "p-6 sm:p-8",
      },
      elevation: {
        flat: "",
        raised: "shadow-[var(--shadow-raised)]",
      },
    },
    defaultVariants: {
      variant: "static",
      padding: "md",
      elevation: "flat",
    },
  },
);

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants> & {
    as?: "div" | "article" | "section";
  };

export function Card({
  className,
  variant,
  padding,
  elevation,
  as: Tag = "div",
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(cardVariants({ variant, padding, elevation }), className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
  as: Tag = "h3",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "h2" | "h3" | "h4" | "p";
}) {
  return (
    <Tag className={cn("font-display text-lg text-[var(--text-primary)]", className)}>
      {children}
    </Tag>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-sm text-[var(--text-secondary)]", className)}>{children}</p>
  );
}

export { cardVariants };
