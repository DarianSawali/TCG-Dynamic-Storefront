-- CreateEnum
CREATE TYPE "CardLocale" AS ENUM ('en', 'ja');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN "setCode" TEXT NOT NULL DEFAULT 'sv03.5';
ALTER TABLE "Card" ADD COLUMN "locale" "CardLocale" NOT NULL DEFAULT 'en';
ALTER TABLE "Card" ALTER COLUMN "setCode" DROP DEFAULT;
ALTER TABLE "Card" ALTER COLUMN "locale" DROP DEFAULT;

CREATE INDEX "Card_setCode_locale_idx" ON "Card"("setCode", "locale");
