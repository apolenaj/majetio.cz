"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { comparisonConfig } from "@/config/comparison";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertWorkspaceMutationAllowed } from "@/lib/security/workspace-rate-limit";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import {
  buildComparisonViewModel,
  type ComparisonSourceProperty,
} from "@/domains/comparisons/service/build-view-model";
import type { ComparisonMode, ComparisonViewModel } from "@/domains/comparisons/types";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

const propertyIdsSchema = z
  .array(z.string().min(1).max(64))
  .min(1)
  .max(comparisonConfig.maxProperties);

export async function createComparisonAction(input: {
  name?: string | null;
  propertyIds: string[];
}): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const limited = await assertWorkspaceMutationAllowed(
    userId,
    "comparison",
    "create",
  );
  if (!limited.ok) return { ok: false, error: limited.error };

  const ids = propertyIdsSchema.safeParse(input.propertyIds);
  if (!ids.success) {
    return {
      ok: false,
      error: `Porovnání podporuje maximálně ${comparisonConfig.maxProperties} nemovitosti.`,
    };
  }

  const comparison = await prisma.comparison.create({
    data: {
      userId,
      name: input.name?.trim().slice(0, 120) || null,
      properties: {
        create: ids.data.map((propertyId, index) => ({
          propertyId,
          sortOrder: index,
        })),
      },
    },
    select: { id: true },
  });

  const { writeAuditLog } = await import("@/lib/auth/audit");
  await writeAuditLog({
    actorId: userId,
    action: "comparison.create",
    entity: "Comparison",
    entityId: comparison.id,
    meta: { propertyIds: ids.data, propertyId: ids.data[0] },
  }).catch(() => undefined);

  const { track } = await import("@/lib/analytics/events");
  const { observeFunnelStep, recordDecisionMetric } = await import(
    "@/lib/analytics/decision-metrics"
  );
  track({
    name: "comparison_created",
    props: { property_count: ids.data.length },
  });
  observeFunnelStep("compared");
  recordDecisionMetric("comparison_created");

  revalidatePath("/porovnani");
  revalidatePath("/ucet/porovnani");
  revalidatePath("/ucet");
  return { ok: true, id: comparison.id };
}

export async function getComparisonViewModelAction(input: {
  comparisonId?: string | null;
  slugs?: string[];
  mode?: ComparisonMode;
  usePassport?: boolean;
}): Promise<
  | { ok: true; view: ComparisonViewModel }
  | { ok: false; error: string }
> {
  const mode = input.mode ?? "overview";
  let passport = null;
  if (input.usePassport !== false) {
    const session = await auth();
    if (session?.user?.id) {
      const loaded = await loadFinancialPassport();
      if (loaded.ok) passport = loaded.state;
    }
  }

  if (input.comparisonId) {
    const userId = await requireUserId();
    if (!userId) return { ok: false, error: "Přihlášení je povinné." };

    const row = await prisma.comparison.findFirst({
      where: { id: input.comparisonId, userId },
      include: {
        properties: {
          orderBy: { sortOrder: "asc" },
          include: {
            property: { select: { id: true, slug: true } },
          },
        },
      },
    });
    if (!row) return { ok: false, error: "Porovnání nenalezeno." };

    const sources: ComparisonSourceProperty[] = row.properties.map((p) => ({
      propertyId: p.propertyId,
      slug: p.property.slug,
      order: p.sortOrder,
    }));

    return {
      ok: true,
      view: buildComparisonViewModel({
        id: row.id,
        name: row.name,
        mode,
        properties: sources,
        passport,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    };
  }

  const slugs = (input.slugs ?? []).slice(0, comparisonConfig.maxProperties);
  if (slugs.length === 0) {
    return {
      ok: true,
      view: buildComparisonViewModel({
        mode,
        properties: [],
        passport,
      }),
    };
  }

  // Resolve demo / public catalog by slug (guest tray + discovery).
  const { listDemoPublicProperties } = await import(
    "@/content/demo-canonical-properties"
  );
  const catalog = listDemoPublicProperties();
  const sources: ComparisonSourceProperty[] = [];
  for (let order = 0; order < slugs.length; order++) {
    const slug = slugs[order]!;
    const hit = catalog.find((p) => p.slug === slug);
    if (!hit) continue;
    sources.push({ propertyId: hit.id, slug: hit.slug, order });
  }

  return {
    ok: true,
    view: buildComparisonViewModel({
      mode,
      properties: sources,
      passport,
    }),
  };
}

export async function listUserComparisonsAction(): Promise<
  | {
      ok: true;
      items: Array<{
        id: string;
        name: string | null;
        propertyCount: number;
        updatedAt: string;
      }>;
    }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const rows = await prisma.comparison.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { properties: true } } },
    take: 50,
  });

  return {
    ok: true,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      propertyCount: r._count.properties,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

export async function deleteComparisonAction(input: {
  comparisonId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const limited = await assertWorkspaceMutationAllowed(
    userId,
    "comparison",
    "delete",
  );
  if (!limited.ok) return { ok: false, error: limited.error };

  const result = await prisma.comparison.deleteMany({
    where: { id: input.comparisonId, userId },
  });
  if (result.count === 0) return { ok: false, error: "Porovnání nenalezeno." };

  revalidatePath("/ucet/porovnani");
  revalidatePath("/porovnani");
  return { ok: true };
}

/**
 * Decision pack for UI — snapshot + stale diffs + personal financing overlays.
 * Pass refresh=true for explicit „Aktualizovat porovnání“.
 */
export async function getComparisonDecisionPackAction(input: {
  comparisonId: string;
  refresh?: boolean;
}): Promise<
  | { ok: true; pack: import("../decision/types").ComparisonDecisionPack }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const row = await prisma.comparison.findFirst({
    where: { id: input.comparisonId, userId },
    include: {
      properties: {
        orderBy: { sortOrder: "asc" },
        select: { propertyId: true },
      },
    },
  });
  if (!row) return { ok: false, error: "Porovnání nenalezeno." };

  const {
    buildComparisonDecisionPack,
    refreshComparisonDecisionPack,
  } = await import("../decision/build-decision-pack");

  const loaded = await loadFinancialPassport();
  const passport = loaded.ok ? loaded.state : null;

  const pack = input.refresh
    ? await refreshComparisonDecisionPack({
        comparisonId: row.id,
        propertyIds: row.properties.map((p) => p.propertyId),
        userId,
        passport,
      })
    : await buildComparisonDecisionPack({
        comparisonId: row.id,
        propertyIds: row.properties.map((p) => p.propertyId),
        userId,
        passport,
        preferSnapshot: true,
      });

  return { ok: true, pack };
}
