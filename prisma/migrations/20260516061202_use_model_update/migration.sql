/*
  Warnings:

  - You are about to drop the column `about_me` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `approved_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `billing_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `two_factor_secret` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `users` table. All the data in the column will be lost.
  - Made the column `type` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ServicePlan" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'AGENT';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "about_me",
DROP COLUMN "approved_at",
DROP COLUMN "availability",
DROP COLUMN "billing_id",
DROP COLUMN "bio",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "email_verified_at",
DROP COLUMN "language",
DROP COLUMN "location",
DROP COLUMN "name",
DROP COLUMN "points",
DROP COLUMN "state",
DROP COLUMN "two_factor_secret",
DROP COLUMN "zip_code",
ADD COLUMN     "assigned_agent_id" TEXT,
ADD COLUMN     "attachment_id" TEXT,
ADD COLUMN     "certification_body" TEXT,
ADD COLUMN     "certification_number" TEXT,
ADD COLUMN     "max_clients_per_month" INTEGER DEFAULT 20,
ADD COLUMN     "preferred_working_hours" TEXT,
ADD COLUMN     "professional_bio" TEXT,
ADD COLUMN     "service_plan" "ServicePlan" DEFAULT 'BASIC',
ADD COLUMN     "specialisation" TEXT,
ADD COLUMN     "stripe_balance" JSONB,
ADD COLUMN     "stripe_payout_enabled" BOOLEAN DEFAULT false,
ADD COLUMN     "years_of_experience" TEXT,
ALTER COLUMN "type" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
