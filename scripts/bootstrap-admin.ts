/**
 * Secure SUPER_ADMIN bootstrap — never public registration.
 *
 * Usage (staging/local):
 *   ALLOW_ADMIN_BOOTSTRAP=true \
 *   BOOTSTRAP_ADMIN_EMAIL=ops@example.com \
 *   BOOTSTRAP_ADMIN_PASSWORD='…min 16 chars, letter+digit…' \
 *   npx tsx scripts/bootstrap-admin.ts
 *
 * Production requires ALLOW_ADMIN_BOOTSTRAP=true AND CONFIRM_PROD_ADMIN_BOOTSTRAP=I_UNDERSTAND.
 * Password is never printed. Existing SUPER_ADMIN with same email is updated (hash only).
 */
import { Role } from "@prisma/client";

import {
  hashPassword,
  isPasswordStrongEnough,
} from "../src/lib/auth/password";
import { prisma } from "../src/lib/db";

function assertBootstrapAllowed(): void {
  if (
    process.env.ALLOW_ADMIN_BOOTSTRAP !== "true" &&
    process.env.ALLOW_ADMIN_BOOTSTRAP !== "1"
  ) {
    throw new Error(
      "Refused: set ALLOW_ADMIN_BOOTSTRAP=true to create a super admin.",
    );
  }
  const prodLike =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (
    prodLike &&
    process.env.CONFIRM_PROD_ADMIN_BOOTSTRAP !== "I_UNDERSTAND"
  ) {
    throw new Error(
      "Refused: production bootstrap requires CONFIRM_PROD_ADMIN_BOOTSTRAP=I_UNDERSTAND.",
    );
  }
}

function assertStrongAdminPassword(password: string): void {
  if (password.length < 16) {
    throw new Error("Admin password must be at least 16 characters.");
  }
  if (!isPasswordStrongEnough(password)) {
    throw new Error(
      "Admin password must include at least one letter and one digit.",
    );
  }
  const weak = ["TestUser1!", "password", "admin123", "Admin123!", "changeme"];
  if (weak.some((w) => password.toLowerCase().includes(w.toLowerCase()))) {
    throw new Error("Admin password matches a known weak pattern.");
  }
}

async function main() {
  assertBootstrapAllowed();

  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "")
    .toLowerCase()
    .trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";

  if (!email || !email.includes("@")) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL is required.");
  }
  assertStrongAdminPassword(password);

  const passwordHash = await hashPassword(password);
  const existing = await prisma.user.findUnique({ where: { email } });

  let userId: string;
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: Role.SUPER_ADMIN,
        emailVerified: existing.emailVerified ?? new Date(),
      },
    });
    userId = existing.id;
    console.info(`Updated existing user to SUPER_ADMIN: ${email} (${userId})`);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.SUPER_ADMIN,
        emailVerified: new Date(),
        profile: { create: { preferredLocale: "cs" } },
      },
      select: { id: true },
    });
    userId = created.id;
    console.info(`Created SUPER_ADMIN: ${email} (${userId})`);
  }

  await prisma.auditLog.create({
    data: {
      action: "admin.bootstrap_super_admin",
      entity: "User",
      entityType: "User",
      entityId: userId,
      actorId: userId,
      actorType: "SYSTEM",
      reason: "CLI bootstrap-admin.ts",
      meta: { source: "bootstrap-admin", role: "SUPER_ADMIN" },
    },
  });

  console.info("Password was not printed. Rotate after first login.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
