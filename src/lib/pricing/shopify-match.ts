import type { CatalogCardWithPricing } from "@/lib/catalog";
import type { CardCondition } from "@/lib/conditions";
import type { ShopifyProduct } from "@/lib/shopify/products";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function conditionFromShopifyVariantTitle(
  title: string,
): CardCondition | null {
  const value = title.match(/\b(NM|LP|MP|HP|DMG)\b/i)?.[1]?.toUpperCase();
  return value === "NM" || value === "LP" || value === "MP" ||
    value === "HP" || value === "DMG"
    ? value
    : null;
}

export function findCatalogCardForShopifyProduct(
  product: ShopifyProduct,
  cards: CatalogCardWithPricing[],
): CatalogCardWithPricing | undefined {
  const sku = product.variants.find((variant) => variant.sku)?.sku;
  const parts = sku?.split("-") ?? [];
  const locale = parts.at(-2)?.toLowerCase();
  const collectorNumber = parts.at(-3);
  const candidates = cards.filter(
    (card) => normalize(card.name) === normalize(product.title),
  );

  return candidates.find(
    (card) =>
      (!locale || card.locale === locale) &&
      (!collectorNumber || card.collectorNumber === collectorNumber),
  ) ?? candidates.find((card) => card.locale === "en") ?? candidates[0];
}
