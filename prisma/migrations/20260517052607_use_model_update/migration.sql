/*
  Warnings:

  - You are about to drop the column `attachment_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_attachment_id_fkey";

-- AlterTable
ALTER TABLE "attachments" ALTER COLUMN "request_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "attachment_id";

-- CreateTable
CREATE TABLE "_certificate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_certificate_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_certificate_B_index" ON "_certificate"("B");

-- AddForeignKey
ALTER TABLE "_certificate" ADD CONSTRAINT "_certificate_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_certificate" ADD CONSTRAINT "_certificate_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
