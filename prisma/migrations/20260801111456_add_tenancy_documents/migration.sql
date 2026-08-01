-- CreateTable
CREATE TABLE "TenancyDocument" (
    "id" TEXT NOT NULL,
    "tenancyId" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenancyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenancyDocument_tenancyId_idx" ON "TenancyDocument"("tenancyId");

-- AddForeignKey
ALTER TABLE "TenancyDocument" ADD CONSTRAINT "TenancyDocument_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
