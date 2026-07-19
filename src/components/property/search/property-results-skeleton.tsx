import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/layout-primitives";

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      as="article"
      padding="none"
      className={cn("overflow-hidden", className)}
      aria-hidden
    >
      <AspectRatio ratio="4/3" className="bg-[var(--surface-sunken)]">
        <div className="skeleton h-full w-full" />
      </AspectRatio>
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-4/5" />
        <div className="skeleton h-4 w-1/2" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      </div>
    </Card>
  );
}

export function PropertyResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Načítání výsledků"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
      <span className="sr-only">Načítání nemovitostí…</span>
    </div>
  );
}
