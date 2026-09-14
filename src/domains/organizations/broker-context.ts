import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

export async function resolveBrokerContext(userId: string, role: Role = "USER") {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
    select: {
      organizationId: true,
      role: true,
      onboardingCompletedAt: true,
      onboardingStep: true,
      displayName: true,
      organization: {
        select: {
          marketCode: true,
          marketCoverage: true,
          serviceType: true,
        },
      },
    },
  });

  return {
    actor: { userId, role },
    membership,
    organizationId: membership?.organizationId ?? null,
    marketCode: membership?.organization?.marketCode ?? "CZ",
    marketCoverage: membership?.organization?.marketCoverage ?? ["CZ"],
    serviceType: membership?.organization?.serviceType ?? "AGENCY",
  };
}
