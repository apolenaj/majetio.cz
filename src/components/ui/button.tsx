import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--action-primary)] text-white hover:bg-[var(--action-primary-hover)]",
        secondary:
          "border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:bg-[var(--background-secondary)]",
        tertiary: "bg-[var(--background-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-default)]",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-primary)]",
        ghost: "text-[var(--text-primary)] hover:bg-[var(--background-secondary)]",
        destructive:
          "bg-[var(--action-destructive)] text-white hover:bg-[color-mix(in_srgb,var(--action-destructive)_88%,black)]",
        link: "h-auto rounded-none p-0 text-[var(--text-link)] underline-offset-4 hover:text-[var(--text-link-hover)] hover:underline",
        premium:
          "bg-[var(--action-premium)] text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--action-premium)_88%,black)]",
        accent:
          "bg-[var(--action-accent)] text-white hover:bg-[var(--action-accent-hover)]",
      },
      size: {
        sm: "h-9 min-h-9 px-3 text-[var(--text-label-m)] [&_svg]:size-4",
        md: "h-11 min-h-11 px-5 [&_svg]:size-4",
        lg: "h-12 min-h-12 px-6 text-base [&_svg]:size-5",
        icon: "h-11 w-11 min-h-11 min-w-11 [&_svg]:size-5",
        "icon-sm": "h-9 w-9 min-h-9 min-w-9 [&_svg]:size-4",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        leftIcon
      )}
      {children}
      {!loading ? rightIcon : null}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
