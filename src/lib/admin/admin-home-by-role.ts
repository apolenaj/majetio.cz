/**
 * Role-personalized Admin Home layout (213–217).
 */

import type { AttentionItemType } from "@/domains/administration/service/attention-queue";
import { roleHasPermission } from "@/domains/administration/rbac/roles";
import type { PermissionKey } from "@/domains/administration/rbac/permissions";

export type AdminHomeQuickLink = {
  href: string;
  label: string;
  permission: PermissionKey;
};

export type AdminHomeProfile = {
  roleLabel: string;
  title: string;
  description: string;
  /** null = show all attention types */
  attentionTypes: AttentionItemType[] | null;
  showOpsKpis: boolean;
  showInternalMetrics: boolean;
  quickLinks: AdminHomeQuickLink[];
};

const REVIEWER_TYPES: AttentionItemType[] = [
  "dq_critical",
  "stale_property",
  "market_review_required",
];

const DATA_TYPES: AttentionItemType[] = [
  "import_failed",
  "import_partial",
  "dq_critical",
  "stale_property",
];

const COMMERCE_TYPES: AttentionItemType[] = [
  "payment_failed",
  "payment_mismatch",
];

const OPS_TYPES: AttentionItemType[] = [
  "import_failed",
  "import_partial",
  "dq_critical",
  "payment_failed",
  "payment_mismatch",
  "stale_property",
  "market_review_required",
  "stale_regulatory",
  "incident_open",
  "kill_switch_engaged",
];

export function buildAdminHomeProfile(role: string): AdminHomeProfile {
  const baseLinks: AdminHomeQuickLink[] = [
    {
      href: "/admin/nemovitosti",
      label: "Nemovitosti",
      permission: "property.read",
    },
    {
      href: "/admin/nemovitosti/duplikaty",
      label: "Duplikáty · merge",
      permission: "property.merge",
    },
    {
      href: "/admin/uzivatele",
      label: "Uživatelé",
      permission: "users.read",
    },
    {
      href: "/admin/monitoring",
      label: "Monitoring",
      permission: "ops.health.read",
    },
    {
      href: "/admin/incidenty",
      label: "Incidenty",
      permission: "platform.incidents.read",
    },
    {
      href: "/admin/objednavky",
      label: "Objednávky",
      permission: "payments.read",
    },
  ];

  const links = baseLinks.filter((l) => roleHasPermission(role, l.permission));

  switch (role) {
    case "PROPERTY_REVIEWER":
      return {
        roleLabel: "Property Reviewer",
        title: "Review desk",
        description:
          "Priorita: DQ critical, stale listings a merge kandidáti. Dense workflow, žádné vanity KPI.",
        attentionTypes: REVIEWER_TYPES,
        showOpsKpis: true,
        showInternalMetrics: false,
        quickLinks: links,
      };
    case "DATA_ADMIN":
      return {
        roleLabel: "Data Admin",
        title: "Data & quality",
        description:
          "Importy, DQ, completeness datasetů a stáří fronty. Metriky jen z reálných dat.",
        attentionTypes: DATA_TYPES,
        showOpsKpis: true,
        showInternalMetrics: true,
        quickLinks: links,
      };
    case "COMMERCE_ADMIN":
      return {
        roleLabel: "Commerce Admin",
        title: "Commerce desk",
        description:
          "Platby, drift a objednávky. Bez manuálního SUCCEEDED mimo governance.",
        attentionTypes: COMMERCE_TYPES,
        showOpsKpis: true,
        showInternalMetrics: false,
        quickLinks: links,
      };
    case "OPERATIONS_ADMIN":
      return {
        roleLabel: "Operations Admin",
        title: "Operations control",
        description:
          "Co hoří teď — incidenty, kill switches, fronty, platby a DQ.",
        attentionTypes: OPS_TYPES,
        showOpsKpis: true,
        showInternalMetrics: true,
        quickLinks: links,
      };
    case "ADMIN":
    case "SUPER_ADMIN":
      return {
        roleLabel: role === "SUPER_ADMIN" ? "Super Admin" : "Admin",
        title: "Admin home",
        description:
          "Plný ops přehled podle role. Metriky bez fake dat — empty state, pokud chybí.",
        attentionTypes: null,
        showOpsKpis: true,
        showInternalMetrics: true,
        quickLinks: links,
      };
    default:
      return {
        roleLabel: role,
        title: "Admin home",
        description: "Přehled podle vašich oprávnění.",
        attentionTypes: null,
        showOpsKpis: roleHasPermission(role, "ops.dashboard.read"),
        showInternalMetrics: roleHasPermission(role, "ops.health.read"),
        quickLinks: links,
      };
  }
}

export function filterAttentionByProfile<
  T extends { type: AttentionItemType },
>(items: T[], profile: AdminHomeProfile): T[] {
  if (!profile.attentionTypes) return items;
  const allowed = new Set(profile.attentionTypes);
  return items.filter((i) => allowed.has(i.type));
}
