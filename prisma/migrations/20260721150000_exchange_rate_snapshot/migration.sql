-- Prompt 17.2 — ExchangeRateSnapshot persistence

CREATE TABLE "ExchangeRateSnapshot" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "providerRef" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExchangeRateSnapshot_baseCurrency_quoteCurrency_observedAt_source_key"
  ON "ExchangeRateSnapshot"("baseCurrency", "quoteCurrency", "observedAt", "source");

CREATE INDEX "ExchangeRateSnapshot_baseCurrency_quoteCurrency_observedAt_idx"
  ON "ExchangeRateSnapshot"("baseCurrency", "quoteCurrency", "observedAt");

CREATE INDEX "ExchangeRateSnapshot_observedAt_idx" ON "ExchangeRateSnapshot"("observedAt");
