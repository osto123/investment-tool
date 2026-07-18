-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('RENTAL_INCOME', 'OTHER_INCOME', 'MAINTENANCE_FEE', 'REPAIR_COST', 'MILEAGE', 'INSURANCE', 'OTHER_EXPENSE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "housingCompanyName" TEXT NOT NULL,
    "sizeSqm" DECIMAL(6,2) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "maintenanceFeeHoito" DECIMAL(10,2),
    "maintenanceFeePaaoma" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenancy" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantContact" TEXT,
    "monthlyRent" DECIMAL(10,2) NOT NULL,
    "deposit" DECIMAL(10,2),
    "leaseStart" TIMESTAMP(3) NOT NULL,
    "leaseEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "receiptFileName" TEXT,
    "receiptStoragePath" TEXT,
    "receiptMimeType" TEXT,
    "receiptSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Tenancy_apartmentId_idx" ON "Tenancy"("apartmentId");

-- CreateIndex
CREATE INDEX "Transaction_apartmentId_date_idx" ON "Transaction"("apartmentId", "date");

-- CreateIndex
CREATE INDEX "Transaction_apartmentId_category_idx" ON "Transaction"("apartmentId", "category");

-- AddForeignKey
ALTER TABLE "Tenancy" ADD CONSTRAINT "Tenancy_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
