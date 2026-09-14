import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Admin · partneri",
  description: "Administrační sekce. Business logika se připravuje.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PreparingPage
      title="Admin · partneri"
      description="Administrační sekce. Business logika se připravuje."
      breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "partneri" }]}
      primaryHref="/admin"
      primaryLabel="Zpět na přehled"
    />
  );
}
