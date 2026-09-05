"use server";

import { isIP } from "node:net";
import { headers } from "next/headers";
import { clearCartId, readCartId, writeCartId } from "@/lib/shopify/cart-cookie";
import { storefrontQuery } from "@/lib/shopify/storefront";

type Money = { amount: string; currencyCode: string };
type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: { nodes: Array<{
    quantity: number;
    cost: { totalAmount: Money };
    merchandise: { title: string; product: { title: string } };
  }> };
};
type CartPayload = {
  cart: ShopifyCart | null;
  userErrors: Array<{ message: string }>;
  warnings: Array<{ message: string }>;
};
type CartCreateData = { cartCreate: CartPayload };
type CartLinesAddData = { cartLinesAdd: CartPayload };

export type CartTestState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; cart: {
      checkoutUrl: string;
      totalQuantity: number;
      subtotal: Money;
      lines: Array<{
        productTitle: string;
        variantTitle: string;
        quantity: number;
        total: Money;
      }>;
    } };

const CART_FIELDS = /* GraphQL */ `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 20) {
    nodes {
      quantity
      cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant { title product { title } }
      }
    }
  }
`;

function publicBuyerIp(value: string | null): string | undefined {
  const ip = value?.split(",")[0]?.trim();
  if (!ip || !isIP(ip)) return undefined;
  if (
    ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.") ||
    ip.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) return undefined;
  return ip;
}

async function createCart(merchandiseId: string, buyerIp?: string) {
  const data = await storefrontQuery<CartCreateData>(
    `mutation CreateCart($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ${CART_FIELDS} }
        userErrors { message }
        warnings { message }
      }
    }`,
    { input: { lines: [{ merchandiseId, quantity: 1 }] } },
    { buyerIp },
  );
  return data.cartCreate;
}

async function addCartLine(cartId: string, merchandiseId: string, buyerIp?: string) {
  const data = await storefrontQuery<CartLinesAddData>(
    `mutation AddCartLine($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { message }
        warnings { message }
      }
    }`,
    { cartId, lines: [{ merchandiseId, quantity: 1 }] },
    { buyerIp },
  );
  return data.cartLinesAdd;
}

function successfulCart(payload: CartPayload): ShopifyCart | null {
  return payload.userErrors.length === 0 ? payload.cart : null;
}

export async function addToTestCart(
  _previousState: CartTestState,
  formData: FormData,
): Promise<CartTestState> {
  const merchandiseId = String(formData.get("merchandiseId") ?? "");
  if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(merchandiseId)) {
    return { status: "error", message: "Invalid Shopify variant." };
  }

  try {
    const requestHeaders = await headers();
    const buyerIp = publicBuyerIp(
      requestHeaders.get("x-vercel-forwarded-for") ??
      requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip"),
    );

    const savedCartId = await readCartId();
    let payload = savedCartId
      ? await addCartLine(savedCartId, merchandiseId, buyerIp)
      : await createCart(merchandiseId, buyerIp);
    let cart = successfulCart(payload);

    // Shopify carts can expire. Discard an unusable saved cart and retry once.
    if (!cart && savedCartId) {
      await clearCartId();
      payload = await createCart(merchandiseId, buyerIp);
      cart = successfulCart(payload);
    }

    if (!cart) {
      const messages = [
        ...payload.userErrors.map((error) => error.message),
        ...payload.warnings.map((warning) => warning.message),
      ];
      return {
        status: "error",
        message: messages.join("; ") || "Shopify did not update the cart.",
      };
    }

    await writeCartId(cart.id);
    return {
      status: "success",
      cart: {
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
        subtotal: cart.cost.subtotalAmount,
        lines: cart.lines.nodes.map((line) => ({
          productTitle: line.merchandise.product.title,
          variantTitle: line.merchandise.title,
          quantity: line.quantity,
          total: line.cost.totalAmount,
        })),
      },
    };
  } catch (error) {
    console.error("Shopify cart update failed", error);
    return {
      status: "error",
      message: "Could not update the Shopify cart. Please try again.",
    };
  }
}
