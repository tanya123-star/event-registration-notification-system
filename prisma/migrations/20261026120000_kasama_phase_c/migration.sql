-- Phase C: student registration references.
-- Idempotent because the local database history is diverged.
DO $$ BEGIN
    CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studentNumber" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_studentNumber_key" ON "User"("studentNumber");

CREATE TABLE IF NOT EXISTS "Registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Registration_reference_key" ON "Registration"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_eventId_studentId_key"
    ON "Registration"("eventId", "studentId");
CREATE INDEX IF NOT EXISTS "Registration_studentId_status_idx"
    ON "Registration"("studentId", "status");

DO $$ BEGIN
    ALTER TABLE "Registration"
        ADD CONSTRAINT "Registration_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Registration"
        ADD CONSTRAINT "Registration_studentId_fkey"
        FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
