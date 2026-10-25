-- Messages become issues with a status. Existing rows are kept as `opened` issues;
-- the old general/urgent/maintenance type is dropped (issue types come later).
CREATE TYPE "issue_status" AS ENUM ('opened', 'in_process', 'denied', 'resolved');

ALTER TABLE "messages" RENAME TO "issues";
ALTER TABLE "issues" RENAME CONSTRAINT "messages_pkey" TO "issues_pkey";
ALTER TABLE "issues" RENAME CONSTRAINT "messages_building_id_fkey" TO "issues_building_id_fkey";
ALTER TABLE "issues" RENAME CONSTRAINT "messages_author_fkey" TO "issues_author_fkey";
ALTER TABLE "issues" RENAME COLUMN "upload_date" TO "created_at";
ALTER INDEX "messages_building_id_upload_date_idx" RENAME TO "issues_building_id_created_at_idx";

ALTER TABLE "issues" DROP COLUMN "type",
ADD COLUMN "status" "issue_status" NOT NULL DEFAULT 'opened',
ADD COLUMN "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "last_pinged_at" TIMESTAMP(3);

UPDATE "issues" SET "status_changed_at" = "created_at";

DROP TYPE "message_type";

-- CreateTable
CREATE TABLE "issue_updates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issue_id" UUID NOT NULL,
    "author" UUID,
    "from_status" "issue_status" NOT NULL,
    "to_status" "issue_status" NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issue_id" UUID NOT NULL,
    "update_id" UUID,
    "uploader" UUID,
    "src" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_updates_issue_id_created_at_idx" ON "issue_updates"("issue_id", "created_at");

-- CreateIndex
CREATE INDEX "issue_attachments_issue_id_idx" ON "issue_attachments"("issue_id");

-- AddForeignKey
ALTER TABLE "issue_updates" ADD CONSTRAINT "issue_updates_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_updates" ADD CONSTRAINT "issue_updates_author_fkey" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_attachments" ADD CONSTRAINT "issue_attachments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_attachments" ADD CONSTRAINT "issue_attachments_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "issue_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_attachments" ADD CONSTRAINT "issue_attachments_uploader_fkey" FOREIGN KEY ("uploader") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
