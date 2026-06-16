-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('PROPERTY', 'FINANCIAL', 'VEHICLES', 'VALUABLES', 'DEBTS');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "asset_type" "asset_type" NOT NULL,
    "property_address" TEXT,
    "ownership_type" TEXT,
    "property_type" VARCHAR(100),
    "estimated_value" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "outstanding_mortgage" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "additional_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_client_id_idx" ON "assets"("client_id");

-- CreateIndex
CREATE INDEX "assets_agent_id_idx" ON "assets"("agent_id");

-- CreateIndex
CREATE INDEX "assets_asset_type_idx" ON "assets"("asset_type");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
