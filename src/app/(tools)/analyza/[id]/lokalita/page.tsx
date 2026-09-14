import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Analýza · lokalita",
    description: "Sekce analýzy lokalita.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/analyza/${id}/lokalita` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PreparingPage
      title="Analýza · lokalita"
      description={`Sekce analýzy „${id}“. Výpočty a data se připravují.`}
      breadcrumbs={[
        { href: "/analyza", label: "Analýza" },
        { href: `/analyza/${id}`, label: id },
        { label: "lokalita" },
      ]}
      primaryHref="/analyza"
      primaryLabel="Zpět na analýzu"
    />
  );
}
