import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MethodologyAttribution } from "@/components/methodology/methodology-attribution";
import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { listMyScenarios } from "@/domains/investment/server/scenario-actions";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Moje analýzy",
  robots: { index: false, follow: false },
};

export default async function UcetAnalyzyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/ucet/analyzy"));
  }

  const listed = await listMyScenarios();
  const scenarios = listed.ok ? listed.data : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-[var(--text-primary)]">
          Moje analýzy
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Uložené investiční scénáře. Každý výpočet nese pečeť metodiky, ze které
          vznikl.
        </p>
      </header>

      {scenarios.length === 0 ? (
        <div className="space-y-4">
          <InlineAlert tone="info" title="Zatím žádné uložené scénáře">
            Spočítejte výnos v kalkulačce a scénář uložte — historie si zapamatuje
            verzi metodiky.
          </InlineAlert>
          <ButtonLink href="/kalkulacky/investicni-vynos">
            Otevřít kalkulačku
          </ButtonLink>
        </div>
      ) : (
        <ul className="space-y-4">
          {scenarios.map((s) => (
            <li
              key={s.id}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium text-[var(--text-primary)]">
                  {s.name ?? "Bez názvu"}
                </h2>
                <time
                  dateTime={s.updatedAt}
                  className="text-[var(--text-caption)] text-[var(--text-muted)]"
                >
                  {new Intl.DateTimeFormat("cs-CZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(s.updatedAt))}
                </time>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {s.variant} · {s.status}
              </p>
              <MethodologyAttribution
                className="mt-3"
                compact
                methodologyPackageVersion={s.methodologyPackageVersion}
                calculationEngineVersion={s.calculationEngineVersion}
                formulaRegistryVersion={s.formulaRegistryVersion}
                assumptionConfigVersion={s.assumptionConfigVersion}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm">
        <Link
          href="/metodika/verze"
          className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Historie verzí metodiky
        </Link>
      </p>
    </div>
  );
}
