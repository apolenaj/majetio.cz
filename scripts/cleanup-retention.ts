/**
 * Retention cleanup — expired sessions, verification tokens, stale jobs, old webhook events.
 *
 * Usage:
 *   npx tsx scripts/cleanup-retention.ts
 *   npx tsx scripts/cleanup-retention.ts --dry-run
 *
 * Schedule via cron (recommended daily). Does not delete orders/payments/ledger.
 */
import { prisma } from "../src/lib/db";

const DRY = process.argv.includes("--dry-run");

const WEBHOOK_RETENTION_DAYS = Number(
  process.env.CLEANUP_WEBHOOK_RETENTION_DAYS ?? 90,
);
const JOB_RETENTION_DAYS = Number(process.env.CLEANUP_JOB_RETENTION_DAYS ?? 30);
const DLQ_RETENTION_DAYS = Number(process.env.CLEANUP_DLQ_RETENTION_DAYS ?? 90);

async function main() {
  const now = new Date();
  const webhookCutoff = new Date(
    now.getTime() - WEBHOOK_RETENTION_DAYS * 86_400_000,
  );
  const jobCutoff = new Date(now.getTime() - JOB_RETENTION_DAYS * 86_400_000);
  const dlqCutoff = new Date(now.getTime() - DLQ_RETENTION_DAYS * 86_400_000);

  console.info(
    `[cleanup] dryRun=${DRY} webhook>${WEBHOOK_RETENTION_DAYS}d jobs>${JOB_RETENTION_DAYS}d`,
  );

  const expiredSessions = await prisma.session.count({
    where: { expires: { lt: now } },
  });
  const expiredTokens = await prisma.verificationToken.count({
    where: { expires: { lt: now } },
  });
  const oldWebhooks = await prisma.paymentWebhookEvent.count({
    where: {
      processedAt: { not: null, lt: webhookCutoff },
    },
  });
  const finishedJobs = await prisma.systemJob.count({
    where: {
      status: { in: ["SUCCEEDED", "CANCELLED"] },
      finishedAt: { lt: jobCutoff },
    },
  });
  const oldDlq = await prisma.systemJobDeadLetter.count({
    where: { failedAt: { lt: dlqCutoff }, requeuedAt: { not: null } },
  });

  console.info(
    JSON.stringify({
      expiredSessions,
      expiredTokens,
      oldWebhooks,
      finishedJobs,
      oldDlq,
    }),
  );

  if (DRY) {
    console.info("[cleanup] dry-run complete — no deletes.");
    return;
  }

  const sessions = await prisma.session.deleteMany({
    where: { expires: { lt: now } },
  });
  const tokens = await prisma.verificationToken.deleteMany({
    where: { expires: { lt: now } },
  });
  const webhooks = await prisma.paymentWebhookEvent.deleteMany({
    where: {
      processedAt: { not: null, lt: webhookCutoff },
    },
  });
  const jobs = await prisma.systemJob.deleteMany({
    where: {
      status: { in: ["SUCCEEDED", "CANCELLED"] },
      finishedAt: { lt: jobCutoff },
    },
  });
  const dlq = await prisma.systemJobDeadLetter.deleteMany({
    where: { failedAt: { lt: dlqCutoff }, requeuedAt: { not: null } },
  });

  console.info(
    JSON.stringify({
      deleted: {
        sessions: sessions.count,
        tokens: tokens.count,
        webhooks: webhooks.count,
        jobs: jobs.count,
        dlq: dlq.count,
      },
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
