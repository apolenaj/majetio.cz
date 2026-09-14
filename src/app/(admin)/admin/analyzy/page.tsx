import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Admin · Analytics governance",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const LINKS = [
  {
    href: "/admin/analyzy/valuation",
    title: "Valuation Control Center",
    desc: "Model registry DRAFT→ACTIVE, MAE/MAPE, overrides",
  },
  {
    href: "/admin/analyzy/assumptions",
    title: "Investment Assumptions",
    desc: "Vacancy, maintenance, growth — versioned approval",
  },
  {
    href: "/admin/analyzy/renovation",
    title: "Renovation Cost Catalog",
    desc: "Lokace/kvalita, 300% jump anomalies, versioning",
  },
  {
    href: "/admin/lokality",
    title: "Location Intelligence",
    desc: "Mapping fixes + metric review queue",
  },
  {
    href: "/admin/analyzy/hypoteka",
    title: "HypotekaJasne / Mortgage Ops",
    desc: "Rate feed health, block auto-publish, review queue",
  },
] as const;

export default async function AdminAnalyticsHubPage() {
  try {
    await requirePermission("analytics.models.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & financial governance"
        description="Valuation · Investment · Renovation · Location · HypotekaJasne — žádný model live bez schválení."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-lg border border-[var(--border-default)] px-4 py-4 hover:bg-[var(--surface-1)]"
            >
              <p className="font-medium text-[var(--text-link)]">{l.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{l.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
