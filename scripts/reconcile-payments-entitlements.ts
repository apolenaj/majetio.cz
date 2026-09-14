/**
 * Reconcile PAID orders vs entitlements + RevenueEvent ledger (196–199).
 *
 * Usage:
 *   npm run revenue:reconcile
 *   npm run revenue:reconcile:repair
 *   npx tsx scripts/reconcile-payments-entitlements.ts --repair
 */

import { reconcilePaymentsEntitlementsAndRevenue } from "@/domains/revenue/reconciliation";
import { track } from "@/lib/analytics/events";

async function main() {
  const repair = process.argv.includes("--repair");
  const report = await reconcilePaymentsEntitlementsAndRevenue({
    repair,
    take: 200,
  });

  const findingCount = report.findings.length;
  track({
    name: "reconciliation_completed",
    props: {
      repair,
      finding_count_bucket:
        findingCount === 0 ? "0" : findingCount <= 5 ? "1-5" : "6+",
      has_errors: report.findings.some((f) => f.severity === "error"),
    },
  });

  console.log(
    `[reconcile] checkedPaid=${report.checkedPaidOrders} checkedRefunded=${report.checkedRefundedOrders} missingEntitlements=${report.missingEntitlements} pendingGrants=${report.pendingGrants} missingRevenue=${report.missingRevenueEvents} staleAfterRefund=${report.staleActiveAfterRefund} unreversedRevenue=${report.unreversedRevenueAfterRefund} repairedEntitlements=${report.repaired.entitlementsRetried} repairedRevenue=${report.repaired.revenueRecognized} reversedRevenue=${report.repaired.revenueReversed}`,
  );
  for (const f of report.findings.slice(0, 20)) {
    console.log(`  [${f.severity}] ${f.code} ${f.orderId ?? ""} — ${f.messageCs}`);
  }

  const hardErrors =
    report.missingEntitlements +
    report.staleActiveAfterRefund +
    report.unreversedRevenueAfterRefund;
  if (!repair && hardErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[reconcile] failed", error);
  process.exitCode = 1;
});
