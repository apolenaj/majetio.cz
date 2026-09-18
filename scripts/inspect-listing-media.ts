/**
 * Inspect recent listing media (dev only).
 */
import { prisma } from "../src/lib/db";

async function main() {
  const rows = await prisma.propertyMedia.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      isPrimary: true,
      propertyId: true,
      mimeType: true,
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
