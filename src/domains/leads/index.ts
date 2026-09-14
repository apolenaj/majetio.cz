export {
  hypotekajasneLeadPayloadSchema,
  mortgageLeadStatusDtoSchema,
  type HypotekaJasneLeadPayload,
  type MortgageLeadStatusDto,
  type CreateMortgageLeadInput,
  type SubmitMortgageLeadInput,
  type MortgageLeadDuplicateInfo,
} from "@/domains/leads/schemas/mortgage-lead";

export {
  MortgageLeadService,
  mortgageLeadService,
  buildPartnerPayload,
  type MortgageLeadServiceResult,
} from "@/domains/leads/service/mortgage-lead-service";

export {
  parseLeadSourceAttribution,
  buildExternalPropertyReference,
  type LeadAttribution,
} from "@/domains/leads/service/attribution";

export {
  generateMortgageLeadCorrelationId,
  isMortgageLeadCorrelationId,
} from "@/domains/leads/service/correlation-id";

export {
  buildMortgageLeadIdempotencyKey,
  isWithinDedupeWindow,
  isActiveMortgageLeadStatus,
  ACTIVE_MORTGAGE_LEAD_STATUSES,
  MORTGAGE_LEAD_DEDUPE_WINDOW_MS,
} from "@/domains/leads/service/idempotency";

export {
  retryPendingMortgageLeadSubmissions,
  executePartnerLeadSubmission,
} from "@/domains/leads/service/lead-submission";

export {
  processHypotekaJasneWebhook,
  PARTNER_SIGNATURE_HEADER,
  PARTNER_TIMESTAMP_HEADER,
} from "@/domains/leads/service/webhook-handler";

export {
  buildMortgageLeadSubmitConfirmation,
  mortgageLeadFinancingPageHref,
} from "@/domains/leads/service/user-messaging";

export {
  buildMortgageLeadTimeline,
  mortgageLeadNextStep,
  MORTGAGE_LEAD_TIMELINE_MILESTONES,
  type MortgageLeadTimelineStep,
} from "@/domains/leads/service/timeline";

export { notifyMortgageLeadStatusChange } from "@/domains/leads/service/status-notifications";

export type {
  MortgageLeadListItemDto,
  MortgageLeadDetailDto,
} from "@/domains/leads/schemas/mortgage-lead";

export {
  SUBMISSION_MAX_ATTEMPTS,
  computeNextRetryAt,
  shouldMoveToDeadLetter,
} from "@/domains/leads/service/submission-retry";

export {
  resolveMortgageLeadRouting,
  type LeadRoutingDecision,
  type LeadRoutingInput,
} from "@/domains/leads/service/routing";

export {
  initializeMortgageLeadCrm,
  getMortgageLeadCrmInternal,
  type MortgageLeadCrmRecord,
} from "@/domains/leads/service/crm-foundation";

export {
  computeInternalLeadValueMetrics,
  stripInternalLeadFields,
  INTERNAL_MORTGAGE_COMMISSION_BPS,
  type InternalLeadValueMetrics,
} from "@/domains/leads/service/internal-value-metrics";

export {
  buildMortgageLeadContextSnapshot,
  MORTGAGE_LEAD_SNAPSHOT_SCHEMA_VERSION,
  type MortgageLeadContextSnapshotData,
} from "@/domains/leads/service/context-snapshot";

export {
  sanitizeMortgageLeadAuditMeta,
  sanitizeLeadActivityMeta,
  type SafeMortgageLeadAuditMeta,
} from "@/domains/leads/service/privacy-guards";

export {
  computeMortgageLeadRetentionExpiresAt,
  requestMortgageLeadPiiDeletion,
  purgeExpiredMortgageLeadPii,
  MORTGAGE_LEAD_ACTIVE_RETENTION_YEARS,
} from "@/domains/leads/service/retention";

export {
  linkUnclaimedMortgageLeadsOnAuth,
  type LinkMortgageLeadsResult,
} from "@/domains/leads/service/lead-linking";

export {
  MORTGAGE_LEAD_STATUS_LABELS,
  MORTGAGE_LEAD_ALLOWED_TRANSITIONS,
  assertMortgageLeadTransition,
  mortgageLeadStatusLabel,
} from "@/domains/leads/service/workflow";
