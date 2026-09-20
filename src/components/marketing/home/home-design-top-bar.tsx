/**
 * Thin design top bar matching the approved homepage reference.
 */
import { Container } from "@/components/ui/container";

export function HomeDesignTopBar() {
  return (
    <div className="home-topbar" role="banner">
      <Container width="marketing" className="home-topbar-inner px-4 sm:px-6 lg:px-10">
        <p className="truncate font-medium uppercase tracking-[0.08em] text-white/90">
          Vizuální návrh · Ukázkové nabídky
        </p>
        <p className="hidden shrink-0 text-white/75 sm:block">
          Lepší rozhodnutí. Hodnotnější život.
        </p>
      </Container>
    </div>
  );
}
