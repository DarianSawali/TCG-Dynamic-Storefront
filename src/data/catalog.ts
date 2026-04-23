import { cache } from "react";
import { mockCards, type CatalogCardWithPricing } from "@/lib/catalog";
import { mergeJustTcgPrices } from "@/lib/justtcg/merge-catalog-prices";
import { enrichTcgdexImages } from "@/lib/tcgdex/enrich-images";

export type { CatalogCardWithPricing };

/** One pass of JustTCG + TCGdex per request (deduped across RSC reads). */
export const getCatalogCards = cache(async (): Promise<CatalogCardWithPricing[]> => {
  const priced = await mergeJustTcgPrices(mockCards);
  return enrichTcgdexImages(priced);
});

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
