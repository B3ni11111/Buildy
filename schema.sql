-- buildy: PostgreSQL schema (DDL only, no data).
-- Generated from backend/prisma/schema.prisma, which matches the migrations in backend/prisma/migrations
-- up to 20261012000000_issue_update_undo. Regenerate with:
--   cd backend && npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
-- gen_random_uuid() is built in on PostgreSQL 13+.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('committee_head', 'management_company', 'resident');

-- CreateEnum
CREATE TYPE "relation_type" AS ENUM ('owner', 'tenant');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'transfer', 'bit', 'paybox');

-- CreateEnum
CREATE TYPE "contact_type" AS ENUM ('email', 'whatsapp', 'phone');

-- CreateEnum
CREATE TYPE "issue_status" AS ENUM ('opened', 'in_process', 'denied', 'resolved');

-- CreateTable
CREATE TABLE "cities" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "entry_code" TEXT,
    "building_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cognito_sub" TEXT NOT NULL,
    "name" TEXT,
    "phone_num" TEXT,
    "email" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "onboarded_at" TIMESTAMP(3),
    "avatar_src" TEXT,
    "google_picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "building_id" UUID NOT NULL,
    "role" "user_role" NOT NULL,

    CONSTRAINT "users_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_users" (
    "id" SERIAL NOT NULL,
    "building_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "apartment_residents" (
    "id" SERIAL NOT NULL,
    "apartment_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "relation_type" "relation_type" NOT NULL,

    CONSTRAINT "apartment_residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_blocks" (
    "id" SERIAL NOT NULL,
    "building_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "blocked_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_links" (
    "id" SERIAL NOT NULL,
    "building_id" UUID NOT NULL,
    "type" "contact_type" NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "contact_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_id" UUID NOT NULL,
    "uploader" UUID,
    "title" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "src" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,

    CONSTRAINT "docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_id" UUID NOT NULL,
    "author" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "issue_status" NOT NULL DEFAULT 'opened',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_pinged_at" TIMESTAMP(3),

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_updates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issue_id" UUID NOT NULL,
    "author" UUID,
    "from_status" "issue_status" NOT NULL,
    "to_status" "issue_status" NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undone_at" TIMESTAMP(3),

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
CREATE UNIQUE INDEX "buildings_city_id_address_key" ON "buildings"("city_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_roles_user_id_building_id_role_key" ON "users_roles"("user_id", "building_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "building_users_building_id_user_id_key" ON "building_users"("building_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "apartments_building_id_number_key" ON "apartments"("building_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "apartment_residents_apartment_id_user_id_key" ON "apartment_residents"("apartment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "building_blocks_building_id_user_id_key" ON "building_blocks"("building_id", "user_id");

-- CreateIndex
CREATE INDEX "docs_building_id_upload_date_idx" ON "docs"("building_id", "upload_date");

-- CreateIndex
CREATE INDEX "issues_building_id_created_at_idx" ON "issues"("building_id", "created_at");

-- CreateIndex
CREATE INDEX "issue_updates_issue_id_created_at_idx" ON "issue_updates"("issue_id", "created_at");

-- CreateIndex
CREATE INDEX "issue_attachments_issue_id_idx" ON "issue_attachments"("issue_id");

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_users" ADD CONSTRAINT "building_users_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_users" ADD CONSTRAINT "building_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_blocks" ADD CONSTRAINT "building_blocks_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_blocks" ADD CONSTRAINT "building_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_blocks" ADD CONSTRAINT "building_blocks_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_links" ADD CONSTRAINT "contact_links_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs" ADD CONSTRAINT "docs_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs" ADD CONSTRAINT "docs_uploader_fkey" FOREIGN KEY ("uploader") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_author_fkey" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

