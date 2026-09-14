"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-11 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-9 min-w-11 items-center justify-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=active]:bg-[var(--surface-primary)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-raised)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: { href?: string; label: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Drobečková navigace" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {isLast || !item.href ? (
                <span
                  className={cn(isLast && "font-medium text-[var(--text-primary)]")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-[var(--radius-md)] focus:bg-[var(--action-primary)] focus:px-4 focus:py-2 focus:text-[var(--text-inverse)]"
    >
      Přeskočit na obsah
    </a>
  );
}

export function TextLink({
  href,
  children,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      className={cn(
        "font-medium text-[var(--text-link)] underline-offset-4 hover:text-[var(--text-link-hover)] hover:underline",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export function BackLink({
  href,
  children = "Zpět",
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        className,
      )}
    >
      ← {children}
    </a>
  );
}
