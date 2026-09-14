import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconButtonProps = Omit<ButtonProps, "leftIcon" | "rightIcon" | "children"> & {
  label: string;
  children: React.ReactNode;
};

export function IconButton({
  label,
  className,
  size = "icon",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      size={size === "sm" ? "icon-sm" : size === "lg" ? "icon" : size}
      className={cn(className)}
      aria-label={label}
      {...props}
    >
      {children}
    </Button>
  );
}
