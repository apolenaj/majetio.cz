/**
 * Cron / ops: expire paid ListingBoost rows past endsAt (checklist 181).
 *
 * Usage: npx tsx scripts/expire-listing-boosts.ts
 */

import { sweepAndCountActiveBoosts } from "@/domains/listing-promotions/service";

async function main() {
  const result = await sweepAndCountActiveBoosts(new Date());
  console.log(
    `[listing-boosts:expire] expired=${result.expired} stillActive=${result.stillActive}`,
  );
}

main().catch((error) => {
  console.error("[listing-boosts:expire] failed", error);
  process.exitCode = 1;
});
