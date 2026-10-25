-- The period becomes a timestamp (start of the period) so dev-only 5-minute test periods fit.
-- Existing month rows keep their value (midnight of the first day).
ALTER TABLE "payments" ALTER COLUMN "period" TYPE TIMESTAMP(3) USING "period"::timestamp;
