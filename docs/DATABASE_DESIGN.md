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
**Purpose:** Security and compliance trail (login, password reset, consent, ops actions).  
**Key fields:** `actorId`, `actorType`, `action`, `entity` / `entityType`, `entityId`, `reason`, `beforeSummary`, `afterSummary`, `correlationId`, `ip`, `userAgent`, `meta`, `createdAt` (timestamp).  
**Sensitivity:** Security; **strictly append-only** (DB triggers block UPDATE/DELETE). Never store secrets — `meta` and summaries are sanitized.  
**Indexes:** `(entityType, entityId)`, `(action, createdAt)`, `(correlationId)`, `(actorType, createdAt)`.  
**Retention:** Long-lived.

### Incident (+ Timeline + Linked Entities)
**Purpose:** Ops incident management (126–131).  
**Severity:** `SEV1`…`SEV4`. **Status:** `OPEN` → `ACKNOWLEDGED` → `INVESTIGATING` → `MITIGATED` → `RESOLVED` / `CLOSED`.  
**Fields:** `title`, `description`, `ownerUserId`, `startedAt`, `resolvedAt`, `affectedSystems[]`, `internalNotes`.  
**Relations:** `IncidentTimelineEvent`, `IncidentLinkedEntity`.

### DatasetRegistry (+ QualityScore + Lineage)
**Purpose:** Dataset governance metadata (218–227).  
**Fields:** owner, steward, source, update frequency, quality SLA (minutes + min score).  
**Health:** `HEALTHY` | `STALE` | `DEGRADED` | `DISABLED`.  
**Relations:** append-only-ish `DatasetQualityScore` history; directed `DatasetLineage`.


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
**Purpose:** Named investment scenario with frozen inputs and engine version stamps.  
**Key fields:** `propertyId`, `analysisId`, `scenarioType`, `status`, `inputSnapshot`, `assumptionSet`, `calculationEngineVersion`, `formulaRegistryVersion`, `inputHash`, `results`.  
**Rules:** Formula/code changes must not rewrite historical rows — insert new calculations. Cache via `inputHash` + `engineVersion`.  
**Sensitivity:** Derived; still user-linked via analysis.

### Valuation / ValuationComparable / ValuationAdjustmentAudit / ValuationModelRegistry
**Purpose:** Production valuation engine persistence (Prompt 10).  
**Valuation:** `type`, `modelVersion`, `status`, value bounds, confidence, `comparableCount`, **`inputSnapshot` (frozen inputs)**, `calculatedAt` / `validUntil`.  
**ValuationComparable:** linked `comparablePropertyId`, distance, ppsqm, price, similarity, weight, included/exclusionReason.  
**ValuationAdjustmentAudit:** append-only analyst field changes (`fieldKey`, previous/new JSON, reason).  
**ValuationModelRegistry:** algorithm versions (e.g. `residential_apartment_v1`) + supported `PropertyType[]`.  
**Sensitivity:** Medium — methodology IP; snapshots must not include unnecessary PII.  
**Retention:** Prefer supersede/outdate over hard delete when referenced by analyses/orders.

### InvestmentCalculation
**Purpose:** Append-only engine run snapshot (cacheable).  
**Key fields:** `analysisId`, `scenarioId`, `propertyId`, `inputs`, `outputs`, `engineVersion`, `formulaRegistryVersion`, `inputHash`.  
**Sensitivity:** Medium. Version stamps enable reproducibility without mutating history.

### RenovationEstimate
**Purpose:** Legacy CapEx estimate row.  
**Key fields:** `analysisId`, `scope`, `estimatedCostCzk`, `contingencyPct`, `lineItems` (JSON).  
**Sensitivity:** Medium.  
**Note:** Prefer **`RenovationAnalysis`** for new Renovation Engine work (Prompt 12).

### RenovationAnalysis
**Purpose:** Primary Renovation Engine entity — versioned CapEx analysis linked to property / analysis / scenario.  
**Key fields:** `type` (AUTOMATIC | USER_DEFINED | ANALYST_ADJUSTED | PROFESSIONAL), `status`, `scopeVersion`, `costModelVersion`, `locationCostVersion`, `estimatedLow|Base|High`, `contingencyAmount`, `estimatedDuration`, `confidence`, `calculatedAt`.
**Concept split:** `estimated*` = costs (C) only — not ARV (D). Condition (A) and scope (B) live in domain services / version stamps.  
**Sensitivity:** Medium.

### Location / LocationMetric
**Purpose:** Area context and time-series metrics (Location & Market Intelligence foundation).  
**Key fields:** `type` (COUNTRY → MICRO_LOCATION), `parentId`, `countryCode`, `slug`, `name`, `publicLabel`, official codes (`ruianCode`, `lauCode`, `nutsCode`), GeoJSON `boundary`, `centroidLat/Lon`, `population`, `areaSqKm`.  
**Property link:** `Property.locationId` + `locationResolutionConfidence` + `locationResolutionMeta` — assigned via `LocationResolutionService` (never inflate beyond input).  
**LocationMetric:** Registry key (`metricKey`), category (`PROPERTY_MARKET` … `DEVELOPMENT`), segmented rows (`segmentKey` + JSON `segment`), `priceKind` (`ASKING` | `TRANSACTION` | `NONE` — never merge asking/transaction), primary `value` (median for prices), `sampleCount`, quartiles, `confidence`, `methodologyVersion`, validity window.  
**LocationMetricHistory:** Append-only series for trend charts (MoM/QoQ/YoY).  
**Sensitivity:** Mostly public aggregates; boundaries may be licensed — access-controlled ingestion. Small samples → suppressed or low confidence (no false precision).  
**See:** `docs/LOCATION_DATA_MODEL.md`

### Favourite / Comparison / SavedSearch
**Purpose:** User workspace / Property Decision Workspace.  
**Favourite key fields:** `id`, `userId`, `propertyId`, `createdAt`, `status` (`SAVED` | `SHORTLISTED` | `VIEWING_PLANNED` | `ANALYZING` | `REJECTED`), optional `folder`, `priority`, `note`, `priceAtSave`.  
**Shortlist:** `SHORTLISTED` („Ve výběru“) — užší výběr oddělený od běžného „Uloženo“. UI vždy české labely, nikoli raw enum.  
**Comparison:** `Comparison` + `ComparisonProperty` (order/`sortOrder`, `addedAt`) + optional `manualOrder`. Max **4** properties — `comparisonConfig.maxProperties`. Canonical `ComparisonViewModel` for `/porovnani`.  
**Decision Workspace (private):** `PropertyUserNote`, `PropertyDecisionTask`, `DecisionPreference` — owner-only, never public/SEO/analytics.  
**Sensitivity:** User preference PII linkage.

### Lead / LeadActivity / LeadAssignment
**Purpose:** Internal CRM pipeline (status timeline, routing, nextAction, XSS-safe notes).  
**Key fields:** `type`, `status`, `assignedToUserId`, `organizationId`, `routingTarget`, `nextAction*`.  
**Routing:** mortgages → HypotekaJasne; inquiries → listing agent; audits → analysts.  
**RBAC:** agent = own; agency manager = org; system admin = all.  
**Docs:** `docs/CRM_PIPELINE.md`.  
**Sensitivity:** **High** — sales PII. Staff-only.  
**Retention:** CRM policy + consent.

### Inquiry / QualifiedBuyerLead (marketplace)
**Purpose:** Property inquiry vs product-qualified buyer lead (strictly separate).  
**Inquiry:** message interest only — no budget / financing / FinancialProfile.  
**QualifiedBuyerLead:** verified contact + budget band + financing stance; agent pre-accept sees anonymized profile only.  
**Consent:** `AGENT_BUYER_PROFILE_SHARE` required before agent sees full FinancialProfile (and only after ACCEPTED).  
**Docs:** `docs/MARKETPLACE_LEADS.md`.

### Revenue attribution (B2B leads)
**Purpose:** Org billing MODE A Pay Per Lead / MODE B Success Fee; canonical `RevenueEvent` ledger; attribution window; lead disputes.  
**Models:** `SuccessFeeRecord`, `RevenueEvent`, `LeadAttribution`, `LeadDispute`.  
**Double-count:** unique `(sourceType, sourceEntityId)` + `idempotencyKey`.  
**Docs:** `docs/REVENUE_ATTRIBUTION.md`.

### Professional services / Partner Marketplace / PropertyTransaction
**Purpose:** Human-in-the-loop Expert Review & Investment Audit; partner agreements (FIXED / REVENUE_SHARE); protected deal records.  
**Models:** `ProfessionalServiceRequest`, `PartnerCommercialAgreement`, `PartnerServiceOffering`, `PropertyTransaction` (+ access log).  
**Sensitivity:** `agreedPriceMinor` = **PROTECTED** (audited accessors only).  
**Feature flag:** `TRANSACTION_SUCCESS_FEE_ENABLED` (default false) gates Purchase Concierge.  
**Docs:** `docs/PROFESSIONAL_SERVICES.md`.

### Order / Payment / Commerce Data Layer
**Purpose:** Commerce for paid analysis (and later services).  
**Models:** `PricingPlan` (versioned catalog), `Promotion`, `Order`, `OrderItem` (price snapshot), `Payment`, `PaymentWebhookEvent`.  
**Key fields:** amounts from plan/promo quote frozen on `OrderItem`; currency CZK; provider refs only (no PAN).  
**Sensitivity:** Financial; PCI via payment provider.  
**Docs:** `docs/COMMERCE_DATA_LAYER.md`, `docs/PAYMENTS.md`.  
**Retention:** Accounting statutory period.

### Organization / OrganizationMember (B2B)
**Purpose:** Real-estate professional tenants (agent, agency, developer, partner).  
**Models:** `Organization`, `OrganizationMember`, `OrganizationPlanChange`.  
**Property links:** `organizationId`, `listedByUserId`, `listingVerificationStatus`, `listingQuotaState` (`WITHIN_LIMIT` | `OVER_LIMIT`).  
**Downgrade:** never auto-delete listings — mark `OVER_LIMIT` + CTA.  
**Docs:** `docs/ORGANIZATIONS_B2B.md`.

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
