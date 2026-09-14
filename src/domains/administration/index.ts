/**
 * Admin & Operations — RBAC + ops dashboard domain.
 */

export {
  PERMISSION_KEYS,
  SENSITIVE_PERMISSIONS,
  SENSITIVE_CONFIRM_TOKEN,
  SENSITIVE_REASON_MIN_LENGTH,
  isPermissionKey,
  isSensitivePermission,
  type PermissionKey,
  type SensitivePermissionKey,
} from "./rbac/permissions";

export {
  ADMIN_ZONE_ROLE_VALUES,
  ROLE_PERMISSIONS,
  isAdminZoneRole,
  listPermissionsForRole,
  roleHasPermission,
  type AdminZoneRole,
} from "./rbac/roles";

export {
  hasPermission,
  requirePermission,
  requireAnyPermission,
} from "./rbac/guards";

export {
  SensitiveActionError,
  assertSensitiveAction,
  assertSensitiveActionInput,
} from "./rbac/sensitive";

export {
  writeOpsAuditLog,
  sanitizeAuditMeta,
  assertNoSecretsInText,
  updateAuditLog,
  deleteAuditLog,
  type AuditActorType,
  type OpsAuditWriteInput,
} from "./audit/ops-audit-log";

export {
  maskEmail,
  maskPhone,
  maskIban,
  maskNationalId,
  omitSensitiveKeys,
} from "./security/masking";

export {
  requireAdminApiPermission,
  adminJson,
  adminErrorResponse,
  parseJsonBody,
  parseSearchParams,
  auditAdminApiAccess,
  rejectUniversalDbEditor,
  assertActorIsSessionUser,
  AdminApiError,
} from "./api/admin-http";

export { withAdminMutation } from "./api/with-admin-mutation";

export { runAdminGlobalSearch } from "./api/admin-search";

export {
  createIncident,
  listIncidents,
  getIncidentDetail,
  updateIncidentStatus,
  appendIncidentTimeline,
  linkIncidentEntity,
  INCIDENT_SEV_LEVELS,
  INCIDENT_OPS_STATUSES,
  type IncidentSevLevel,
  type IncidentOpsStatus,
} from "./incidents/incident-ops";

export {
  listDatasets,
  upsertDataset,
  recordDatasetQualityScore,
  setDatasetHealth,
  addDatasetLineage,
  getDatasetLineageGraph,
  deriveHealthFromSla,
  DATASET_HEALTH_STATUSES,
  type DatasetHealthStatus,
  type DatasetRegistryItem,
} from "./datasets/dataset-registry";

export {
  buildOperationsAttentionQueue,
  ATTENTION_SEVERITIES,
  type AttentionItem,
  type AttentionSeverity,
  type AttentionItemType,
} from "./service/attention-queue";

export {
  buildOperationsKpis,
  type OperationsKpis,
} from "./service/operations-kpis";

export {
  buildAdminInternalMetrics,
  type AdminInternalMetrics,
} from "./service/admin-internal-metrics";
