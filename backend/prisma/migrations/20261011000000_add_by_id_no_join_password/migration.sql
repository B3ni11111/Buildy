-- Residents no longer join with a shared password: building management adds them by
-- their user ID and sets their apartments directly, so join suggestions go too.
ALTER TABLE "buildings" DROP COLUMN "password_hash";

ALTER TABLE "building_users" DROP COLUMN "requested_apartment",
DROP COLUMN "requested_relation";
