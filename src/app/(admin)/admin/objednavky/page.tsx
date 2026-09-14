import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminOrdersPanel } from "@/components/admin/admin-orders-panel";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";
import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin · Objednávky",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  try {
    await requirePermission("payments.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      status: true,
      productKey: true,
      priceVersionKey: true,
      amountGrossMinor: true,
      amountVatMinor: true,
      currency: true,
      userId: true,
      createdAt: true,
      paidAt: true,
      refundedAt: true,
      user: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Objednávky"
        description="Přehled checkout objednávek. Storno (122/189) odvolá entitlement a zapíše PaymentRefund."
      />
      <InlineAlert tone="info" title="Payment integrity">
        Status platby SUCCEEDED nelze ručně přepsat — pouze provider webhook /
        reconcile. Impersonace blokuje platební akce.
      </InlineAlert>
      <AdminOrdersPanel orders={orders} />
    </div>
  );
}
