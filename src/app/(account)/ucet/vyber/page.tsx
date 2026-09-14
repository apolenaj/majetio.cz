import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Můj výběr",
  robots: { index: false, follow: false },
};

/** Alias → Decision Workspace shortlist section (IA: /ucet). */
export default function UcetVyberPage() {
  redirect("/ucet#shortlist");
}
