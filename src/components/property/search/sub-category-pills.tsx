"use client";

import { cn } from "@/lib/utils";

export type SubCategoryOption = {
  value: string;
  label: string;
};

export const BYT_SUBCATEGORIES: readonly SubCategoryOption[] = [
  { value: "1+kk", label: "1+kk" },
  { value: "1+1", label: "1+1" },
  { value: "2+kk", label: "2+kk" },
  { value: "2+1", label: "2+1" },
  { value: "3+kk", label: "3+kk" },
  { value: "3+1", label: "3+1" },
  { value: "4+kk", label: "4+kk" },
  { value: "4+1", label: "4+1" },
  { value: "5plus", label: "5+ a více" },
  { value: "atypicky", label: "Atypický" },
];

export const DUM_SUBCATEGORIES: readonly SubCategoryOption[] = [
  { value: "rodinny", label: "Rodinný" },
  { value: "vila", label: "Vila" },
  { value: "chalupa", label: "Chalupa" },
  { value: "chata", label: "Chata" },
  { value: "pamatka", label: "Památka" },
];

export function SubCategoryPills({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly SubCategoryOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((x) => x !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
