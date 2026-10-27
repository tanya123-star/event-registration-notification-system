-- CreateEnum
CREATE TYPE "OfficerPosition" AS ENUM ('PRESIDENT');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('ATTENDANCE', 'GENERAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "officerPosition" "OfficerPosition";

-- AlterTable
ALTER TABLE "PendingRoleAssignment" ADD COLUMN     "officerPosition" "OfficerPosition";

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "TaskType" NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_clubId_status_idx" ON "Task"("clubId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Task_eventId_type_idx" ON "Task"("eventId", "type");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- One President per club. Prisma cannot model partial unique indexes, so this
-- is raw SQL and must be kept in sync with the mutations by hand.
CREATE UNIQUE INDEX "User_club_president_key"
    ON "User" ("clubId")
    WHERE "officerPosition" = 'PRESIDENT';

-- A position only makes sense for an officer who belongs to a club. Prisma
-- cannot model CHECK constraints either.
ALTER TABLE "User"
    ADD CONSTRAINT "User_position_requires_officer"
    CHECK ("officerPosition" IS NULL OR ("role" = 'OFFICER' AND "clubId" IS NOT NULL));
