# Database Design — Majetio.cz (v1)

PostgreSQL via Prisma. Fields are intentionally lean and extensible.

## Enums

- `Role` — VISITOR is implicit (unauthenticated); persisted roles start at USER
- `PropertyStatus`, `AnalysisStatus`, `OrderStatus`, `PaymentStatus`, `LeadStatus`, `LeadType`, `ConsentType`, `NotificationChannel`

## Models

### User
**Purpose:** Identity and authorization.  
**Key fields:** `id`, `email`, `emailVerified`, `name`, `image`, `role`, `passwordHash` (optional for credentials).  
**Relations:** profile, financialProfile, consents, favourites, comparisons, analyses, orders, leads, notifications, auditLogs.  
**Sensitivity:** PII (email, name). Encrypt at rest via DB provider; never log password hashes.  
**Retention:** Soft-delete candidate; GDPR erasure cascades to profile/financial where required.

### UserProfile
**Purpose:** Non-auth profile preferences.  
**Key fields:** `userId`, `phone`, `preferredLocale`, `investmentGoal`, `notes`.  
**Sensitivity:** PII (phone).  
**Retention:** Deleted with user erasure.

### FinancialProfile
**Purpose:** Shared financing context for Majetio + future HypotekaJasne handoff.  
**Key fields:** `userId`, `monthlyIncomeCzk`, `monthlyLiabilitiesCzk`, `availableEquityCzk`, `employmentType`, `creditScoreBand` (optional coarse band).  
**Sensitivity:** **High** financial PII. Access only for owner + authorized staff.  
**Retention:** Explicit consent; purge on request; never send to partners without Consent.

### Consent / ConsentVersion
**Purpose:** Legal basis + version catalog for terms/privacy/marketing/handoff.  
**Key fields (Consent):** `userId`, `type`, `granted`, `version`, `grantedAt`, `revokedAt`.  
**Key fields (ConsentVersion):** `type`, `version`, `title`, `isCurrent`, `documentUrl`.  
**Sensitivity:** Legal evidence — keep history after revoke.  

### PropertyPreference / InvestmentPreference
**Purpose:** Onboarding preferences (filled in later Prompt 6 parts).  
**Sensitivity:** User preference PII linkage; cascade delete with user.

### AuthRateLimit
**Purpose:** Brute-force protection for login/register/reset.  
**Key fields:** `key` (ip:email), `failCount`, `lockedUntil`.

### AuditLog
**Purpose:** Security and compliance trail (login, password reset, consent, …).  
**Key fields:** `actorId`, `action`, `entity`, `entityId`, `ip`, `userAgent`, `meta`, `createdAt`.  
**Sensitivity:** Security; append-only.  
**Retention:** Long-lived.


### Property
**Purpose:** Canonical listing / subject of analysis.  
**Key fields:** `slug`, `title`, `description`, `propertyType`, `disposition`, `areaSqm`, `priceCzk`, `currency`, `status`, `address*` / `locationId`, `sourcePrimaryId`.  
**Sensitivity:** Public listing data mostly; exact address may be restricted until lead.  
**Retention:** Keep historical for valuation comps; mark unpublished rather than hard delete when referenced.

### PropertySource
**Purpose:** Provenance of listing data (portal, partner, manual).  
**Key fields:** `propertyId`, `provider`, `externalId`, `url`, `rawPayload` (JSON), `fetchedAt`.  
**Sensitivity:** May contain scraped/partner data — access-controlled.  
**Retention:** Align with provider ToS.

### PropertyImage
**Purpose:** Listing media.  
**Key fields:** `propertyId`, `url`, `alt`, `sortOrder`, `isPrimary`.  
**Sensitivity:** Low.

### PropertyPriceHistory / PropertyStatusHistory
**Purpose:** Change tracking for trust and valuation.  
**Key fields:** previous/new values, `changedAt`, `source`.  
**Sensitivity:** Low–medium.

### PropertyAnalysis
**Purpose:** Container for analysis run (free or paid).  
**Key fields:** `userId`, `propertyId`, `status`, `tier` (BASIC/FULL), `majetioScore`, `summary`, `createdAt`.  
**Sensitivity:** User-linked; paid results are entitlements.  
**Retention:** Keep for account history; anonymize on erasure if legally needed.

### AnalysisScenario
**Purpose:** Alternative assumptions (rent, rate, hold period).  
**Key fields:** `analysisId`, `name`, `assumptions` (JSON), `results` (JSON).  
**Sensitivity:** Derived; still user-linked.

### Valuation / ValuationComparable
**Purpose:** Estimated value + comps.  
**Key fields:** `estimatedValueCzk`, `method`, `confidence`, comps linking other properties or external refs.  
**Sensitivity:** Medium — commercial IP of methodology outputs.

### InvestmentCalculation
**Purpose:** Persisted calculation snapshot.  
**Key fields:** `analysisId`, `inputs`, `outputs`, `engineVersion`.  
**Sensitivity:** Medium. Engine version enables reproducibility.

### RenovationEstimate
**Purpose:** Capex estimate.  
**Key fields:** `analysisId`, `scope`, `estimatedCostCzk`, `contingencyPct`, `lineItems` (JSON).  
**Sensitivity:** Medium.

### Location / LocationMetric
**Purpose:** Area context and time-series metrics.  
**Key fields:** `slug`, `name`, `region`, metrics (`type`, `value`, `period`, `source`).  
**Sensitivity:** Mostly public aggregates.

### Favourite / Comparison / SavedSearch
**Purpose:** User workspace.  
**Sensitivity:** User preference PII linkage.

### Lead / LeadActivity
**Purpose:** CRM pipeline (analysis interest, financing, partners).  
**Key fields:** `type`, `status`, `userId`, `propertyId`, `payload`, activities timeline.  
**Sensitivity:** **High** — sales PII. Staff-only.  
**Retention:** CRM policy + consent.

### Order / Payment
**Purpose:** Commerce for paid analysis (and later services).  
**Key fields:** amounts from config snapshot, currency, status, provider refs.  
**Sensitivity:** Financial; PCI via payment provider (store tokens/refs only).  
**Retention:** Accounting statutory period.

### Partner
**Purpose:** Partner directory for future commissions.  
**Sensitivity:** Business contact data.

### Notification
**Purpose:** In-app / email notification queue.  
**Sensitivity:** Contains user messages.

### AppConfiguration
**Purpose:** Central runtime config (prices, commission rates, feature flags).  
**Key fields:** `key`, `value` (JSON), `updatedAt`, `updatedById`.  
**Sensitivity:** Business-sensitive; admin-only write.

## Security notes

- FinancialProfile and Lead require server RBAC
- Price/commission keys: `pricing.fullAnalysisCzk`, `commission.transactionRate`, etc.
- Never store raw card numbers
