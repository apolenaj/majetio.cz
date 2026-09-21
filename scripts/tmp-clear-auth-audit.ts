import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const audits = await prisma.auditLog.deleteMany({
    where: {
      action: {
        in: [
          "auth.register",
          "auth.login.success",
          "auth.login.failure",
          "fraud.signal.blocked",
        ],
      },
    },
  });
  const rates = await prisma.authRateLimit.deleteMany({});
  console.log(
    JSON.stringify({ deletedAudits: audits.count, deletedRates: rates.count }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
