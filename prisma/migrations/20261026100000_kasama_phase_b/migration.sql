-- Phase B: event lifecycle, mechanics, and approval trail.
-- Idempotent because the local database already carries a diverged registration
-- migration with an `Event.capacity` column.
DO $$ BEGIN
    CREATE TYPE "EventStatus" AS ENUM (
        'DRAFT',
        'SUBMITTED',
        'REVISION_REQUESTED',
        'APPROVED',
        'PUBLISHED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventApprovalAction" AS ENUM (
        'SUBMITTED',
        'APPROVED',
        'REVISION_REQUESTED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Event"
    ADD COLUMN IF NOT EXISTS "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS "mechanics" TEXT,
    ADD COLUMN IF NOT EXISTS "programFlow" TEXT,
    ADD COLUMN IF NOT EXISTS "requirements" TEXT,
    ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "capacity" INTEGER,
    ADD COLUMN IF NOT EXISTS "registrationClosesAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "EventApproval" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "EventApprovalAction" NOT NULL,
    "fromStatus" "EventStatus" NOT NULL,
    "toStatus" "EventStatus" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventApproval_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Event_status_startAt_id_idx" ON "Event"("status", "startAt", "id");
CREATE INDEX IF NOT EXISTS "EventApproval_eventId_createdAt_idx"
    ON "EventApproval"("eventId", "createdAt");

DO $$ BEGIN
    ALTER TABLE "EventApproval"
        ADD CONSTRAINT "EventApproval_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "EventApproval"
        ADD CONSTRAINT "EventApproval_actorId_fkey"
        FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Legacy events predate the workflow: publish them with no approval record.
UPDATE "Event"
SET "status" = 'PUBLISHED',
    "publishedAt" = COALESCE("createdAt", "startAt")
WHERE "status" = 'DRAFT';
