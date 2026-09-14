"use client";

import * as React from "react";

import { SavedSearchCard } from "@/components/decision-workspace/saved-search-card";
import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import type { SavedSearchDto } from "@/domains/saved-searches/service/actions";

export function SavedSearchesPanel({
  initialItems,
}: {
  initialItems: SavedSearchDto[];
}) {
  const [items, setItems] = React.useState(initialItems);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">Uložená hledání</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Filtry z katalogu, reálný počet nových výsledků a frekvence upozornění.
          Stejné karty najdete i v rozhodovacím centru.
        </p>
      </div>

      <InlineAlert tone="info" title="Součást Decision Workspace">
        Přehled shortlistu, porovnání a hledání je na{" "}
        <a href="/ucet" className="underline">
          /ucet
        </a>
        .
      </InlineAlert>

      {items.length === 0 ? (
        <EmptyState
          title="Zatím žádná uložená hledání"
          description="Na stránce Nemovitosti nastavte filtry a klikněte na „Uložit hledání“."
          action={
            <ButtonLink href="/nemovitosti" size="sm">
              Procházet nemovitosti
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <SavedSearchCard
                item={item}
                onChanged={(next) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === next.id
                        ? {
                            ...i,
                            name: next.name,
                            alertFrequency: next.alertFrequency as SavedSearchDto["alertFrequency"],
                            matchCount: next.matchCount,
                            newMatchCount: next.newMatchCount,
                            lastCheckedAt: next.lastCheckedAt,
                            filterSummary: next.filterSummary,
                          }
                        : i,
                    ),
                  )
                }
                onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
