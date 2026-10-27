-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'MANUAL');

-- AlterTable
ALTER TABLE "Attendance"
ADD COLUMN "method" "AttendanceMethod" NOT NULL DEFAULT 'QR',
ADD COLUMN "recordedById" TEXT;

-- CreateIndex
CREATE INDEX "Attendance_eventId_checkedInAt_idx" ON "Attendance"("eventId", "checkedInAt");

-- AddForeignKey
ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
