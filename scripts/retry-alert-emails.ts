/**
 * Retry PENDING/FAILED PropertyAlert EMAIL rows (BOD 142).
 * Does not recreate IN_APP notifications.
 *
 * Usage:
 *   npx tsx scripts/retry-alert-emails.ts
 *   npx tsx scripts/retry-alert-emails.ts --limit=20
 */

import { processPendingAlertEmails } from "@/domains/notifications/service/email-delivery";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit?.slice(prefix.length);
}

async function main() {
  const limit = Number(arg("limit") ?? "50");
  const siteOrigin =
    arg("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://majetio.cz";

  const result = await processPendingAlertEmails({
    siteOrigin,
    limit: Number.isFinite(limit) ? limit : 50,
  });

  console.log(
    `[alerts:email-retry] processed=${result.processed} failed=${result.failed} skipped=${result.skipped}`,
  );
}

main().catch((error) => {
  console.error("[alerts:email-retry] failed", error);
  process.exitCode = 1;
});
