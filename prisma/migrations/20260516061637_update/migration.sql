-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "availability" BOOLEAN DEFAULT true,
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "points" INTEGER DEFAULT 0,
ADD COLUMN     "two_factor_secret" TEXT;
