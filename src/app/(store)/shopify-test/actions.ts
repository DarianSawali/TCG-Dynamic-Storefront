"use server";

import { isIP } from "node:net";
import { headers } from "next/headers";
import { storefrontQuery } from "@/lib/shopify/storefront";

type Money = {
  amount: string;
  currencyCode: string;
};

type CartCreateData = {
  cartCreate: {
    cart: null | {
      checkoutUrl: string;
      totalQuantity: number;
      cost: { subtotalAmount: Money };
      lines: {
        nodes: Array<{
          quantity: number;
          cost: { totalAmount: Money };
          merchandise: { title: string; product: { title: string } };
        }>;
      };
    };
    userErrors: Array<{ message: string }>;
    warnings: Array<{ message: string }>;
  };
};

export type CartTestState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      cart: {
        checkoutUrl: string;
        totalQuantity: number;
        subtotal: Money;
        line: {
          productTitle: string;
          variantTitle: string;
          quantity: number;
          total: Money;
        };
      };
    };

function publicBuyerIp(value: string | null): string | undefined {
  const ip = value?.split(",")[0]?.trim();
  if (!ip || !isIP(ip)) return undefined;
  if (
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return undefined;
  }
  return ip;
}

export async function createTestCart(
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
    const data = await storefrontQuery<CartCreateData>(
      /* GraphQL */ `
        mutation CreateTestCart($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              checkoutUrl
              totalQuantity
              cost {
                subtotalAmount {
                  amount
                  currencyCode
                }
              }
              lines(first: 1) {
                nodes {
                  quantity
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                  merchandise {
                    ... on ProductVariant {
                      title
                      product {
                        title
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              message
            }
            warnings {
              message
            }
          }
        }
      `,
      { input: { lines: [{ merchandiseId, quantity: 1 }] } },
      { buyerIp },
    );

    const errors = data.cartCreate.userErrors.map((error) => error.message);
    if (!data.cartCreate.cart || errors.length) {
      return {
        status: "error",
        message: errors.join("; ") || "Shopify did not create the cart.",
      };
    }

    const cart = data.cartCreate.cart;
    const line = cart.lines.nodes[0];
    if (!line) {
      return { status: "error", message: "Shopify returned an empty cart." };
    }

    return {
      status: "success",
      cart: {
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
        subtotal: cart.cost.subtotalAmount,
        line: {
          productTitle: line.merchandise.product.title,
          variantTitle: line.merchandise.title,
          quantity: line.quantity,
          total: line.cost.totalAmount,
        },
      },
    };
  } catch (error) {
    console.error("Shopify cart creation failed", error);
    return {
      status: "error",
      message: "Could not create a Shopify cart. Please try again.",
    };
  }
}
