"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getCatalogCards } from "@/data/catalog";
import { db } from "@/lib/db";
import { findCatalogCardForShopifyProduct } from "@/lib/pricing/shopify-match";
import {
  createShopifyDraftProduct,
  getShopifyAdminProducts,
  getShopifyAdminStatus,
} from "@/lib/shopify/admin";
import { buildShopifyListingDraft } from "@/lib/shopify/listing-draft";

export type CreateListingState =
  | { status: "idle" }
  | { status: "success"; message: string; handle: string }
  | { status: "error"; message: string };

export async function createListingDraftAction(
  _previousState: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "");
  const confirmed = formData.get("confirm") === "yes";
  if (!/^[a-z0-9][a-z0-9-]{0,254}$/.test(slug) || !confirmed) {
    return {
      status: "error",
      message: "A valid card and explicit confirmation are required.",
    };
  }

  try {
    const [cards, products, adminStatus, databaseCard] = await Promise.all([
      getCatalogCards(),
      getShopifyAdminProducts(),
      getShopifyAdminStatus(),
      db.card.findUnique({
        where: { slug },
        include: { listing: true },
      }),
    ]);
    const card = cards.find((item) => item.slug === slug);
    if (!card || !databaseCard) {
      return { status: "error", message: "The catalog card no longer exists." };
    }
    if (!adminStatus.canWriteProducts) {
      return {
        status: "error",
        message: "The Shopify app no longer has write_products access.",
      };
    }
    if (databaseCard.listing?.shopifyProductId) {
      return {
        status: "error",
        message: "This card is already linked to a Shopify product.",
      };
    }

    const draft = buildShopifyListingDraft(card);
    if (draft.blockers.length > 0) {
      return { status: "error", message: draft.blockers.join(" ") };
    }

    const existingMatch = products.find(
      (product) =>
        findCatalogCardForShopifyProduct(product, cards)?.slug === card.slug,
    );
    const handleCollision = products.find(
      (product) => product.handle === draft.handle,
    );
    if (existingMatch || handleCollision) {
      return {
        status: "error",
        message:
          "Creation stopped because Shopify already has a matching product or handle.",
      };
    }

    const created = await createShopifyDraftProduct(draft);
    const expectedSkus = new Set(draft.variants.map((variant) => variant.sku));
    const returnedSkus = new Set(
      created.variants.flatMap((variant) => (variant.sku ? [variant.sku] : [])),
    );
    if (
      returnedSkus.size !== expectedSkus.size ||
      [...expectedSkus].some((sku) => !returnedSkus.has(sku))
    ) {
      throw new Error("Shopify created a draft with unexpected variant SKUs.");
    }

    const nmVariant = created.variants.find((variant) => variant.sku?.endsWith("-NM"));
    if (!nmVariant) {
      throw new Error("Shopify did not return the required NM variant.");
    }

    try {
      await db.listing.upsert({
        where: { cardId: databaseCard.id },
        update: {
          shopifyProductId: created.id,
          shopifyVariantId: nmVariant.id,
          shopListed: false,
        },
        create: {
          cardId: databaseCard.id,
          marketPriceCents: card.marketPriceCents,
          shopifyProductId: created.id,
          shopifyVariantId: nmVariant.id,
          shopListed: false,
        },
      });
    } catch (error) {
      console.error("Shopify draft was created but database linkage failed", error);
      return {
        status: "error",
        message:
          "Shopify created the draft, but its database link failed. Do not retry; review the Shopify draft and listings dashboard.",
      };
    }

    revalidatePath("/admin/listings");
    revalidatePath("/admin/listings/new");
    return {
      status: "success",
      handle: created.handle,
      message: `${card.name} was created as an unpublished Shopify draft.`,
    };
  } catch (error) {
    console.error("Shopify draft creation failed", error);
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Shopify could not create the product draft.",
    };
  }
}
