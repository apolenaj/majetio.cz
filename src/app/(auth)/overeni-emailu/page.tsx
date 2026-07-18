import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Ověření e-mailu",
  description: "Ověření e-mailové adresy.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PreparingPage
      title="Ověření e-mailu"
      description="Ověření e-mailové adresy."
    />
  );
}
