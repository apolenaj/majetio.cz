import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import { FOOTER_GROUPS } from "@/config/navigation";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border-default)] bg-[var(--surface-inverse)] text-[var(--text-inverse)]">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Logo variant="light" size="md" label="Majetio" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            {brand.claims.secondary} Pomáháme zjistit, zda se konkrétní nemovitost
            vyplatí koupit — s daty, ne s dojmem.
          </p>
          <p className="mt-4 text-sm text-white/60">
            Financování řeší{" "}
            <a
              href="https://hypotekajasne.cz"
              className="underline underline-offset-2 hover:text-white"
              rel="noopener noreferrer"
              target="_blank"
            >
              HypotekaJasne.cz
            </a>
            .
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold tracking-wide text-[var(--action-premium)]">
              {group.title}
            </p>
            <ul className="mt-3 space-y-2">
              {group.links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/80 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-4 text-xs text-white/60 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.domains.cz}
          </p>
          <p>
            Odhad není investiční doporučení. Výnosy nejsou garantované.{" "}
            <Link href="/pravni-upozorneni" className="underline underline-offset-2">
              Právní upozornění
            </Link>
          </p>
        </Container>
      </div>
    </footer>
  );
}
