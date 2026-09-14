/**
 * Digest job entrypoint — builds/sends daily or weekly digest e-mails.
 * Default sender logs only (never spam). Pass --send only with a real provider wired.
 *
 * Usage:
 *   npx tsx scripts/run-alert-digest.ts --frequency=DAILY
 *   npx tsx scripts/run-alert-digest.ts --frequency=WEEKLY
 */

import { runDigestJob } from "@/domains/notifications/service/digest";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit?.slice(prefix.length);
}

async function main() {
  const frequencyRaw = (arg("frequency") ?? "DAILY").toUpperCase();
  const frequency =
    frequencyRaw === "WEEKLY" ? ("WEEKLY" as const) : ("DAILY" as const);
  const siteOrigin =
    arg("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://majetio.cz";

  const result = await runDigestJob({
    frequency,
    siteOrigin,
    // Default no-op send inside runDigestJob — marks SENT without external mail
  });

  console.log(
    `[alerts:digest] frequency=${frequency} processed=${result.processed} failed=${result.failed}`,
  );
}

main().catch((error) => {
  console.error("[alerts:digest] failed", error);
  process.exitCode = 1;
});
