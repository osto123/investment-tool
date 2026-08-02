-- AlterTable: add ownerId as nullable first (existing rows have none yet)
ALTER TABLE "Apartment" ADD COLUMN "ownerId" TEXT;

-- Backfill: assign every existing apartment to the earliest-created User.
-- Today there is exactly one User row; ORDER BY is defensive in case that
-- ever isn't true when this migration is replayed against another database.
UPDATE "Apartment"
SET "ownerId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "ownerId" IS NULL;

-- Enforce NOT NULL now that every row is backfilled
ALTER TABLE "Apartment" ALTER COLUMN "ownerId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Apartment_ownerId_idx" ON "Apartment"("ownerId");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
