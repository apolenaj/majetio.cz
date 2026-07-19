import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Doporučené nemovitosti",
  description: "Nabídky seřazené podle shody s Finančním pasem.",
  robots: { index: true, follow: true },
};

/** Canonical sort lives on /nemovitosti?razeni=doporucene */
export default function Page() {
  redirect("/nemovitosti?razeni=doporucene");
}
