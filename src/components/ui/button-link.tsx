"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export function ButtonLink({
  className,
  variant,
  size,
  fullWidth,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export { Button };
