-- DropIndex
DROP INDEX "Card_setCode_locale_idx";

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "tcgdexImageUrl" TEXT;
