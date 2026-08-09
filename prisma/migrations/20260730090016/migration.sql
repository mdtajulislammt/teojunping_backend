/*
  Warnings:

  - You are about to drop the column `service_plan` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "plan_id" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_pi_id" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "service_plan",
ADD COLUMN     "plan_id" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT;

-- DropEnum
DROP TYPE "PlanType";

-- DropEnum
DROP TYPE "ServicePlan";

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "features" JSONB NOT NULL DEFAULT '[]',
    "max_wills" INTEGER DEFAULT 1,
    "max_revisions" INTEGER DEFAULT 1,
    "vault_storage_years" INTEGER DEFAULT 1,
    "has_priority_support" BOOLEAN NOT NULL DEFAULT false,
    "has_lpa_guidance" BOOLEAN NOT NULL DEFAULT false,
    "has_mirror_wills" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
