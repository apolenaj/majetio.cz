import { PropertyResultsSkeleton } from "@/components/property/search/property-results-skeleton";
import { Container } from "@/components/ui/container";

export default function NemovitostiLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 space-y-3">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>
      <div className="mb-6 skeleton h-28 w-full rounded-[var(--radius-card)]" />
      <div className="mb-4 skeleton h-8 w-72 max-w-full" />
      <PropertyResultsSkeleton count={6} />
    </Container>
  );
}
