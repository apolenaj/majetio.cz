-- Personal decision priority on Favourite (HIGH/MEDIUM/LOW).
-- Distinct from Int sort column `priority` and from Property.status.

ALTER TABLE "Favourite" ADD COLUMN IF NOT EXISTS "decisionPriority" "DecisionPriorityLevel";

CREATE INDEX IF NOT EXISTS "Favourite_userId_decisionPriority_idx" ON "Favourite"("userId", "decisionPriority");
