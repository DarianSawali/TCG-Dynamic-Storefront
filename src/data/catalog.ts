import { cache } from "react";
import { StockStatus } from "@prisma/client";
import {
  buildConditionPrices,
  nmPrice,
  type CardCondition,
} from "@/lib/conditions";
import { mockCards, type CatalogCardWithPricing, type StockLabel } from "@/lib/catalog";
import { db } from "@/lib/db";
import { mergeJustTcgPrices } from "@/lib/justtcg/merge-catalog-prices";
import {
  filterVisibleCards,
  getVisibleStoreSetCodes,
  isLocaleVisible,
} from "@/lib/sets";
import { enrichTcgdexImages } from "@/lib/tcgdex/enrich-images";

export type { CatalogCardWithPricing };

export type CatalogFilters = {
  setCode?: string;
  locale?: "en" | "ja";
};

function applyFilters(
  cards: CatalogCardWithPricing[],
  filters?: CatalogFilters,
): CatalogCardWithPricing[] {
  const result = filterVisibleCards(cards);
  if (!filters?.setCode && !filters?.locale) return result;
  return result.filter((card) => {
    if (filters.setCode && card.setCode !== filters.setCode) return false;
    if (filters.locale && card.locale !== filters.locale) return false;
    return true;
  });
}

/** Loads the database-backed catalog once per server render. */
const getCatalogSource = cache(
  async () => {
    let source = filterVisibleCards(mockCards);
    let fromDatabase = false;
    try {
      const visibleCodes = getVisibleStoreSetCodes();
      const dbRows = await db.card.findMany({
        where: {
          setCode: { in: visibleCodes },
          ...(isLocaleVisible("ja") ? {} : { locale: "en" }),
        },
        include: {
          listing: {
            include: { conditionPrices: { orderBy: { condition: "asc" } } },
          },
        },
        orderBy: [{ setCode: "asc" }, { locale: "asc" }, { createdAt: "asc" }],
      });
      if (dbRows.length > 0) {
        fromDatabase = true;
        source = dbRows.map((row) => {
          const fallback = mockCards.find((card) => card.slug === row.slug);
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
            setCode: row.setCode,
            locale: row.locale,
            setName: row.setName,
            collectorNumber: row.collectorNumber,
            rarity: row.rarity ?? undefined,
            gradient: row.gradient,
            conditionPrices,
            marketPriceCents: nmPrice(conditionPrices),
            stockLabel: toStockLabel(row.listing?.stockStatus),
            shopListed: row.listing?.shopListed ?? false,
            justtcgCardId: row.justtcgCardId ?? fallback?.justtcgCardId,
            tcgdexCardId: row.tcgdexCardId ?? fallback?.tcgdexCardId,
            tcgdexImageUrl: row.tcgdexImageUrl ?? fallback?.tcgdexImageUrl,
          };
        });
      }
    } catch {
      // Fallback to static mock rows until Prisma migration/seed is ready.
    }

    return { cards: source, fromDatabase };
  },
);

function useSyncedPrices(
  source: Awaited<ReturnType<typeof getCatalogSource>>,
): CatalogCardWithPricing[] {
  return source.cards.map((card) => {
    const hasSyncedNm = Boolean(
      source.fromDatabase && card.justtcgCardId && card.marketPriceCents != null,
    );
    return {
      ...card,
      priceSource: hasSyncedNm ? "justtcg" : "mock",
      livePriceConditions: hasSyncedNm ? ["NM"] : [],
      imageUrl: null,
    };
  });
}

/** Storefront reads the latest sync without spending API quota per visit. */
export const getCatalogCards = cache(
  async (filters?: CatalogFilters): Promise<CatalogCardWithPricing[]> => {
    const priced = useSyncedPrices(await getCatalogSource());
    const withImages = await enrichTcgdexImages(priced);
    return applyFilters(withImages, filters);
  },
);

/** Admin repricing refreshes only products that are actually listed for sale. */
export const getLiveShopCards = cache(async (): Promise<CatalogCardWithPricing[]> => {
  const source = await getCatalogSource();
  const listed = source.cards.filter((card) => card.shopListed);
  const priced = await mergeJustTcgPrices(listed);
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

export async function getShopCards(
  filters?: CatalogFilters,
): Promise<CatalogCardWithPricing[]> {
  const all = await getCatalogCards(filters);
  return all.filter((c) => c.shopListed);
}

export async function getCardBySlug(
  slug: string,
): Promise<CatalogCardWithPricing | undefined> {
  const all = await getCatalogCards();
  return all.find((c) => c.slug === slug);
}
