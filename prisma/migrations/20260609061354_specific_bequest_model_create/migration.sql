-- CreateEnum
CREATE TYPE "item_category" AS ENUM ('REAL_ESTATE', 'VEHICLE', 'JEWELLERY', 'MONEY', 'ART', 'OTHER');

-- CreateTable
CREATE TABLE "specific_bequests" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "item_category" "item_category",
    "estimated_value" DECIMAL(12,2),
    "item_name" VARCHAR(255) NOT NULL,
    "full_description" TEXT NOT NULL,
    "location_storage" VARCHAR(255),
    "serial_reference" VARCHAR(100),
    "beneficiary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "willId" TEXT,

    CONSTRAINT "specific_bequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SpecificBequestAttachments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SpecificBequestAttachments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "specific_bequests_agent_id_idx" ON "specific_bequests"("agent_id");

-- CreateIndex
CREATE INDEX "specific_bequests_client_id_idx" ON "specific_bequests"("client_id");

-- CreateIndex
CREATE INDEX "specific_bequests_beneficiary_id_idx" ON "specific_bequests"("beneficiary_id");

-- CreateIndex
CREATE INDEX "_SpecificBequestAttachments_B_index" ON "_SpecificBequestAttachments"("B");

-- AddForeignKey
ALTER TABLE "specific_bequests" ADD CONSTRAINT "specific_bequests_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specific_bequests" ADD CONSTRAINT "specific_bequests_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecificBequestAttachments" ADD CONSTRAINT "_SpecificBequestAttachments_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecificBequestAttachments" ADD CONSTRAINT "_SpecificBequestAttachments_B_fkey" FOREIGN KEY ("B") REFERENCES "specific_bequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
