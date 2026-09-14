import { retryPendingMortgageLeadSubmissions } from "@/domains/leads/service/lead-submission";

async function main() {
  const result = await retryPendingMortgageLeadSubmissions({ limit: 50 });
  console.log(
    `[hj:retry-submissions] processed=${result.processed} succeeded=${result.succeeded} stillPending=${result.stillPending}`,
  );
}

main().catch((error) => {
  console.error("[hj:retry-submissions] failed", error);
  process.exitCode = 1;
});
