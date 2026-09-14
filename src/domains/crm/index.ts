/**
 * Marketplace CRM — Inquiry / QualifiedBuyerLead + internal Lead pipeline.
 */

export {
  QUALIFICATION_RULE_VERSION,
  FORBIDDEN_QUALIFICATION_ATTRIBUTES,
  evaluateBuyerQualification,
  stripForbiddenQualificationAttrs,
  roundBudgetToBand,
  formatBudgetBandCs,
  TIMELINE_BANDS,
  TIMELINE_BAND_LABELS_CS,
  FINANCING_STANCE_LABELS_CS,
  type QualificationInput,
  type QualificationResult,
  type QualificationCheck,
  type TimelineBand,
} from "./qualification-rules";

export {
  buildAnonymizedQualifiedProfile,
  sanitizeAgentFacingPayload,
  canAgentViewFullFinancialProfile,
  type AnonymizedQualifiedProfile,
  type AgentRevealedBuyerProfile,
} from "./privacy";

export { createInquiry, getInquiryForAgent } from "./inquiry-service";

export {
  createQualifiedBuyerLead,
  getAgentLeadView,
  acceptQualifiedBuyerLead,
  markFullProfileRevealed,
} from "./qualified-buyer-lead-service";

export {
  listQualifiedBuyerInbox,
  recordQualifiedBuyerFirstResponse,
  computeSlaDueAt,
  evaluateSlaBreach,
  QBL_FIRST_RESPONSE_SLA_HOURS,
  type QualifiedBuyerInboxItem,
} from "./qualified-buyer-inbox";

export {
  setLeadOwner,
  setLeadExpectedValue,
  toPublicLeadDto,
} from "./lead-value";

export {
  resolveCrmLeadRouting,
  type CrmRoutingDecision,
  type CrmRoutingInput,
} from "./lead-routing";

export {
  sanitizeCrmPlainText,
  escapeHtmlForDisplay,
} from "./sanitize-notes";

export {
  canActorViewLead,
  buildLeadAccessWhere,
  assertCanViewLead,
  isSystemAdmin,
  listManagedOrganizationIds,
  type CrmActor,
} from "./access";

export {
  LEAD_STATUS_LABELS_CS,
  LEAD_STATUS_TRANSITIONS,
  canTransitionLeadStatus,
  applyLeadRouting,
  transitionLeadStatus,
  assignLead,
  addInternalLeadNote,
  setLeadNextAction,
  getLeadTimeline,
  listAccessibleLeads,
  type TimelineEntry,
} from "./pipeline";
