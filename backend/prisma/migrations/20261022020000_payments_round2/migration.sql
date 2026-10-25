-- Payments round 2: methods (card + Bit/PayBox as one), who paid vs who confirmed, how it was
-- confirmed, the apartment's payer (chosen by an owner), when a resident was linked to an
-- apartment, and each building's payments setup.

-- payment_method: cash, transfer, bit, paybox -> card, cash, transfer, bit_paybox
CREATE TYPE "payment_method_new" AS ENUM ('card', 'cash', 'transfer', 'bit_paybox');
ALTER TABLE "apartments" ALTER COLUMN "payment_method" TYPE "payment_method_new"
  USING (CASE WHEN "payment_method"::text IN ('bit', 'paybox') THEN 'bit_paybox' ELSE "payment_method"::text END)::"payment_method_new";
DROP TYPE "payment_method";
ALTER TYPE "payment_method_new" RENAME TO "payment_method";

CREATE TYPE "payment_confirmation" AS ENUM ('single', 'bulk', 'self', 'automatic');
CREATE TYPE "payments_open_mode" AS ENUM ('manual', 'auto');

-- payments: who confirmed, how, which method. Until now paid_by held whoever marked it paid.
ALTER TABLE "payments" ADD COLUMN "confirmed_by" UUID,
  ADD COLUMN "confirmation" "payment_confirmation",
  ADD COLUMN "method" "payment_method";
UPDATE "payments" SET "confirmed_by" = "paid_by" WHERE "status" = 'paid';
ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- apartments: who pays, chosen by an owner (empty = an owner pays).
ALTER TABLE "apartments" ADD COLUMN "payer_id" UUID;
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- apartment_residents: when they were linked; existing links use the date they joined the building.
ALTER TABLE "apartment_residents" ADD COLUMN "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "apartment_residents" ar SET "linked_at" = bu."joined_at"
  FROM "apartments" a, "building_users" bu
  WHERE a."id" = ar."apartment_id" AND bu."building_id" = a."building_id" AND bu."user_id" = ar."user_id";

CREATE TABLE "building_payment_settings" (
    "building_id" UUID NOT NULL,
    "open_mode" "payments_open_mode" NOT NULL DEFAULT 'manual',
    "open_day" SMALLINT NOT NULL DEFAULT 1,
    "default_fee" INTEGER,
    "default_method" "payment_method",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "building_payment_settings_pkey" PRIMARY KEY ("building_id")
);
ALTER TABLE "building_payment_settings" ADD CONSTRAINT "building_payment_settings_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
