-- AlterTable
ALTER TABLE "beneficiaries" ADD COLUMN     "agent_id" TEXT;

-- AlterTable
ALTER TABLE "dependants" ADD COLUMN     "agent_id" TEXT;

-- AlterTable
ALTER TABLE "exclusions" ADD COLUMN     "agent_id" TEXT;

-- AlterTable
ALTER TABLE "executors" ADD COLUMN     "agent_id" TEXT;

-- CreateIndex
CREATE INDEX "beneficiaries_agent_id_idx" ON "beneficiaries"("agent_id");

-- CreateIndex
CREATE INDEX "dependants_agent_id_idx" ON "dependants"("agent_id");

-- CreateIndex
CREATE INDEX "exclusions_agent_id_idx" ON "exclusions"("agent_id");

-- CreateIndex
CREATE INDEX "executors_agent_id_idx" ON "executors"("agent_id");

-- AddForeignKey
ALTER TABLE "dependants" ADD CONSTRAINT "dependants_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executors" ADD CONSTRAINT "executors_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusions" ADD CONSTRAINT "exclusions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
