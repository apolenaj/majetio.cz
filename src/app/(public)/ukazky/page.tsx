import type { Metadata } from "next";

import { CaseStudyCard } from "@/components/marketing/case-study-card";
import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { listCaseStudies } from "@/content/case-studies";

export const metadata: Metadata = preparePageMeta({
  title: "Ukázky analýz",
  description:
    "Modelové studie Majetio — byt na pronájem, dům k rekonstrukci a menší bytový dům. Nejde o aktuální nabídky.",
  path: "/ukazky",
});

export default function CaseStudiesIndexPage() {
  const studies = listCaseStudies();
  return (
    <StandardPageLayout>
      <PageHeader
        title="Ukázky analýz"
        description="Tři modelové studie se společným výpočetním modulem. Všechny jsou označené jako modelové — nejde o nabídky k prodeji."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Ukázky analýz" },
        ]}
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {studies.map((study) => (
          <CaseStudyCard key={study.definition.slug} study={study} />
        ))}
      </div>
    </StandardPageLayout>
  );
}
