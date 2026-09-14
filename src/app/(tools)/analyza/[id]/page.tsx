import type { Metadata } from "next";

import { ComingSoonPage } from "@/components/ui/coming-soon";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Analýza · ${id}` };
}

export default async function AnalyzaDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <ComingSoonPage
      title="Výsledek analýzy"
      description={`Analýza „${id}“ zatím není k dispozici. Tato stránka je připravená routa bez falešných výsledků.`}
    />
  );
}
