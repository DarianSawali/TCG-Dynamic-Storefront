import { cache } from "react";
import { StockStatus } from "@prisma/client";
import {
  buildConditionPrices,
  nmPrice,
  type CardCondition,
  type ConditionPrice,
} from "@/lib/conditions";
import { mockCards, type CatalogCardWithPricing, type StockLabel } from "@/lib/catalog";
import { db } from "@/lib/db";
import { mergeJustTcgPrices } from "@/lib/justtcg/merge-catalog-prices";
import { enrichTcgdexImages } from "@/lib/tcgdex/enrich-images";

export type { CatalogCardWithPricing };

/** One pass of JustTCG + TCGdex per request (deduped across RSC reads). */
export const getCatalogCards = cache(async (): Promise<CatalogCardWithPricing[]> => {
  let source = mockCards;
  try {
    const dbRows = await db.card.findMany({
      include: {
        listing: {
          include: { conditionPrices: { orderBy: { condition: "asc" } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    if (dbRows.length > 0) {
      source = dbRows.map((row) => {
        const nmCents = row.listing?.marketPriceCents ?? null;
        const overrides = row.listing?.conditionPrices.length
          ? Object.fromEntries(
              row.listing.conditionPrices.map((cp) => [
                cp.condition as CardCondition,
                cp.priceCents,
              ]),
            )
          : undefined;

        const conditionPrices = buildConditionPrices(nmCents, overrides);

        return {
          slug: row.slug,
          name: row.name,
          setName: row.setName,
          collectorNumber: row.collectorNumber,
          rarity: row.rarity ?? undefined,
          gradient: row.gradient,
          conditionPrices,
          marketPriceCents: nmPrice(conditionPrices),
          stockLabel: toStockLabel(row.listing?.stockStatus),
          shopListed: row.listing?.shopListed ?? false,
          justtcgCardId: row.justtcgCardId ?? undefined,
          tcgdexCardId: row.tcgdexCardId ?? undefined,
        };
      });
    }
  } catch {
    // Fallback to static mock rows until Prisma migration/seed is ready.
  }

  const priced = await mergeJustTcgPrices(source);
  return enrichTcgdexImages(priced);
});

function toStockLabel(stockStatus: StockStatus | undefined): StockLabel {
  switch (stockStatus) {
    case StockStatus.LOW_STOCK:
      return "Low Stock";
    case StockStatus.OUT_OF_STOCK:
      return "Out of Stock";
    case StockStatus.IN_STOCK:
    default:
      return "In Stock";
  }
}

export async function getShopCards(): Promise<CatalogCardWithPricing[]> {
  const all = await getCatalogCards();
  return all.filter((c) => c.shopListed);
}

export async function getCardBySlug(
  slug: string,
): Promise<CatalogCardWithPricing | undefined> {
  const all = await getCatalogCards();
  return all.find((c) => c.slug === slug);
}
