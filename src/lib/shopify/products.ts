import "server-only";

import { storefrontQuery } from "@/lib/shopify/storefront";

export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyProductVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: ShopifyMoney;
};

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  variants: ShopifyProductVariant[];
};

type ProductByHandleQuery = {
  product: null | {
    id: string;
    title: string;
    handle: string;
    description: string;
    availableForSale: boolean;
    variants: { nodes: ShopifyProductVariant[] };
  };
};

export async function getShopifyProductByHandle(
  handle: string,
): Promise<ShopifyProduct | null> {
  const data = await storefrontQuery<ProductByHandleQuery>(
    /* GraphQL */ `
      query ProductByHandle($handle: String!) {
        product: productByHandle(handle: $handle) {
          id
          title
          handle
          description
          availableForSale
          variants(first: 20) {
            nodes {
              id
              title
              sku
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `,
    { handle },
  );

  if (!data.product) return null;
  return {
    ...data.product,
    variants: data.product.variants.nodes,
  };
}
