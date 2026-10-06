-- Building roles become: committee_head, management_company, resident.
--   committee_member -> resident   (every resident is a member; no separate committee-member role)
--   manager          -> management_company
-- Written by hand (not prisma migrate diff) so existing rows are mapped instead of failing the cast.

BEGIN;

-- A member who already has a resident row would collide on the (user, building, role) unique key.
DELETE FROM "users_roles" cm
WHERE cm."role" = 'committee_member'
  AND EXISTS (
    SELECT 1 FROM "users_roles" r
    WHERE r."user_id" = cm."user_id" AND r."building_id" = cm."building_id" AND r."role" = 'resident'
  );

CREATE TYPE "user_role_new" AS ENUM ('committee_head', 'management_company', 'resident');

ALTER TABLE "users_roles" ALTER COLUMN "role" TYPE "user_role_new" USING (
  CASE "role"::text
    WHEN 'committee_member' THEN 'resident'
    WHEN 'manager' THEN 'management_company'
    ELSE "role"::text
  END
)::"user_role_new";

ALTER TYPE "user_role" RENAME TO "user_role_old";
ALTER TYPE "user_role_new" RENAME TO "user_role";
DROP TYPE "user_role_old";

COMMIT;
