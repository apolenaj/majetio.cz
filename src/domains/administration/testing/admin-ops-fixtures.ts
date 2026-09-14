/**
 * Admin Ops fixtures (checklist 250).
 * Realistic in-memory seeds for failed import, stale source,
 * pending moderation, payment mismatch — no fake vanity metrics.
 */

export const FIXTURE_NOW = new Date("2026-07-22T10:00:00.000Z");

export type AdminOpsFixtureBundle = ReturnType<typeof buildAdminOpsFixtures>;

function hoursAgo(hours: number, now = FIXTURE_NOW): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number, now = FIXTURE_NOW): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function buildAdminOpsFixtures(input?: { now?: Date }) {
  const now = input?.now ?? FIXTURE_NOW;

  const actors = {
    superAdmin: {
      id: "user_super_admin",
      email: "super@majetio.test",
      role: "SUPER_ADMIN" as const,
    },
    operationsAdmin: {
      id: "user_ops_admin",
      email: "ops@majetio.test",
      role: "OPERATIONS_ADMIN" as const,
    },
    dataAdmin: {
      id: "user_data_admin",
      email: "data@majetio.test",
      role: "DATA_ADMIN" as const,
    },
    propertyReviewer: {
      id: "user_property_reviewer",
      email: "reviewer@majetio.test",
      role: "PROPERTY_REVIEWER" as const,
    },
    commerceAdmin: {
      id: "user_commerce_admin",
      email: "commerce@majetio.test",
      role: "COMMERCE_ADMIN" as const,
    },
    admin: {
      id: "user_admin",
      email: "admin@majetio.test",
      role: "ADMIN" as const,
    },
    regularUser: {
      id: "user_regular",
      email: "buyer@majetio.test",
      role: "USER" as const,
    },
    foreignUser: {
      id: "user_foreign",
      email: "foreign@majetio.test",
      role: "USER" as const,
    },
  };

  /** Failed import job with partial success — attention CRITICAL/HIGH. */
  const failedImport = {
    id: "import_job_failed_1",
    providerKey: "sreality_feed",
    marketCode: "CZ",
    status: "FAILED" as const,
    processedCount: 120,
    successCount: 97,
    errorCount: 23,
    createdAt: hoursAgo(6, now),
    finishedAt: hoursAgo(5, now),
    lastError: "Schema validation failed on 23 rows (askingPrice null).",
    items: [
      {
        id: "import_item_1",
        externalId: "ext-1001",
        status: "FAILED" as const,
        error: "askingPrice required",
      },
      {
        id: "import_item_2",
        externalId: "ext-1002",
        status: "SUCCEEDED" as const,
        error: null,
      },
    ],
  };

  /** Stale property source — not refreshed beyond SLA. */
  const staleSource = {
    id: "property_source_stale_1",
    propertyId: "prop_stale_listing",
    sourceType: "PORTAL_FEED",
    providerKey: "sreality_feed",
    healthStatus: "STALE" as const,
    lastSeenAt: daysAgo(14, now),
    lastSuccessAt: daysAgo(14, now),
    freshness: "STALE" as const,
    importEnabled: true,
    frontendVisible: true,
  };

  const staleProperty = {
    id: "prop_stale_listing",
    title: "Byt 3+kk Praha 5 — stale listing",
    slug: "byt-3kk-praha-5-stale",
    status: "ACTIVE" as const,
    visibility: "PUBLIC" as const,
    marketCode: "CZ",
    publicCity: "Praha",
    propertyType: "APARTMENT",
    askingPrice: 8_950_000,
    usableArea: 78,
    freshness: "STALE" as const,
    isDemo: false,
    sources: [staleSource],
  };

  /** Listing awaiting moderation. */
  const pendingModerationProperty = {
    id: "prop_pending_moderation",
    title: "Dům 5+1 Brno — pending review",
    slug: "dum-5-1-brno-pending",
    status: "PENDING_REVIEW" as const,
    visibility: "PRIVATE" as const,
    marketCode: "CZ",
    publicCity: "Brno",
    propertyType: "HOUSE",
    askingPrice: 12_400_000,
    usableArea: 160,
    freshness: "FRESH" as const,
    isDemo: false,
    moderationReason: null,
    userFacingModerationMessage: null,
    qualityIssues: [] as Array<{ severity: string; status: string }>,
    _count: { qualityIssues: 0 },
  };

  /** Duplicate pair for merge dry-run / execute. */
  const propertyA = {
    id: "prop_merge_a",
    title: "Byt 2+kk Vinohrady A",
    slug: "byt-2kk-vinohrady-a",
    status: "ACTIVE" as const,
    visibility: "PUBLIC" as const,
    marketCode: "CZ",
    publicCity: "Praha",
    propertyType: "APARTMENT",
    askingPrice: 7_200_000,
    usableArea: 55,
    layout: "2+kk",
    publicLabel: "Vinohrady",
    description: "Světlý byt u metra.",
    condition: "GOOD",
    sources: [
      {
        id: "src_a_1",
        sourceType: "PORTAL_FEED",
        propertyId: "prop_merge_a",
      },
    ],
    fieldOverrides: [] as Array<{
      fieldKey: string;
      value: string;
      locked: boolean;
    }>,
  };

  const propertyB = {
    id: "prop_merge_b",
    title: "Byt 2+kk Vinohrady B (dup)",
    slug: "byt-2kk-vinohrady-b",
    status: "ACTIVE" as const,
    visibility: "PUBLIC" as const,
    marketCode: "CZ",
    publicCity: "Praha",
    propertyType: "APARTMENT",
    askingPrice: 7_150_000,
    usableArea: 54,
    layout: "2+kk",
    publicLabel: "Vinohrady",
    description: "Byt blízko metra A.",
    condition: "GOOD",
    sources: [
      {
        id: "src_b_1",
        sourceType: "MANUAL",
        propertyId: "prop_merge_b",
      },
    ],
    fieldOverrides: [] as Array<{
      fieldKey: string;
      value: string;
      locked: boolean;
    }>,
  };

  const duplicateCandidate = {
    id: "dup_candidate_1",
    status: "PENDING" as const,
    similarityScore: 0.91,
    propertyAId: propertyA.id,
    propertyBId: propertyB.id,
    propertyA,
    propertyB,
    evidence: {
      priceA: propertyA.askingPrice,
      priceB: propertyB.askingPrice,
      mediaCountA: 8,
      mediaCountB: 6,
    },
  };

  /** Open critical DQ issue on a property. */
  const openDqIssue = {
    id: "dq_issue_critical_1",
    ruleCode: "PRICE_AREA_ANOMALY",
    ruleVersion: "1",
    category: "ANOMALY" as const,
    severity: "CRITICAL" as const,
    status: "OPEN" as const,
    message: "Asking price / m² outside expected band for Praha 5.",
    explanation: null as string | null,
    field: "askingPrice",
    propertyId: staleProperty.id,
    locationId: null as string | null,
    detectedAt: hoursAgo(30, now),
    resolutionReason: null as string | null,
    resolvedAt: null as Date | null,
    resolvedByUserId: null as string | null,
  };

  /**
   * Payment mismatch: order PAID without entitlement (attention payment_mismatch).
   * No PaymentMismatch table — fixture models the drift pair.
   */
  const paymentMismatch = {
    order: {
      id: "order_paid_no_entitlement",
      userId: actors.regularUser.id,
      status: "PAID" as const,
      amountGrossMinor: 49900,
      currency: "CZK",
      productKey: "pro_monthly",
      paidAt: hoursAgo(18, now),
    },
    payment: {
      id: "pay_succeeded_1",
      orderId: "order_paid_no_entitlement",
      status: "SUCCEEDED" as const,
      provider: "MOCK",
      amountMinor: 49900,
      currency: "CZK",
    },
    entitlement: null as null,
    drift: {
      type: "payment_mismatch" as const,
      reason: "Order PAID without ACTIVE entitlement",
      severity: "CRITICAL" as const,
    },
  };

  /** Open SEV2 incident for resolution flow. */
  const openIncident = {
    id: "incident_sev2_1",
    title: "Import provider schema drift",
    description:
      "Sreality feed started rejecting price fields; 23 rows failed validation.",
    severity: "SEV2" as const,
    status: "OPEN" as const,
    ownerUserId: actors.operationsAdmin.id,
    openedByUserId: actors.dataAdmin.id,
    affectedSystems: ["import", "property_sources"],
    startedAt: hoursAgo(8, now),
    resolvedAt: null as Date | null,
    marketCode: "CZ",
    correlationId: "corr_import_schema_20260722",
  };

  /** Valuation models for governance + safe rollback. */
  const previousActiveModel = {
    id: "model_v1_prev",
    code: "hedonic_cz_v1",
    displayName: "Hedonic CZ v1",
    algorithmVersion: "1.0.0",
    marketCode: "CZ",
    lifecycleStatus: "APPROVED" as const,
    isActive: false,
    shadowMode: false,
    previousActiveModelId: null as string | null,
  };

  const activeModel = {
    id: "model_v2_active",
    code: "hedonic_cz_v2",
    displayName: "Hedonic CZ v2",
    algorithmVersion: "2.0.0",
    marketCode: "CZ",
    lifecycleStatus: "ACTIVE" as const,
    isActive: true,
    shadowMode: false,
    previousActiveModelId: previousActiveModel.id,
    approvedAt: daysAgo(3, now),
    activatedAt: daysAgo(1, now),
  };

  const draftModel = {
    id: "model_v3_draft",
    code: "hedonic_cz_v3",
    displayName: "Hedonic CZ v3",
    algorithmVersion: "3.0.0-draft",
    marketCode: "CZ",
    lifecycleStatus: "DRAFT" as const,
    isActive: false,
    shadowMode: false,
    previousActiveModelId: null as string | null,
  };

  /** Kill switch / feature flag fixture. */
  const killPaymentsFlag = {
    id: "flag_kill_payments",
    key: "kill.payments",
    scope: "GLOBAL" as const,
    marketCode: "",
    percentage: null as number | null,
    enabled: false,
    isKillSwitch: true,
    description: "Halt new payment captures",
    updatedAt: now,
  };

  return {
    now,
    actors,
    failedImport,
    staleSource,
    staleProperty,
    pendingModerationProperty,
    propertyA,
    propertyB,
    duplicateCandidate,
    openDqIssue,
    paymentMismatch,
    openIncident,
    previousActiveModel,
    activeModel,
    draftModel,
    killPaymentsFlag,
  };
}

/** Attention-queue shaped items derived from fixtures (for unit asserts). */
export function fixtureAttentionSignals(bundle: AdminOpsFixtureBundle) {
  return [
    {
      id: `import:${bundle.failedImport.id}`,
      type: "import_failed" as const,
      severity: "CRITICAL" as const,
      entityKind: "ImportJob",
      entityId: bundle.failedImport.id,
      title: `Import FAILED · ${bundle.failedImport.providerKey}`,
    },
    {
      id: `dq:${bundle.openDqIssue.id}`,
      type: "dq_critical" as const,
      severity: "CRITICAL" as const,
      entityKind: "DataQualityIssue",
      entityId: bundle.openDqIssue.id,
      title: bundle.openDqIssue.message,
    },
    {
      id: `stale:${bundle.staleProperty.id}`,
      type: "stale_property" as const,
      severity: "MEDIUM" as const,
      entityKind: "Property",
      entityId: bundle.staleProperty.id,
      title: bundle.staleProperty.title,
    },
    {
      id: `pay:${bundle.paymentMismatch.order.id}`,
      type: "payment_mismatch" as const,
      severity: "CRITICAL" as const,
      entityKind: "Order",
      entityId: bundle.paymentMismatch.order.id,
      title: bundle.paymentMismatch.drift.reason,
    },
    {
      id: `mod:${bundle.pendingModerationProperty.id}`,
      type: "market_review_required" as const,
      severity: "HIGH" as const,
      entityKind: "Property",
      entityId: bundle.pendingModerationProperty.id,
      title: `PENDING_REVIEW · ${bundle.pendingModerationProperty.title}`,
    },
  ];
}
