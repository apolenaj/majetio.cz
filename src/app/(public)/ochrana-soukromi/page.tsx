import type { Metadata } from "next";

import {
  LegalDocumentView,
  preparePageMeta,
} from "@/components/privacy/legal-document-view";
import { getPublishedLegalDocument } from "@/domains/privacy/legal-documents";

export const revalidate = 86_400;

export const metadata: Metadata = preparePageMeta({
  title: "Ochrana soukromí",
  description:
    "Jak Majetio zpracovává osobní údaje, Finanční pas a souhlasy — včetně práv subjektu.",
  path: "/ochrana-soukromi",
});

export default async function OchranaSoukromiPage() {
  const doc = await getPublishedLegalDocument("PRIVACY");
  return <LegalDocumentView doc={doc} />;
}
