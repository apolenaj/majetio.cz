import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { loadAdminUserDetail } from "@/domains/users/admin/user-ops";
import { UserLifecyclePanel } from "@/components/admin/actors-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · User detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requirePermission("users.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { id } = await params;
  const { user, financialPassport, error } = await loadAdminUserDetail({
    userId: id,
    includeFinancialPassport: false,
  });

  if (error) {
    return (
      <InlineAlert tone="warning" title="User">
        {error}
      </InlineAlert>
    );
  }
  if (!user) {
    return (
      <InlineAlert tone="warning" title="Nenalezeno">
        User {id}
      </InlineAlert>
    );
  }

  const canSuspend = hasPermission(actor.role, "users.suspend");
  const canImpersonate = hasPermission(actor.role, "users.impersonate");
  const canRevealPassport = hasPermission(
    actor.role,
    "users.financial_passport.read",
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/uzivatele"
        className="text-xs text-[var(--text-link)] hover:underline"
      >
        ← Uživatelé
      </Link>
      <PageHeader
        title={user.email ?? user.id}
        description={`${user.role} · ${user.accountStatus}`}
      />

      {user.suspendedReason ? (
        <InlineAlert tone="warning" title="Suspend reason">
          {user.suspendedReason}
        </InlineAlert>
      ) : null}

      <section className="space-y-2 rounded-lg border border-[var(--border-default)] p-4">
        <h2 className="font-display text-lg">Financial Passport</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {financialPassport.masked
            ? financialPassport.message
            : "Visible"}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Default = skryté. Reveal vyžaduje restricted permission + step-up +
          audit log.
        </p>
      </section>

      <UserLifecyclePanel
        userId={user.id}
        canSuspend={canSuspend}
        canImpersonate={canImpersonate}
        canRevealPassport={canRevealPassport}
      />
    </div>
  );
}
