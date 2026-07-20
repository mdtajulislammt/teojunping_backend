-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "meeting_format" AS ENUM ('INITIAL_CONSULTATION', 'ASSET_DISCUSSION', 'WILL_WRITING', 'SIGN_OFF');

-- CreateEnum
CREATE TYPE "type_format" AS ENUM ('PHONE_CALL', 'ZOOM_VIDEO_CALL');

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "appointment_type" "meeting_format" NOT NULL DEFAULT 'INITIAL_CONSULTATION',
    "meeting_format" "type_format" NOT NULL DEFAULT 'ZOOM_VIDEO_CALL',
    "status" "appointment_status" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "notes" TEXT,
    "zoom_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_client_id_idx" ON "appointments"("client_id");

-- CreateIndex
CREATE INDEX "appointments_agent_id_idx" ON "appointments"("agent_id");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments"("scheduled_at");
