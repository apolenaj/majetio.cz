import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import {
  listCmsContent,
  listStaleRegulatoryAttention,
} from "@/domains/platform/admin/content-governance";
import {
  CmsCreateForm,
  CmsTransitionButtons,
} from "@/components/admin/platform-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Obsah & regulace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminObsahPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  let actor;
  try {
    actor = await requirePermission("platform.content.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const sp = await searchParams;
  const canWrite = hasPermission(actor.role, "platform.content.write");
  const canPublish = hasPermission(actor.role, "platform.content.publish");
  const { items, error } = await listCmsContent();
  const stale = await listStaleRegulatoryAttention();

  const previewId = sp.preview?.trim();
  const previewItem = previewId
    ? items.find((i) => i.id === previewId) ?? null
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Content & Regulatory Governance"
        description="DRAFT → REVIEW → PUBLISHED. Regulatory vyžaduje source + reviewRequiredAt. Překlady: MACHINE_DRAFT → REVIEWED → APPROVED."
      />

      {error ? (
        <InlineAlert tone="warning" title="CMS">
          {error}
        </InlineAlert>
      ) : null}

      {(stale.cms.length > 0 ||
        stale.rules.length > 0 ||
        stale.seo.length > 0) && (
        <section className="space-y-2">
          <h2 className="font-display text-xl">Admin attention — stale regulation</h2>
          <ul className="space-y-1 text-sm">
            {stale.cms.map((c) => (
              <li key={c.id}>
                CMS <code>{c.slug}</code> · review due{" "}
                {c.reviewRequiredAt?.toISOString().slice(0, 10)}
              </li>
            ))}
            {stale.rules.map((r) => (
              <li key={r.id}>
                Rule {r.marketCode}/{r.code} · {r.titleEn}
              </li>
            ))}
            {stale.seo.map((s) => (
              <li key={s.id}>
                SEO {s.marketCode} {s.path}
              </li>
            ))}
          </ul>
        </section>
      )}

      {previewItem ? (
        <InlineAlert tone="info" title={`Preview · ${previewItem.slug}`}>
          {previewItem.title} · {previewItem.status} · {previewItem.kind}
          {previewItem.isRegulatory ? " · REGULATORY" : ""}
        </InlineAlert>
      ) : null}

      <CmsCreateForm canWrite={canWrite} />

      <section className="space-y-3">
        <h2 className="font-display text-xl">Obsah</h2>
        <ul className="space-y-3">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-[var(--border-default)] p-3 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {c.title}{" "}
                  <span className="text-[var(--text-muted)]">
                    · {c.kind} · {c.status}
                  </span>
                </p>
                <Link
                  href={`/admin/obsah?preview=${c.id}`}
                  className="text-xs text-[var(--text-link)] hover:underline"
                >
                  Preview
                </Link>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {c.slug} · {c.marketCode}/{c.locale}
                {c.isRegulatory ? " · regulatory" : ""}
                {c.reviewRequiredAt
                  ? ` · review by ${c.reviewRequiredAt.toISOString().slice(0, 10)}`
                  : ""}
              </p>
              <CmsTransitionButtons
                contentId={c.id}
                status={c.status}
                canWrite={canWrite}
                canPublish={canPublish}
              />
            </li>
          ))}
          {items.length === 0 ? (
            <li className="text-[var(--text-muted)]">Zatím žádný obsah.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
