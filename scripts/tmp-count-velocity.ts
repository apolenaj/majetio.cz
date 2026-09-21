import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const since = new Date(Date.now() - 24 * 3600_000);
  const byIp = await prisma.auditLog.groupBy({
    by: ["ip"],
    where: {
      action: { in: ["auth.register", "auth.login.success"] },
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });
  const users = await prisma.user.findMany({
    where: { email: { contains: "smoke." } },
    select: { email: true, role: true, createdAt: true },
  });
  console.log(JSON.stringify({ byIp, users }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
