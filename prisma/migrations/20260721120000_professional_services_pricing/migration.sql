-- Professional services PricingPlan seeds (checklist 221)
INSERT INTO "PricingPlan" (
  "id", "key", "versionKey", "name", "description", "billingType", "status",
  "priceGrossMinor", "currency", "vatRateBp", "entitlesProductKey",
  "limits", "features", "sortOrder", "activeFrom", "createdAt", "updatedAt"
)
VALUES
(
  'plan_expert_review_v2026_07',
  'expert_review',
  'v2026.07',
  'Expert Review',
  'Human-in-the-loop review — ne automatická analýza.',
  'ONE_TIME',
  'ACTIVE',
  299000,
  'CZK',
  2100,
  'expert_review',
  '{"humanInTheLoop": true}'::jsonb,
  '["WAITING_FOR_INPUTS", "ASSIGNED", "IN_REVIEW", "DELIVERED"]'::jsonb,
  90,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_investment_audit_v2026_07',
  'investment_audit',
  'v2026.07',
  'Investment Audit',
  'Hloubkový investiční audit specialistou.',
  'ONE_TIME',
  'ACTIVE',
  799000,
  'CZK',
  2100,
  'investment_audit',
  '{"humanInTheLoop": true}'::jsonb,
  '["Human-in-the-loop", "Delší review cyklus"]'::jsonb,
  95,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_majetio_free_v2026_07',
  'majetio_free',
  'v2026.07',
  'Majetio Free',
  'Základní skóre a rizika — skutečná hodnota, ne prázdný paywall.',
  'ONE_TIME',
  'ACTIVE',
  0,
  'CZK',
  2100,
  'majetio_free',
  '{"simpleComparisonsMax": 2, "propertyDetailViewsPerDay": 60}'::jsonb,
  '["BASIC_SCORE", "BASIC_RISKS"]'::jsonb,
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key", "versionKey") DO NOTHING;
