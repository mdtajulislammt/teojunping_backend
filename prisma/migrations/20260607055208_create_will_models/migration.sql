-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('SPOUSE_PARTNER', 'CHILD', 'SIBLING', 'PARENT', 'FRIEND', 'OTHER');

-- CreateEnum
CREATE TYPE "marital_status" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'CIVIL_PARTNERSHIP', 'SEPARATED');

-- CreateEnum
CREATE TYPE "beneficiary_type" AS ENUM ('PRIMARY', 'RESIDUARY');

-- CreateEnum
CREATE TYPE "will_status" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'COMPLETED', 'REVOKED');

-- CreateTable
CREATE TABLE "wills" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" "will_status" NOT NULL DEFAULT 'DRAFT',
    "testator_full_name" VARCHAR(255) NOT NULL,
    "testator_dob" DATE NOT NULL,
    "national_insurance_no" VARCHAR(50),
    "marital_status" "marital_status" NOT NULL,
    "current_address" TEXT NOT NULL,
    "nationality" VARCHAR(100) NOT NULL,
    "occupation" VARCHAR(150),
    "previously_made_will" BOOLEAN NOT NULL DEFAULT false,
    "has_immediate_dependants" BOOLEAN NOT NULL DEFAULT false,
    "has_children" BOOLEAN NOT NULL DEFAULT false,
    "has_exclusions" BOOLEAN NOT NULL DEFAULT false,
    "agent_confirm_sound_mind" BOOLEAN NOT NULL DEFAULT false,
    "agent_confirm_verified" BOOLEAN NOT NULL DEFAULT false,
    "power_to_sell_property" BOOLEAN NOT NULL DEFAULT false,
    "testator_info_correct" BOOLEAN NOT NULL DEFAULT false,
    "shares_total_allocated" BOOLEAN NOT NULL DEFAULT false,
    "executors_correct" BOOLEAN NOT NULL DEFAULT false,
    "exclusions_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "children_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "sections_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependants" (
    "id" TEXT NOT NULL,
    "will_id" TEXT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dependants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "will_id" TEXT NOT NULL,
    "type" "beneficiary_type" NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "dob" DATE,
    "share_percentage" DECIMAL(5,2) NOT NULL,
    "contact_address" TEXT,
    "is_minor" BOOLEAN NOT NULL DEFAULT false,
    "specific_bequest" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executors" (
    "id" TEXT NOT NULL,
    "will_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "first_name" VARCHAR(100) NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exclusions" (
    "id" TEXT NOT NULL,
    "will_id" TEXT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exclusions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wills_agent_id_idx" ON "wills"("agent_id");

-- CreateIndex
CREATE INDEX "wills_client_id_idx" ON "wills"("client_id");

-- CreateIndex
CREATE INDEX "wills_status_idx" ON "wills"("status");

-- CreateIndex
CREATE INDEX "dependants_will_id_idx" ON "dependants"("will_id");

-- CreateIndex
CREATE INDEX "beneficiaries_will_id_idx" ON "beneficiaries"("will_id");

-- CreateIndex
CREATE INDEX "executors_will_id_idx" ON "executors"("will_id");

-- CreateIndex
CREATE INDEX "exclusions_will_id_idx" ON "exclusions"("will_id");

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependants" ADD CONSTRAINT "dependants_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executors" ADD CONSTRAINT "executors_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusions" ADD CONSTRAINT "exclusions_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
