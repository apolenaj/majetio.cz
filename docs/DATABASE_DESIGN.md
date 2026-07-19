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
**Purpose:** Canonical multi-source listing / analysis subject (Prompt 7).  
**Identity:** `id`, `slug`, `canonicalKey`, `status`, `visibility` (PUBLIC/PRIVATE/ACCOUNT_ONLY), `transactionType`, timestamps.  
**Basics:** `title`, `description`, `propertyType`, `condition`, `constructionType`, `ownershipType`.  
**Price:** `askingPrice`, `originalAskingPrice`, `currency`, `pricePerSqm`, `negotiable` (+ legacy `priceCzk`).  
**Size:** `usableArea`, `floorArea`, `landArea`, `layout`, room counts (+ legacy `areaSqm` / `disposition`).  
**Building:** floor, yearBuilt, energyRating, parking, elevator, …  
**Location split:** public (`publicLabel`, `addressPrecision`, public city/district/region) vs internal (`street`, house numbers, GPS). Exact address is not public by default.  
**Relations:** `PropertyFeatures` (1:1 flags), `PropertyAttribute` (EAV), sources, images, histories.  
**Sensitivity:** Exact address + GPS = restricted; public label only when precision allows.  
**Retention:** Prefer unpublish over hard delete when referenced.

### PropertySource / PropertySourcePayload / PropertyFieldProvenance
**Purpose:** Multi-source provenance (Prompt 7 Part 2).  
**PropertySource:** `sourceType` (manual, partner_feed, licensed_api, …), `externalPropertyId`, `licenseStatus`, lifecycle (`firstSeenAt` / `lastSeenAt` / `lastFetchedAt`).  
**PropertySourcePayload:** minimized raw JSON, isolated from production DTOs; `piiRedacted` default true.  
**PropertyFieldProvenance:** which source last confirmed a canonical field.  
**Sensitivity:** Raw payloads may contain partner/scraped data — access-controlled; prefer redaction.

### PropertyPriceHistory / PropertyStatusHistory
**Purpose:** Trustable change tracking.  
**Price:** `amount`, `currency`, `changeType` (initial/increased/decreased/…), `sourceId`, `observedAt`.  
**Status:** `previousStatus` → `newStatus` (e.g. ACTIVE → UNAVAILABLE when source silent — not assumed sold).

### PropertyMedia
**Purpose:** Photos, floorplans, documents, video.  
**Key fields:** `url`, `type`, `sortOrder`, `licenseStatus`, `isPrimary`, `isPlaceholder`.  
**Note:** Legacy `PropertyImage` kept temporarily; prefer `PropertyMedia`.

### Property lifecycle / freshness
**Fields:** `firstSeenAt`, `lastSeenAt`, `lastFetchedAt`, `freshness` (FRESH/STALE/UNAVAILABLE), `staleMarkedAt`.  
**Rule (helper):** silent source ≥14d → STALE; ≥30d → UNAVAILABLE (`src/lib/properties/freshness.ts`).

### PropertyDuplicateCandidate
**Purpose:** Suspected duplicate pairs (Prompt 7 Part 3).  
**Key fields:** `propertyAId`, `propertyBId`, `similarityScore`, `scoreBreakdown`, `status` (PENDING/MERGED/NOT_DUPLICATE), `mergeIntoPropertyId`.  
**Scoring:** high weight address/GPS, medium area, low price/text (`src/domains/properties/service/dedupe-score.ts`).  
**Merge:** non-destructive — keep canonical + source history; verified source wins; never hard-delete the secondary listing (`merge-strategy.ts`).

### DataQualityIssue / DataCompletenessScore
**Purpose:** Anomaly flags + internal fill metric.  
**Issues:** `ruleCode`, `severity` (CRITICAL/WARNING/INFO), `message`, `field`, `status`. Critical: price ≤ 0, area ≤ 0. Warning: extreme Kč/m², area mismatch.  
**Completeness:** 0–100 weighted presence (price, location, area, title, …).

### PropertyFieldOverride
**Purpose:** Analyst lock/override so a later feed import does not overwrite the field.  
**Key fields:** `propertyId`, `fieldKey`, `value`, `locked`, `reason`, audit user refs.

### ImportJob / ImportJobItem
**Purpose:** Scheduled / webhook import runs with idempotency (Prompt 7 Part 4).  
**ImportJob:** `idempotencyKey`, `provider`, `status`, counters (`processed` / success / error / skipped), `errors` JSON.  
**ImportJobItem:** per-record `idempotencyKey` (`provider:ext:…` or payload hash) — same payload must not create a duplicate Property.  
**Source uniqueness:** `PropertySource @@unique([provider, externalPropertyId])`.  
**Pipeline:** Ingest → Validate → Sanitize → Normalize → Detect Duplicates → Canonical Update (`src/domains/property-sources/service/`).

### Search indexes (Property)
Composite indexes for listing discovery (Prompt 7–8): `status+askingPrice`, `status+publicCity+askingPrice`, `status+propertyType+askingPrice`, `status+publicCity+propertyType`, `status+condition`, `status+ownershipType`, `status+publishedAt`, `status+layout+askingPrice`, `usableArea`, `landArea`, GPS, region.  
**Prompt 8 service:** `PropertySearchService` — Zod input, whitelist sorts (`newest` / `price_asc` / `price_desc` / `price_per_sqm`), normalized filters (location, price, type, layout, area, condition, ownership), page/cursor pagination, always `ACTIVE`+`PUBLIC` for anonymous discovery.

### Demo + ownership (Part 5)
**Fields:** `isDemo` (seed/UI demos), `ownerUserId` (PRIVATE / ACCOUNT_ONLY IDOR guard).  
**Seed:** `npm run db:seed:demo-properties` · in-memory catalog `src/content/demo-canonical-properties.ts`.

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
