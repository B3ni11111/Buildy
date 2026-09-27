-- Switch to the new drawSQL-based structure (2026-09-28).
-- DESTRUCTIVE: drops the old "User" / "Building" / "Issue" tables. Only local
-- dev data existed (buildings are re-seeded, users are recreated on next login).

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'resident');

-- CreateEnum
CREATE TYPE "relation_type" AS ENUM ('owner', 'tenant');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'transfer', 'bit', 'paybox');

-- CreateEnum
CREATE TYPE "contact_type" AS ENUM ('email', 'whatsapp', 'phone');

-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('general', 'urgent', 'maintenance');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_currentBuildingId_fkey";

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_authorId_fkey";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Building";

-- DropTable
DROP TABLE "Issue";

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
    "password_hash" TEXT NOT NULL,
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
    "user_type" TEXT,
    "onboarded_at" TIMESTAMP(3),
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
    "apartment" SMALLINT,
    "floor" INTEGER,
    "relation_type" "relation_type",
    "sqrm" INTEGER,
    "monthly_payment" INTEGER,
    "payment_method" "payment_method",
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_users_pkey" PRIMARY KEY ("id")
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
    "uploader" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "src" TEXT NOT NULL,

    CONSTRAINT "docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_id" UUID NOT NULL,
    "author" UUID NOT NULL,
    "type" "message_type" NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "messages_building_id_upload_date_idx" ON "messages"("building_id", "upload_date");

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
ALTER TABLE "contact_links" ADD CONSTRAINT "contact_links_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs" ADD CONSTRAINT "docs_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs" ADD CONSTRAINT "docs_uploader_fkey" FOREIGN KEY ("uploader") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_fkey" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

