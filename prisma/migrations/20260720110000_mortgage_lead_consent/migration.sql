-- Add granular mortgage lead consent type (Prompt 13/4)
ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'MORTGAGE_LEAD_DATA_TRANSFER';
