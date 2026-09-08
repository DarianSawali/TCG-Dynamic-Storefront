import "server-only";

import { cache } from "react";
import { readCartId } from "@/lib/shopify/cart-cookie";
import { getBuyerIp } from "@/lib/shopify/buyer-ip";
import { storefrontQuery } from "@/lib/shopify/storefront";

export type ShopifyCartMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyCartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: ShopifyCartMoney };
  merchandise: {
    id: string;
    title: string;
    sku: string | null;
    availableForSale: boolean;
    price: ShopifyCartMoney;
    product: { title: string; handle: string };
  };
};

export type ShopifyCart = {
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyCartMoney;
    totalAmount: ShopifyCartMoney;
  };
  lines: ShopifyCartLine[];
};

type CartQuery = {
  cart: null | {
    checkoutUrl: string;
    totalQuantity: number;
    cost: {
      subtotalAmount: ShopifyCartMoney;
      totalAmount: ShopifyCartMoney;
    };
    lines: { nodes: ShopifyCartLine[] };
  };
};

export type ShopifyCartMutationResult = {
  cart: ShopifyCart | null;
  errors: string[];
  warnings: string[];
};

type CartMutationPayload = {
  cart: CartQuery["cart"];
  userErrors: Array<{ message: string }>;
  warnings: Array<{ message: string }>;
};

const CART_MUTATION_FIELDS = /* GraphQL */ `
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  lines(first: 100) {
    nodes {
      id
      quantity
      cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id
          title
          sku
          availableForSale
          price { amount currencyCode }
          product { title handle }
        }
      }
    }
  }
`;

function normalizeCart(cart: CartQuery["cart"]): ShopifyCart | null {
  return cart ? { ...cart, lines: cart.lines.nodes } : null;
}

export const getShopifyCart = cache(async (): Promise<ShopifyCart | null> => {
  const cartId = await readCartId();
  if (!cartId) return null;

  const data = await storefrontQuery<CartQuery>(
    /* GraphQL */ `
      query Cart($id: ID!) {
        cart(id: $id) {
          checkoutUrl
          totalQuantity
          cost {
            subtotalAmount { amount currencyCode }
            totalAmount { amount currencyCode }
          }
          lines(first: 100) {
            nodes {
              id
              quantity
              cost { totalAmount { amount currencyCode } }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  sku
                  availableForSale
                  price { amount currencyCode }
                  product { title handle }
                }
              }
            }
          }
        }
      }
    `,
    { id: cartId },
    { buyerIp: await getBuyerIp() },
  );

  return normalizeCart(data.cart);
});

export async function updateShopifyCartLine(
  lineId: string,
  quantity: number,
): Promise<ShopifyCartMutationResult> {
  const cartId = await readCartId();
  if (!cartId) return { cart: null, errors: ["Your cart has expired."], warnings: [] };

  const data = await storefrontQuery<{ cartLinesUpdate: CartMutationPayload }>(
    `mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_MUTATION_FIELDS} }
        userErrors { message }
        warnings { message }
      }
    }`,
    { cartId, lines: [{ id: lineId, quantity }] },
    { buyerIp: await getBuyerIp() },
  );

  return {
    cart: normalizeCart(data.cartLinesUpdate.cart),
    errors: data.cartLinesUpdate.userErrors.map((error) => error.message),
    warnings: data.cartLinesUpdate.warnings.map((warning) => warning.message),
  };
}

export async function removeShopifyCartLine(
  lineId: string,
): Promise<ShopifyCartMutationResult> {
  const cartId = await readCartId();
  if (!cartId) return { cart: null, errors: ["Your cart has expired."], warnings: [] };

  const data = await storefrontQuery<{ cartLinesRemove: CartMutationPayload }>(
    `mutation RemoveCartLine($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${CART_MUTATION_FIELDS} }
        userErrors { message }
        warnings { message }
      }
    }`,
    { cartId, lineIds: [lineId] },
    { buyerIp: await getBuyerIp() },
  );

  return {
    cart: normalizeCart(data.cartLinesRemove.cart),
    errors: data.cartLinesRemove.userErrors.map((error) => error.message),
    warnings: data.cartLinesRemove.warnings.map((warning) => warning.message),
  };
}
