"use client";

import Link from "next/link";
import * as React from "react";

import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { formatCzk } from "@/lib/format";
import {
  readCompareTray,
  writeCompareTray,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";

export function PorovnaniClient() {
  const [items, setItems] = React.useState<CompareTrayItem[]>([]);

  React.useEffect(() => {
    const sync = () => setItems(readCompareTray());
    sync();
    window.addEventListener("majetio:compare-changed", sync);
    return () => window.removeEventListener("majetio:compare-changed", sync);
  }, []);

  function remove(id: string) {
    writeCompareTray(items.filter((i) => i.id !== id));
  }

  return (
    <>
      {items.length < 2 ? (
        <EmptyState
          title={
            items.length === 0
              ? "Přidejte alespoň dvě nemovitosti"
              : "Přidejte ještě jednu nemovitost"
          }
          description="Porovnejte cenu, výnos a rizika. Položky přidáte ikonou porovnání na kartě."
          action={
            <ButtonLink href="/nemovitosti" variant="secondary">
              Procházet nemovitosti
            </ButtonLink>
          }
        />
      ) : null}

      {items.length > 0 ? (
        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={item.href}
                  className="font-display text-lg text-[var(--text-primary)] hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-[var(--text-secondary)]">
                  {item.location ?? "—"}
                  {item.priceCzk != null ? ` · ${formatCzk(item.priceCzk)}` : ""}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(item.id)}>
                Odebrat
              </Button>
            </Card>
          ))}
          {items.length >= 2 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Detailní metriky porovnání doplníme v další části — výběr je připravený.
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
