-- Apartments become their own table (a user can hold several apartments in a building,
-- and an apartment can have an owner and a renter). Adds building blocks, profile
-- pictures, nullable authors ("Former resident"), and drops users.user_type.
-- Hand-written so existing building_users data is MOVED, not dropped:
--   apartment + relation known -> apartments row + confirmed apartment_residents link
--   apartment known, no relation -> apartments row; number kept as requested_apartment
--   relation known, no apartment -> kept as requested_relation (management confirms later)

BEGIN;

-- New tables ---------------------------------------------------------------
CREATE TABLE "apartments" (
    "id" SERIAL NOT NULL,
    "building_id" UUID NOT NULL,
    "number" SMALLINT NOT NULL,
    "floor" INTEGER,
    "sqrm" INTEGER,
    "monthly_payment" INTEGER,
    "payment_method" "payment_method",
    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "apartments_building_id_number_key" ON "apartments"("building_id", "number");
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "apartment_residents" (
    "id" SERIAL NOT NULL,
    "apartment_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "relation_type" "relation_type" NOT NULL,
    CONSTRAINT "apartment_residents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "apartment_residents_apartment_id_user_id_key" ON "apartment_residents"("apartment_id", "user_id");
ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "building_blocks" (
    "id" SERIAL NOT NULL,
    "building_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "blocked_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "building_blocks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "building_blocks_building_id_user_id_key" ON "building_blocks"("building_id", "user_id");
ALTER TABLE "building_blocks" ADD CONSTRAINT "building_blocks_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "building_blocks" ADD CONSTRAINT "building_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "building_blocks" ADD CONSTRAINT "building_blocks_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Join-time suggestion columns ------------------------------------------------
ALTER TABLE "building_users" ADD COLUMN "requested_apartment" SMALLINT,
ADD COLUMN "requested_relation" "relation_type";

-- Move apartment data ---------------------------------------------------------
-- One apartment per (building, number); if several members listed the same number,
-- the earliest member's floor/size/payment details win.
INSERT INTO "apartments" ("building_id", "number", "floor", "sqrm", "monthly_payment", "payment_method")
SELECT DISTINCT ON ("building_id", "apartment")
       "building_id", "apartment", "floor", "sqrm", "monthly_payment", "payment_method"
FROM "building_users"
WHERE "apartment" IS NOT NULL
ORDER BY "building_id", "apartment", "joined_at";

INSERT INTO "apartment_residents" ("apartment_id", "user_id", "relation_type")
SELECT a."id", bu."user_id", bu."relation_type"
FROM "building_users" bu
JOIN "apartments" a ON a."building_id" = bu."building_id" AND a."number" = bu."apartment"
WHERE bu."relation_type" IS NOT NULL;

UPDATE "building_users"
SET "requested_apartment" = CASE WHEN "relation_type" IS NULL THEN "apartment" END,
    "requested_relation"  = CASE WHEN "apartment" IS NULL THEN "relation_type" END;

ALTER TABLE "building_users" DROP COLUMN "apartment",
DROP COLUMN "floor",
DROP COLUMN "monthly_payment",
DROP COLUMN "payment_method",
DROP COLUMN "relation_type",
DROP COLUMN "sqrm";

-- Users: profile pictures; user_type replaced by per-building relation --------
ALTER TABLE "users" DROP COLUMN "user_type",
ADD COLUMN "avatar_src" TEXT,
ADD COLUMN "google_picture" TEXT;

-- Authors become nullable so content survives account deletion ----------------
ALTER TABLE "docs" DROP CONSTRAINT "docs_uploader_fkey";
ALTER TABLE "messages" DROP CONSTRAINT "messages_author_fkey";
ALTER TABLE "docs" ALTER COLUMN "uploader" DROP NOT NULL;
ALTER TABLE "messages" ALTER COLUMN "author" DROP NOT NULL;
ALTER TABLE "docs" ADD CONSTRAINT "docs_uploader_fkey" FOREIGN KEY ("uploader") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_fkey" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
