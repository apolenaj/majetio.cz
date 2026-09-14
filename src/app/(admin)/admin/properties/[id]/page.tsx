import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin · Property",
  robots: { index: false, follow: false },
};

/** Alias for /admin/properties/[id] → Czech admin path. */
export default async function AdminPropertiesAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/nemovitosti/${id}`);
}
