/**
 * Global admin search — permission-filtered (151–155).
 */

import { prisma } from "@/lib/db";
import { roleHasPermission } from "@/domains/administration/rbac/roles";
import type { PermissionKey } from "@/domains/administration/rbac/permissions";
import { maskEmail } from "@/domains/administration/security/masking";
import type {
  AdminEntityKind,
  AdminSearchHit,
} from "@/domains/administration/api/admin-dtos";

const TYPE_PERMISSION: Record<AdminEntityKind, PermissionKey | null> = {
  PROPERTY: "property.read",
  USER: "users.read",
  ORGANIZATION: "orgs.read",
  LEAD: "leads.read",
  ORDER: "payments.read",
  INCIDENT: "platform.incidents.read",
  DATASET: "ops.dashboard.read",
  IMPORT_JOB: "import.read",
};

function canSearchType(role: string, kind: AdminEntityKind): boolean {
  const perm = TYPE_PERMISSION[kind];
  if (!perm) return false;
  return roleHasPermission(role, perm);
}

export async function runAdminGlobalSearch(input: {
  q: string;
  types: string[];
  limit: number;
  actorRole: string;
}): Promise<{ hits: AdminSearchHit[]; skippedTypes: AdminEntityKind[] }> {
  const q = input.q.trim();
  const limit = input.limit;
  const requested = input.types
    .map((t) => t.toUpperCase())
    .filter((t): t is AdminEntityKind =>
      (Object.keys(TYPE_PERMISSION) as AdminEntityKind[]).includes(
        t as AdminEntityKind,
      ),
    );

  const skippedTypes: AdminEntityKind[] = [];
  const allowed = requested.filter((kind) => {
    const ok = canSearchType(input.actorRole, kind);
    if (!ok) skippedTypes.push(kind);
    return ok;
  });

  const hits: AdminSearchHit[] = [];

  await Promise.all(
    allowed.map(async (kind) => {
      switch (kind) {
        case "PROPERTY": {
          const rows = await prisma.property.findMany({
            where: {
              OR: [
                { id: { equals: q } },
                { slug: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: { id: true, slug: true, title: true, status: true },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "PROPERTY",
              entityId: r.id,
              title: r.title ?? r.slug,
              subtitle: `${r.status} · ${r.slug}`,
              href: `/admin/nemovitosti/${r.id}`,
            });
          }
          break;
        }
        case "USER": {
          const rows = await prisma.user.findMany({
            where: {
              OR: [
                { id: { equals: q } },
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              accountStatus: true,
            },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "USER",
              entityId: r.id,
              title: r.name ?? maskEmail(r.email) ?? r.id,
              subtitle: `${r.role} · ${maskEmail(r.email) ?? "—"} · ${r.accountStatus}`,
              href: `/admin/uzivatele/${r.id}`,
            });
          }
          break;
        }
        case "ORGANIZATION": {
          const rows = await prisma.organization.findMany({
            where: {
              OR: [
                { id: { equals: q } },
                { slug: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { ico: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: { id: true, name: true, slug: true, type: true },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "ORGANIZATION",
              entityId: r.id,
              title: r.name,
              subtitle: `${r.type} · ${r.slug}`,
              href: `/admin/organizace/${r.id}`,
            });
          }
          break;
        }
        case "LEAD": {
          const rows = await prisma.lead.findMany({
            where: {
              OR: [
                { id: { equals: q } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: { id: true, type: true, status: true, email: true },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "LEAD",
              entityId: r.id,
              title: `${r.type} · ${r.status}`,
              subtitle: maskEmail(r.email),
              href: `/admin/leady`,
            });
          }
          break;
        }
        case "ORDER": {
          const rows = await prisma.order.findMany({
            where: {
              OR: [{ id: { equals: q } }, { productKey: { contains: q } }],
            },
            take: limit,
            select: {
              id: true,
              productKey: true,
              status: true,
              user: { select: { email: true } },
            },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "ORDER",
              entityId: r.id,
              title: `${r.productKey} · ${r.status}`,
              subtitle: maskEmail(r.user.email),
              href: `/admin/objednavky`,
            });
          }
          break;
        }
        case "INCIDENT": {
          const rows = await prisma.incident.findMany({
            where: {
              OR: [
                { id: { equals: q } },
                { title: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: {
              id: true,
              title: true,
              severity: true,
              status: true,
            },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "INCIDENT",
              entityId: r.id,
              title: r.title,
              subtitle: `${r.severity} · ${r.status}`,
              href: `/admin/incidenty`,
            });
          }
          break;
        }
        case "DATASET": {
          const rows = await prisma.datasetRegistry.findMany({
            where: {
              OR: [
                { id: { equals: q } },
                { key: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: { id: true, key: true, name: true, healthStatus: true },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "DATASET",
              entityId: r.id,
              title: r.name,
              subtitle: `${r.key} · ${r.healthStatus}`,
              href: `/admin/nastaveni`,
            });
          }
          break;
        }
        case "IMPORT_JOB": {
          const rows = await prisma.importJob.findMany({
            where: {
              OR: [
                { id: { equals: q } },
                { provider: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: { id: true, provider: true, status: true },
          });
          for (const r of rows) {
            hits.push({
              entityKind: "IMPORT_JOB",
              entityId: r.id,
              title: `Import ${r.provider}`,
              subtitle: r.status,
              href: `/admin/importy/${r.id}`,
            });
          }
          break;
        }
      }
    }),
  );

  return { hits, skippedTypes };
}
