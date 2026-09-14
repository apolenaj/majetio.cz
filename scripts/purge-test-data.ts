/**
 * Purge known demo/test rows — never run without ALLOW_PURGE_TEST_DATA=true.
 *
 * Removes:
 * - Properties with isDemo=true
 * - User test.user@majetio.local
 *
 * Usage: ALLOW_PURGE_TEST_DATA=true npx tsx scripts/purge-test-data.ts
 */
import { prisma } from "../src/lib/db";

const TEST_EMAIL = "test.user@majetio.local";

async function main() {
  if (
    process.env.ALLOW_PURGE_TEST_DATA !== "true" &&
    process.env.ALLOW_PURGE_TEST_DATA !== "1"
  ) {
    throw new Error("Refused: set ALLOW_PURGE_TEST_DATA=true to purge demo/test rows.");
  }

  const demos = await prisma.property.deleteMany({ where: { isDemo: true } });
  console.info(`Deleted demo properties: ${demos.count}`);

  const testUser = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    select: { id: true },
  });
  if (testUser) {
    await prisma.user.delete({ where: { id: testUser.id } });
    console.info(`Deleted test user: ${TEST_EMAIL}`);
  } else {
    console.info("No test user found.");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
