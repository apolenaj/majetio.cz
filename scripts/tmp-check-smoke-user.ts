import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("email required");
  const u = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      role: true,
      passwordHash: true,
      profile: { select: { id: true } },
      consents: { select: { type: true, granted: true, version: true } },
    },
  });
  if (!u) {
    console.log(JSON.stringify({ found: false }));
    return;
  }
  console.log(
    JSON.stringify({
      found: true,
      email: u.email,
      role: u.role,
      emailLower: u.email === u.email.toLowerCase(),
      passwordStoredAs: u.passwordHash
        ? u.passwordHash.startsWith("$2")
          ? "bcrypt"
          : "hashed"
        : "missing",
      hasProfile: Boolean(u.profile),
      consents: u.consents,
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
