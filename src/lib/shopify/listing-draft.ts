import type { CatalogCardWithPricing } from "@/lib/catalog";

export type ShopifyListingDraft = {
  title: string;
  handle: string;
  description: string;
  status: "DRAFT";
  optionName: "Condition";
  imageUrl: string | null;
  requiresShipping: true;
  trackQuantity: true;
  continueSellingWhenOutOfStock: false;
  publishToHeadless: false;
  variants: Array<{
    condition: string;
    title: string;
    sku: string;
    price: string | null;
    inventoryQuantity: 0;
  }>;
  blockers: string[];
  warnings: string[];
};

function skuSetSegment(card: CatalogCardWithPricing): string {
  if (card.setName === "151") return "151";
  return card.setCode.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function price(cents: number | null): string | null {
  return cents == null ? null : (cents / 100).toFixed(2);
}

/** Deterministic, side-effect-free proposal. It never calls Shopify. */
export function buildShopifyListingDraft(
  card: CatalogCardWithPricing,
): ShopifyListingDraft {
  const variants = card.conditionPrices.map((condition) => ({
    condition: condition.condition,
    title: `${condition.label} (${condition.condition})`,
    sku: [
      "PKM",
      skuSetSegment(card),
      card.collectorNumber.toUpperCase(),
      card.locale.toUpperCase(),
      condition.condition,
    ].join("-"),
    price: price(condition.priceCents),
    inventoryQuantity: 0 as const,
  }));

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (variants.some((variant) => variant.price == null)) {
    blockers.push("Every condition needs a price before the listing can be created.");
  }
  if (!card.imageUrl) {
    warnings.push("No card image is available; Shopify would receive no product media.");
  }
  if (!card.justtcgCardId) {
    warnings.push("No JustTCG card ID is linked, so automatic market pricing cannot run.");
  }
  warnings.push("All variant quantities start at zero and must be stocked before publishing.");

  return {
    title: card.name,
    handle: card.slug,
    description: `${card.name} from Pokémon TCG: ${card.setName}. Card #${card.collectorNumber}.`,
    status: "DRAFT",
    optionName: "Condition",
    imageUrl: card.imageUrl,
    requiresShipping: true,
    trackQuantity: true,
    continueSellingWhenOutOfStock: false,
    publishToHeadless: false,
    variants,
    blockers,
    warnings,
  };
}
