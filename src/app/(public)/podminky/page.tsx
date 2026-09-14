import type { Metadata } from "next";

import {
  LegalDocumentView,
  preparePageMeta,
} from "@/components/privacy/legal-document-view";
import { getPublishedLegalDocument } from "@/domains/privacy/legal-documents";

export const revalidate = 86_400;

export const metadata: Metadata = preparePageMeta({
  title: "Obchodní podmínky",
  description: "Podmínky užívání služeb Majetio.",
  path: "/podminky",
});

export default async function PodminkyPage() {
  const doc = await getPublishedLegalDocument("TERMS");
  return <LegalDocumentView doc={doc} />;
}
