import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PorovnaniClient } from "@/components/property/search/porovnani-client";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";

export const metadata: Metadata = preparePageMeta({
  title: "Porovnání",
  description: "Porovnejte cenu, výnos a rizika více nemovitostí.",
  path: "/porovnani",
});

export default function PorovnaniPage() {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Porovnání nemovitostí"
        description="Přidejte až 4 nemovitosti z katalogu. Výběr zůstává uložený v prohlížeči."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Porovnání" }]}
      />
      <PorovnaniClient />
    </Container>
  );
}
