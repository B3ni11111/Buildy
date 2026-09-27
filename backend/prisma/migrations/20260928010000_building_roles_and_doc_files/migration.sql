-- Building roles become committee_head / committee_member / manager / resident
-- (global super-users are users.is_admin). Docs gain the uploaded file's metadata.

-- AlterEnum
BEGIN;
CREATE TYPE "user_role_new" AS ENUM ('committee_head', 'committee_member', 'manager', 'resident');
ALTER TABLE "users_roles" ALTER COLUMN "role" TYPE "user_role_new" USING ("role"::text::"user_role_new");
ALTER TYPE "user_role" RENAME TO "user_role_old";
ALTER TYPE "user_role_new" RENAME TO "user_role";
DROP TYPE "public"."user_role_old";
COMMIT;

-- AlterTable
ALTER TABLE "docs" ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD COLUMN     "size_bytes" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "docs_building_id_upload_date_idx" ON "docs"("building_id", "upload_date");

