-- One President for the whole organization, replacing the per-club rule.
DROP INDEX IF EXISTS "User_club_president_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_position_requires_officer";

CREATE UNIQUE INDEX "User_officer_position_president_key"
    ON "User" ("officerPosition")
    WHERE "officerPosition" = 'PRESIDENT';

ALTER TABLE "User"
    ADD CONSTRAINT "User_position_requires_officer"
    CHECK ("officerPosition" IS NULL OR "role" = 'OFFICER');

-- Tasks are organization-wide now. The legacy club column has no rows.
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_clubId_fkey";
DROP INDEX IF EXISTS "Task_clubId_status_idx";
ALTER TABLE "Task" DROP COLUMN IF EXISTS "clubId";
CREATE INDEX IF NOT EXISTS "Task_assignedById_idx" ON "Task"("assignedById");
