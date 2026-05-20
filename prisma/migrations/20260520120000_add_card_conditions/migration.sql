-- CreateEnum
CREATE TYPE "CardCondition" AS ENUM ('NM', 'LP', 'MP', 'HP', 'DMG');

-- CreateTable
CREATE TABLE "ListingCondition" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "condition" "CardCondition" NOT NULL,
    "priceCents" INTEGER,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingCondition_listingId_condition_key" ON "ListingCondition"("listingId", "condition");

-- AddForeignKey
ALTER TABLE "ListingCondition" ADD CONSTRAINT "ListingCondition_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (PriceSnapshot.condition: String? -> CardCondition?)
ALTER TABLE "PriceSnapshot" DROP COLUMN "condition",
ADD COLUMN "condition" "CardCondition";
