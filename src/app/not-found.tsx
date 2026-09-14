import Link from "next/link";

import { EmptyState } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        title="Stránka nenalezena"
        description="Tato adresa neexistuje nebo byla přesunuta. Zkuste úvodní stránku nebo vyhledávání nemovitostí."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Zpět na úvod</ButtonLink>
            <ButtonLink href="/nemovitosti" variant="secondary">
              Procházet nemovitosti
            </ButtonLink>
            <Link
              href="/hledat"
              className="inline-flex min-h-11 items-center text-sm text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              Otevřít hledání
            </Link>
          </div>
        }
      />
    </Container>
  );
}
