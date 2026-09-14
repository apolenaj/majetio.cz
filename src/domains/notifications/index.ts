export {
  enqueuePropertyAlertEvent,
  syncAlertSubscriptionsForSavedSearch,
  listUndeliveredAlertEvents,
} from "./service/property-alerts";

export {
  deliverPropertyAlert,
  resolveTransactionalChannels,
} from "./service/deliver-alert";

export {
  isMeaningfulPriceChange,
  processFavouritePriceChange,
} from "./service/price-alerts";

export {
  classifyStatusAlert,
  processFavouriteStatusChange,
} from "./service/status-alerts";

export { notifySavedSearchMatch } from "./service/saved-search-alerts";

export {
  recordPropertyPriceObservation,
  recordPropertyStatusChange,
  recordPropertyPublished,
} from "./service/lifecycle-hooks";

export {
  notifyNewAnalysisAvailable,
  notifyFinancingChanged,
  notifyFavouritesNewAnalysis,
} from "./service/analysis-financing-alerts";

export {
  PROPERTY_ALERT_TYPE_LABELS_CS,
  propertyAlertTypeLabel,
  buildPriceChangeCopy,
  buildStatusChangeCopy,
  buildRelistedCopy,
  buildSavedSearchBatchCopy,
  normalizeAlertType,
} from "./service/alert-copy";

export {
  priceAlertDedupeKey,
  statusAlertDedupeKey,
  relistedAlertDedupeKey,
  savedSearchMatchDedupeKey,
  savedSearchBatchKey,
} from "./service/alert-dedupe";

export {
  emitPropertyDomainEvent,
  emitPropertyCreatedIfActive,
  type PropertyDomainEvent,
} from "./events/property-events";

export {
  routeSavedSearchMatchAlert,
} from "./service/frequency-router";

export {
  digestBatchKey,
  enqueueDigestItem,
  buildDigestEmailFromAlert,
  listPendingDigestEmailAlerts,
  runDigestJob,
  summarizeDigestItems,
} from "./service/digest";

export {
  processPendingAlertEmails,
  defaultAlertEmailSender,
} from "./service/email-delivery";

export {
  sanitizeNotificationHref,
  buildAppAbsoluteUrl,
} from "./service/safe-href";

export {
  buildPropertyAlertInstantEmail,
  buildPropertyAlertDigestEmail,
  assertNoFinancingPayload,
} from "./service/alert-email-templates";

export {
  emitAlertTelemetry,
  registerAlertTelemetrySink,
  resetAlertMetricsForTests,
  alertMetrics,
} from "./observability/telemetry";
