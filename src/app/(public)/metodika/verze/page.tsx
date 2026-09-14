import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { LastUpdated } from "@/components/trust";
import {
  METHODOLOGY_PACKAGE_VERSION,
  currentMethodologyComponentStamps,
  getCurrentMethodologyPublishedAt,
  listMethodologyHistoryNewestFirst,
} from "@/content/methodology/versions";

// Literal required — Next.js segment config must be statically analyzable.
export const revalidate = 86400;

export const metadata: Metadata = preparePageMeta({
  title: "Verze metodiky",
  description:
    "Aktuální verze metodiky Majetio, datum aktualizace a historie veřejných oprav — bez tiché manipulace s daty.",
  path: "/metodika/verze",
});

export default function MetodikaVerzePage() {
  const history = listMethodologyHistoryNewestFirst();
  const publishedAt = getCurrentMethodologyPublishedAt();
  const components = currentMethodologyComponentStamps();

  return (
    <StandardPageLayout>
      <PageHeader
        title="Verze metodiky"
        description="Veřejná historie balíčků metodiky (ne každý commit). Analýzy si pamatují verzi, ze které vznikly."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/metodika", label: "Metodika" },
          { label: "Verze" },
        ]}
      />

      <section
        aria-labelledby="current-methodology"
        className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-6"
      >
        <h2
          id="current-methodology"
          className="font-display text-xl text-[var(--text-primary)]"
        >
          Aktuální verze
        </h2>
        <p className="mt-2 font-mono text-sm text-[var(--text-primary)]">
          {METHODOLOGY_PACKAGE_VERSION}
        </p>
        <LastUpdated
          className="mt-3"
          at={`${publishedAt}T12:00:00.000Z`}
          label="Aktualizováno"
          staleAfterDays={365}
        />
        <ul className="mt-4 space-y-1 text-sm text-[var(--text-secondary)]">
          {components.map((c) => (
            <li key={c.key}>
              {c.labelCs}:{" "}
              <span className="font-mono text-[var(--text-primary)]">
                {c.version}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link
            href="/metodika"
            className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            Celý popis metodiky
          </Link>
        </p>
      </section>

      <InlineAlert tone="info" title="Žádná tichá manipulace" className="mt-8">
        Major veřejná oprava dat nebo textu metodiky se vždy zobrazí v historii
        jako opravený stav. Uložené analýzy si ponechají původní engine a
        package stamp — nepřepisujeme historii.
      </InlineAlert>

      <section aria-labelledby="methodology-history" className="mt-10">
        <h2
          id="methodology-history"
          className="font-display text-xl text-[var(--text-primary)]"
        >
          Historie verzí
        </h2>
        <ol className="mt-6 space-y-6">
          {history.map((entry) => (
            <li
              key={entry.version}
              id={entry.version}
              className="scroll-mt-24 border-b border-[var(--border-default)] pb-6 last:border-b-0"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-mono text-sm font-medium text-[var(--text-primary)]">
                  {entry.version}
                </h3>
                <time
                  dateTime={entry.publishedAt}
                  className="text-[var(--text-caption)] text-[var(--text-muted)]"
                >
                  {entry.publishedAt}
                </time>
                {entry.version === METHODOLOGY_PACKAGE_VERSION ? (
                  <span className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-1.5 py-0.5 text-[var(--text-caption)] font-medium">
                    aktuální
                  </span>
                ) : null}
                {entry.isPublicCorrection ? (
                  <span className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--status-warning)_40%,white)] bg-[color-mix(in_srgb,var(--status-warning)_12%,white)] px-1.5 py-0.5 text-[var(--text-caption)] font-medium text-[var(--status-warning)]">
                    veřejná oprava
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {entry.summaryCs}
              </p>
              {entry.isPublicCorrection && entry.correctionOfVersion ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Opravený stav vůči{" "}
                  <a
                    href={`#${encodeURIComponent(entry.correctionOfVersion)}`}
                    className="font-mono text-[var(--text-link)] underline-offset-2 hover:underline"
                  >
                    {entry.correctionOfVersion}
                  </a>
                  {entry.correctionNoteCs ? ` — ${entry.correctionNoteCs}` : "."}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </StandardPageLayout>
  );
}
