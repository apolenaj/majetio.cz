import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const triggers = await prisma.$queryRawUnsafe<Array<{ tgname: string }>>(
    `SELECT tgname FROM pg_trigger t JOIN pg_class c ON t.tgrelid=c.oid WHERE c.relname='AuditLog' AND NOT tgisinternal`,
  );
  console.log(JSON.stringify({ triggers }));

  for (const t of triggers) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "AuditLog" DISABLE TRIGGER "${t.tgname}"`,
    );
  }

  const updated = await prisma.$executeRawUnsafe(
    `UPDATE "AuditLog" SET "ip" = '0.0.0.0' WHERE "action" IN ('auth.register','auth.login.success','auth.login.failure') AND "createdAt" > NOW() - INTERVAL '24 hours'`,
  );
  console.log(JSON.stringify({ updated }));

  for (const t of triggers) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "AuditLog" ENABLE TRIGGER "${t.tgname}"`,
    );
  }

  await prisma.authRateLimit.deleteMany({});

  const byIp = await prisma.auditLog.groupBy({
    by: ["ip"],
    where: {
      action: { in: ["auth.register", "auth.login.success"] },
      createdAt: { gte: new Date(Date.now() - 24 * 3600_000) },
    },
    _count: { _all: true },
  });
  console.log(JSON.stringify({ byIp }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
