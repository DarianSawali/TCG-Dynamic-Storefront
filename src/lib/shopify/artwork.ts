import "server-only";

import { mockCards } from "@/lib/catalog";
import type { CardLocale } from "@/lib/sets";
import type { ShopifyProduct } from "@/lib/shopify/products";
import {
  getTcgdexCardImageUrl,
  tcgdexDisplayImageUrl,
} from "@/lib/tcgdex/enrich-images";

export type ProductArtwork = {
  url: string;
  altText: string;
  source: "shopify" | "tcgdex";
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function skuIdentity(product: ShopifyProduct): {
  locale: CardLocale | null;
  collectorNumber: string | null;
} {
  const sku = product.variants.find((variant) => variant.sku)?.sku;
  if (!sku) return { locale: null, collectorNumber: null };

  // Current SKU format: PKM-{set}-{collector number}-{locale}-{condition}.
  const parts = sku.split("-");
  const localePart = parts.at(-2)?.toLowerCase();
  return {
    locale: localePart === "en" || localePart === "ja" ? localePart : null,
    collectorNumber: parts.at(-3) ?? null,
  };
}

export async function getShopifyProductArtwork(
  product: ShopifyProduct,
): Promise<ProductArtwork | null> {
  if (product.featuredImage) {
    return {
      url: product.featuredImage.url,
      altText: product.featuredImage.altText ?? product.title,
      source: "shopify",
    };
  }

  const identity = skuIdentity(product);
  const candidates = mockCards.filter(
    (card) => normalize(card.name) === normalize(product.title),
  );
  const card =
    candidates.find(
      (candidate) =>
        (!identity.locale || candidate.locale === identity.locale) &&
        (!identity.collectorNumber ||
          candidate.collectorNumber === identity.collectorNumber),
    ) ?? candidates.find((candidate) => candidate.locale === "en") ?? candidates[0];

  if (!card) return null;
  const url = card.tcgdexImageUrl
    ? tcgdexDisplayImageUrl(card.tcgdexImageUrl)
    : card.tcgdexCardId
      ? await getTcgdexCardImageUrl(card.tcgdexCardId, card.locale)
      : null;

  return url
    ? {
        url,
        altText: `${card.name}, ${card.setName} ${card.collectorNumber}`,
        source: "tcgdex",
      }
    : null;
}
