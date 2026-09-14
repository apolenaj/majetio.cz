import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Souhlasy",
  robots: { index: false, follow: false },
};

/** Canonical privacy management lives in Privacy Center. */
export default function SouhlasyRedirectPage() {
  permanentRedirect("/ucet/soukromi");
}
