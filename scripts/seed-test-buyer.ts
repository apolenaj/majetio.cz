/**
 * Seed a second synthetic buyer for inquiry E2E.
 * Usage: npx tsx scripts/seed-test-buyer.ts
 */
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";

import { prisma } from "../src/lib/db";

const EMAIL = "test.buyer@majetio.local";
const PASSWORD = "TestBuyer1!";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Refused in production.");
  }
  const passwordHash = await hash(PASSWORD, 12);
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) await prisma.user.delete({ where: { id: existing.id } });

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: "Testovací Zájemce",
      passwordHash,
      role: Role.USER,
      emailVerified: new Date(),
    },
  });
  console.log("Seeded buyer:", user.email, user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
