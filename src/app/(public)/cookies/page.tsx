import type { Metadata } from "next";

import {
  LegalDocumentView,
  preparePageMeta,
} from "@/components/privacy/legal-document-view";
import { getPublishedLegalDocument } from "@/domains/privacy/legal-documents";

export const revalidate = 86400;

export const metadata: Metadata = preparePageMeta({
  title: "Cookies",
  description:
    "Kategorie cookies Majetio: nezbytné, preferenční, analytické a marketingové — bez dark patterns.",
  path: "/cookies",
});

export default async function CookiesPage() {
  const doc = await getPublishedLegalDocument("COOKIES");
  return <LegalDocumentView doc={doc} />;
}
