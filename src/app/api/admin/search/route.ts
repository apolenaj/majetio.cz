import type { NextRequest } from "next/server";

import {
  adminErrorResponse,
  adminJson,
  auditAdminApiAccess,
  parseSearchParams,
  requireAdminApiPermission,
} from "@/domains/administration/api/admin-http";
import { adminSearchQuerySchema } from "@/domains/administration/api/admin-dtos";
import { runAdminGlobalSearch } from "@/domains/administration/api/admin-search";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/search?q=&types=&limit=
 * Global ops search — results filtered by actor permissions.
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdminApiPermission("ops.search.read");
    const query = parseSearchParams(request, adminSearchQuerySchema);
    const { hits, skippedTypes } = await runAdminGlobalSearch({
      q: query.q,
      types: query.types as string[],
      limit: query.limit,
      actorRole: actor.role,
    });

    await auditAdminApiAccess({
      actor,
      action: "ops.api.search",
      entityType: "AdminSearch",
      request,
      meta: {
        qLength: query.q.length,
        hitCount: hits.length,
        skippedTypes,
      },
    });

    return adminJson({
      ok: true as const,
      hits,
      skippedTypes,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
