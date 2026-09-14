import * as React from "react";

import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  optional,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[var(--text-label-m)] font-medium text-[var(--text-primary)]",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-1 text-[var(--status-error)]" aria-hidden>
          *
        </span>
      ) : null}
      {optional ? (
        <span className="ml-1 font-normal text-[var(--text-muted)]">(volitelné)</span>
      ) : null}
    </label>
  );
}

export function HelperText({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p id={id} className={cn("mt-1.5 text-[var(--text-caption)] text-[var(--text-muted)]", className)}>
      {children}
    </p>
  );
}

export function ErrorText({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p
      id={id}
      role="alert"
      className={cn("mt-1.5 text-[var(--text-caption)] text-[var(--status-error)]", className)}
    >
      {children}
    </p>
  );
}

const inputBase =
  "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus-visible:border-[var(--border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-[var(--background-secondary)]";

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(inputBase, invalid && "border-[var(--status-error)]", className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
));
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      inputBase,
      "h-auto min-h-24 py-2.5",
      invalid && "border-[var(--status-error)]",
      className,
    )}
    aria-invalid={invalid || undefined}
    {...props}
  />
));
TextArea.displayName = "TextArea";

export function Field({
  id,
  label,
  required,
  optional,
  helperText,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              id?: string;
              "aria-describedby"?: string;
              invalid?: boolean;
            }>,
            {
              id,
              "aria-describedby": describedBy,
              ...(error ? { invalid: true } : {}),
            },
          )
        : children}
      {helperText && !error ? <HelperText id={helperId}>{helperText}</HelperText> : null}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

export { inputBase };
