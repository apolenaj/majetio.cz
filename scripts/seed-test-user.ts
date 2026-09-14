/**
 * Seed a synthetic test user for local/dev QA — no real personal data.
 *
 * Usage: npx tsx scripts/seed-test-user.ts
 * Requires DATABASE_URL.
 * REFUSED in production — never seed weak TestUser1! credentials to prod.
 */
import { ConsentType, PropertyType, Role } from "@prisma/client";
import { hash } from "bcryptjs";

import { CURRENT_CONSENT_VERSIONS } from "../src/lib/auth/constants";
import { prisma } from "../src/lib/db";

const TEST_EMAIL = "test.user@majetio.local";
const TEST_PASSWORD = "TestUser1!";

function assertSeedAllowed(): void {
  const prodLike =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (prodLike) {
    throw new Error(
      "Refused: seed-test-user must never run in production (weak demo password).",
    );
  }
}

async function main() {
  assertSeedAllowed();
  const passwordHash = await hash(TEST_PASSWORD, 12);

  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Testovací Uživatel",
      passwordHash,
      role: Role.USER,
      emailVerified: new Date(),
      profile: {
        create: {
          preferredLocale: "cs",
          onboardingGoal: "OWN_HOME",
          investmentGoal: "OWN_HOME",
          onboardingStep: 9,
          onboardingCompletedAt: new Date(),
          phone: "+420700000000",
          notifyTransactionalEmail: true,
          notifyTransactionalInApp: true,
          notifyMarketingEmail: false,
          notifyMarketingInApp: false,
        },
      },
      financialProfile: {
        create: {
          availableEquityCzk: 1_500_000,
          equityPercent: 20,
          financingMode: "MORTGAGE",
          monthlyIncomeCzk: null,
          monthlyLiabilitiesCzk: null,
        },
      },
      propertyPreference: {
        create: {
          propertyTypes: [PropertyType.APARTMENT],
          maxPriceCzk: 7_500_000,
          preferredCity: "Brno",
          regions: ["Jihomoravský kraj"],
          dispositions: ["2+kk", "2+1"],
        },
      },
      investmentPreference: {
        create: {
          strategies: [],
          maxRiskLevel: "BALANCED",
          financingPreferred: true,
        },
      },
      consents: {
        create: [
          {
            type: ConsentType.TERMS,
            granted: true,
            version: CURRENT_CONSENT_VERSIONS.TERMS,
            grantedAt: new Date(),
            metadata: { source: "seed" },
          },
          {
            type: ConsentType.PRIVACY,
            granted: true,
            version: CURRENT_CONSENT_VERSIONS.PRIVACY,
            grantedAt: new Date(),
            metadata: { source: "seed" },
          },
        ],
      },
    },
  });

  console.info("Seeded test user:");
  console.info(`  email: ${TEST_EMAIL}`);
  console.info(`  password: ${TEST_PASSWORD}`);
  console.info(`  id: ${user.id}`);
  console.info("  marketing consent: OFF (not pre-checked)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
