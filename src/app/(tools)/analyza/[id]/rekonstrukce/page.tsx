import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Analýza · rekonstrukce",
    description: "Sekce analýzy rekonstrukce.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/analyza/${id}/rekonstrukce` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PreparingPage
      title="Analýza · rekonstrukce"
      description={`Sekce analýzy „${id}“. Výpočty a data se připravují.`}
      breadcrumbs={[
        { href: "/analyza", label: "Analýza" },
        { href: `/analyza/${id}`, label: id },
        { label: "rekonstrukce" },
      ]}
      primaryHref="/analyza"
      primaryLabel="Zpět na analýzu"
    />
  );
}
