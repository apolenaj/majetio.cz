"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  label,
  description,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <label htmlFor={inputId} className={cn("flex cursor-pointer gap-3", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="mt-1 size-4 shrink-0 rounded border-[var(--border-strong)] text-[var(--action-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[var(--text-caption)] text-[var(--text-muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function Switch({
  className,
  label,
  id,
  checked,
  onCheckedChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <label htmlFor={inputId} className={cn("inline-flex cursor-pointer items-center gap-3", className)}>
      <span className="relative inline-flex h-6 w-11 items-center">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <span className="absolute inset-0 rounded-full bg-[var(--border-strong)] transition-colors peer-checked:bg-[var(--action-accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--focus-ring)]" />
        <span className="absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
    </label>
  );
}

export function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  className,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string; description?: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-[var(--text-label-m)] font-medium text-[var(--text-primary)]">
        {legend}
      </legend>
      <div className="space-y-3">
        {options.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer gap-3">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange?.(opt.value)}
              className="mt-1 size-4 border-[var(--border-strong)] text-[var(--action-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            />
            <span>
              <span className="block text-sm font-medium">{opt.label}</span>
              {opt.description ? (
                <span className="text-[var(--text-caption)] text-[var(--text-muted)]">
                  {opt.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-primary)] focus-visible:border-[var(--border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50",
        invalid && "border-[var(--status-error)]",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
