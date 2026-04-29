import "dotenv/config";
import { StockStatus } from "@prisma/client";
import { mockCards } from "../src/lib/catalog";
import { db } from "../src/lib/db";

function mapStockStatus(status: (typeof mockCards)[number]["stockLabel"]): StockStatus {
  switch (status) {
    case "In Stock":
      return StockStatus.IN_STOCK;
    case "Low Stock":
      return StockStatus.LOW_STOCK;
    case "Out of Stock":
      return StockStatus.OUT_OF_STOCK;
  }
}

async function main() {
  for (const item of mockCards) {
    const card = await db.card.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        setName: item.setName,
        collectorNumber: item.collectorNumber,
        rarity: item.rarity ?? null,
        gradient: item.gradient,
        justtcgCardId: item.justtcgCardId ?? null,
        tcgdexCardId: item.tcgdexCardId ?? null,
      },
      create: {
        slug: item.slug,
        name: item.name,
        setName: item.setName,
        collectorNumber: item.collectorNumber,
        rarity: item.rarity ?? null,
        gradient: item.gradient,
        justtcgCardId: item.justtcgCardId ?? null,
        tcgdexCardId: item.tcgdexCardId ?? null,
      },
    });

    await db.listing.upsert({
      where: { cardId: card.id },
      update: {
        shopListed: item.shopListed,
        stockStatus: mapStockStatus(item.stockLabel),
        marketPriceCents: item.marketPriceCents,
      },
      create: {
        cardId: card.id,
        shopListed: item.shopListed,
        stockStatus: mapStockStatus(item.stockLabel),
        marketPriceCents: item.marketPriceCents,
      },
    });
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
