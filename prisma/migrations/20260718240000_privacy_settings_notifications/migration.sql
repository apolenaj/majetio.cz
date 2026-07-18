-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingEmail" TEXT;

-- AlterTable UserProfile — notification prefs (marketing defaults OFF)
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "notifyTransactionalEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "notifyTransactionalInApp" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "notifyMarketingEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "notifyMarketingInApp" BOOLEAN NOT NULL DEFAULT false;

-- ConsentVersion catalog for optional / partner consents
INSERT INTO "ConsentVersion" ("id", "type", "version", "title", "summary", "documentUrl", "effectiveFrom", "isCurrent", "createdAt")
VALUES
  (
    'cmconsent_marketing_20260701',
    'MARKETING',
    '2026-07-01',
    'Marketingová komunikace',
    'Souhlas s e-mailovými a in-app tipy, které nejsou nutné k poskytnutí služby. Lze kdykoli odvolat.',
    '/ucet/souhlasy',
    TIMESTAMP '2026-07-01 00:00:00',
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'cmconsent_hj_20260701',
    'HYPOTEKAJASNE_HANDOFF',
    '2026-07-01',
    'Předání údajů HypotekaJasne.cz',
    'Jednorázový souhlas s předáním vybraných údajů partnerovi HypotekaJasne za účelem nabídky financování. Bez výslovného potvrzení se data neodesílají.',
    'https://hypotekajasne.cz',
    TIMESTAMP '2026-07-01 00:00:00',
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'cmconsent_partner_20260701',
    'PARTNER_SHARE',
    '2026-07-01',
    'Sdílení s dalšími partnery',
    'Obecný rámec pro případné předání údajů dalším partnerům — vždy jen po výslovném souhlasu a s náhledem dat.',
    '/ucet/souhlasy',
    TIMESTAMP '2026-07-01 00:00:00',
    true,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("type", "version") DO NOTHING;
