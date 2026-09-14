"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getCatalogCards } from "@/data/catalog";
import {
  conditionFromShopifyVariantTitle,
  findCatalogCardForShopifyProduct,
} from "@/lib/pricing/shopify-match";
import {
  observeJustTcgPrices,
  priceObservationKey,
} from "@/lib/pricing/observations";
import { evaluatePriceChange, previousLargeDecreaseAt } from "@/lib/pricing/policy";
import { updateShopifyVariantPrices } from "@/lib/shopify/admin";
import { getShopifyProductByHandle } from "@/lib/shopify/products";

export type ApprovePricesState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function approveMarketPricesAction(
  _previousState: ApprovePricesState,
  formData: FormData,
): Promise<ApprovePricesState> {
  await requireAdmin();

  const handle = String(formData.get("handle") ?? "");
  if (!/^[a-z0-9][a-z0-9-]{0,254}$/.test(handle)) {
    return { status: "error", message: "Invalid Shopify product handle." };
  }

  try {
    const [product, cards] = await Promise.all([
      getShopifyProductByHandle(handle),
      getCatalogCards(),
    ]);
    if (!product) {
      return { status: "error", message: "The Shopify product was not found." };
    }

    const card = findCatalogCardForShopifyProduct(product, cards);
    if (!card || card.priceSource !== "justtcg") {
      return {
        status: "error",
        message: "A verified live JustTCG match is required before updating Shopify.",
      };
    }

    const checkedAt = new Date();
    const priceHistory = await observeJustTcgPrices([card], checkedAt);
    const updates = product.variants.flatMap((variant) => {
      const condition = conditionFromShopifyVariantTitle(variant.title);
      if (!condition || !card.livePriceConditions.includes(condition)) return [];
      const target = condition
        ? card.conditionPrices.find((row) => row.condition === condition)?.priceCents
        : null;
      const current = Math.round(Number(variant.price.amount) * 100);
      if (target == null) return [];
      const previousObservation = priceHistory.previousByCardCondition.get(
        priceObservationKey(card.slug, condition),
      );
      const evaluation = evaluatePriceChange({
        currentPriceCents: current,
        targetPriceCents: variant.price.currencyCode === "USD" ? target : null,
        marketFetchedAt: checkedAt,
        now: checkedAt,
        previousLargeDecreaseAt: previousLargeDecreaseAt(
          current,
          previousObservation,
          checkedAt,
        ),
      });
      if (
        evaluation.decision !== "auto-update" &&
        evaluation.decision !== "approval-required"
      ) {
        return [];
      }
      return [{ id: variant.id, priceCents: target }];
    });

    if (!updates.length) {
      return { status: "success", message: "Shopify prices are already current." };
    }

    const result = await updateShopifyVariantPrices(product.id, updates);
    revalidatePath("/admin/pricing");
    revalidatePath("/shop");
    revalidatePath(`/shop/products/${handle}`);
    return {
      status: "success",
      message: `${result.updatedCount} Shopify variant prices updated from JustTCG.`,
    };
  } catch (error) {
    console.error("Approved Shopify price update failed", error);
    return {
      status: "error",
      message: "Shopify could not update these prices. No update was confirmed.",
    };
  }
}
