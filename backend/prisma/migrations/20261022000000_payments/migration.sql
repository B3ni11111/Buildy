-- Payments (demo): one row per apartment per month, kept as a permanent log. Rows go away
-- only with their building; removing an apartment or a user keeps them (SET NULL).
CREATE TYPE "payment_status" AS ENUM ('unpaid', 'pending', 'paid', 'failed');

CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_id" UUID NOT NULL,
    "apartment_id" INTEGER,
    "apartment_number" SMALLINT NOT NULL,
    "period" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'unpaid',
    "paid_at" TIMESTAMP(3),
    "paid_by" UUID,
    "provider" TEXT,
    "external_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_building_id_apartment_number_period_key" ON "payments"("building_id", "apartment_number", "period");
CREATE INDEX "payments_building_id_period_idx" ON "payments"("building_id", "period");

ALTER TABLE "payments" ADD CONSTRAINT "payments_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
