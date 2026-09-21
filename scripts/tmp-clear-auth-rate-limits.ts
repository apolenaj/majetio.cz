import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const locks = await prisma.authRateLimit.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      key: true,
      failCount: true,
      lockedUntil: true,
      windowStart: true,
      updatedAt: true,
    },
  });
  const users = await prisma.user.findMany({
    where: { email: { contains: "smoke." } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      email: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });
  console.log(
    JSON.stringify(
      {
        rateLimits: locks.map((r) => ({
          keyHint: r.key.slice(0, 24),
          failCount: r.failCount,
          locked: r.lockedUntil ? r.lockedUntil > new Date() : false,
          lockedUntil: r.lockedUntil,
        })),
        users: users.map((u) => ({
          email: u.email,
          role: u.role,
          pw: u.passwordHash
            ? u.passwordHash.startsWith("$2")
              ? "bcrypt"
              : "other"
            : "null",
          lower: u.email === u.email.toLowerCase(),
          createdAt: u.createdAt,
        })),
        userCount: users.length,
      },
      null,
      2,
    ),
  );

  // Clear locks so smoke can continue
  const cleared = await prisma.authRateLimit.deleteMany({});
  console.log(JSON.stringify({ clearedRateLimits: cleared.count }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
