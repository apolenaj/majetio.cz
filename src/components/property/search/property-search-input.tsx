"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { Label } from "@/components/forms/field";
import { cn } from "@/lib/utils";
import { foldDiacritics } from "@/domains/properties/search/text-match";

const LOCATION_SUGGESTIONS = [
  "Praha",
  "Praha 2",
  "Vinohrady",
  "Brno",
  "Brno-střed",
  "Ostrava",
  "Plzeň",
  "Olomouc",
  "Liberec",
  "Hradec Králové",
];

export function PropertySearchInput({
  id = "property-search-q",
  name = "q",
  label = "Lokalita nebo název",
  defaultValue = "",
  placeholder = "Např. Praha, Vinohrady, Brno…",
  className,
}: {
  id?: string;
  name?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const listId = `${id}-suggestions`;

  const suggestions = React.useMemo(() => {
    const q = foldDiacritics(value).trim();
    if (!q || q.length < 1) return LOCATION_SUGGESTIONS.slice(0, 5);
    return LOCATION_SUGGESTIONS.filter((s) =>
      foldDiacritics(s).includes(q),
    ).slice(0, 6);
  }, [value]);

  return (
    <div className={cn("relative min-w-0", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden
        />
        <input
          id={id}
          name={name}
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] pr-3 pl-10 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        />
      </div>
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] py-1 shadow-[var(--shadow-raised)]"
        >
          {suggestions.map((s) => (
            <li key={s} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--background-secondary)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setValue(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Hledání toleruje diakritiku (praha ≈ Praha) i drobné překlepy.
      </p>
    </div>
  );
}
