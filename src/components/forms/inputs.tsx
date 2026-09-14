"use client";

import * as React from "react";

import { TextInput } from "@/components/forms/field";
import { formatCzk, parseLocalizedNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatCurrencyText(value: number | null): string {
  if (value == null) return "";
  return formatCzk(value).replace(/\s?Kč$/, "").trim();
}

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  invalid?: boolean;
};

export function CurrencyInput({
  value,
  onValueChange,
  className,
  onBlur,
  onFocus,
  invalid,
  ...props
}: CurrencyInputProps) {
  const [text, setText] = React.useState(() => formatCurrencyText(value));
  const [focused, setFocused] = React.useState(false);

  const display = focused ? text : formatCurrencyText(value);

  return (
    <div className="relative">
      <TextInput
        inputMode="decimal"
        className={cn("pr-12 font-metric", className)}
        value={display}
        invalid={invalid}
        onFocus={(e) => {
          setFocused(true);
          setText(formatCurrencyText(value));
          onFocus?.(e);
        }}
        onChange={(e) => {
          setText(e.target.value);
          onValueChange(parseLocalizedNumber(e.target.value));
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[var(--text-muted)]">
        Kč
      </span>
    </div>
  );
}

type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  invalid?: boolean;
  suffix?: string;
};

export function NumberInput({
  value,
  onValueChange,
  className,
  suffix,
  invalid,
  ...props
}: NumberInputProps) {
  return (
    <div className="relative">
      <TextInput
        inputMode="decimal"
        className={cn("font-metric", suffix && "pr-12", className)}
        value={value ?? ""}
        invalid={invalid}
        onChange={(e) => onValueChange(parseLocalizedNumber(e.target.value))}
        {...props}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[var(--text-muted)]">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

export function PercentageInput(props: Omit<NumberInputProps, "suffix">) {
  return <NumberInput {...props} suffix="%" />;
}

export function AreaInput(props: Omit<NumberInputProps, "suffix">) {
  return <NumberInput {...props} suffix="m²" />;
}

export function EmailInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput type="email" autoComplete="email" {...props} />;
}

export function PasswordInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput type="password" autoComplete="current-password" {...props} />;
}

export function SearchInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput type="search" enterKeyHint="search" {...props} />;
}

export function PhoneInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput type="tel" autoComplete="tel" inputMode="tel" {...props} />;
}
