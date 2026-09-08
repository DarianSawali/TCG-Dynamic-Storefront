"use server";

import { revalidatePath } from "next/cache";
import { clearCartId } from "@/lib/shopify/cart-cookie";
import {
  removeShopifyCartLine,
  updateShopifyCartLine,
  type ShopifyCartMutationResult,
} from "@/lib/shopify/cart";

export type CartActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function validLineId(value: string): boolean {
  return value.startsWith("gid://shopify/CartLine/") && value.length <= 1000;
}

function resultState(result: ShopifyCartMutationResult): CartActionState {
  if (!result.cart || result.errors.length) {
    return {
      status: "error",
      message: result.errors.join("; ") || "Shopify could not update the cart.",
    };
  }
  return {
    status: "success",
    message: result.warnings.join("; ") || "Cart updated.",
  };
}

export async function updateCartLineAction(
  _previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!validLineId(lineId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return { status: "error", message: "Invalid cart update." };
  }

  try {
    const result = await updateShopifyCartLine(lineId, quantity);
    if (!result.cart) await clearCartId();
    revalidatePath("/shopify-cart", "layout");
    return resultState(result);
  } catch (error) {
    console.error("Shopify cart quantity update failed", error);
    return { status: "error", message: "Could not update the quantity." };
  }
}

export async function removeCartLineAction(
  _previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const lineId = String(formData.get("lineId") ?? "");
  if (!validLineId(lineId)) {
    return { status: "error", message: "Invalid cart line." };
  }

  try {
    const result = await removeShopifyCartLine(lineId);
    if (!result.cart || result.cart.lines.length === 0) await clearCartId();
    revalidatePath("/shopify-cart", "layout");
    return resultState(result);
  } catch (error) {
    console.error("Shopify cart line removal failed", error);
    return { status: "error", message: "Could not remove the item." };
  }
}

export async function clearCartAction(
  previousState: CartActionState,
): Promise<CartActionState> {
  void previousState;
  await clearCartId();
  revalidatePath("/shopify-cart", "layout");
  return { status: "success", message: "Cart cleared." };
}
