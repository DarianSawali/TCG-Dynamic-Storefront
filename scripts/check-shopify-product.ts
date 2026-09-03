import "dotenv/config";

type ProductQuery = {
  products: {
    nodes: Array<{
      title: string;
      handle: string;
      availableForSale: boolean;
      variants: {
        nodes: Array<{
          title: string;
          sku: string | null;
          availableForSale: boolean;
          quantityAvailable: number | null;
          price: {
            amount: string;
            currencyCode: string;
          };
        }>;
      };
    }>;
  };
};

async function main() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();
  if (!domain || !privateToken) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_PRIVATE_TOKEN are required.",
    );
  }

  const query = /* GraphQL */ `
    query CheckTestProduct {
      products(first: 10, query: "title:Charizard ex") {
        nodes {
          title
          handle
          availableForSale
          variants(first: 10) {
            nodes {
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
    }
  `;

  const response = await fetch(
    `https://${domain}/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token": privateToken,
      },
      body: JSON.stringify({ query }),
    },
  );
  if (!response.ok) {
    throw new Error(`Shopify Storefront API returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: ProductQuery;
    errors?: { message: string }[];
  };
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  const product = payload.data?.products.nodes[0];
  if (!product) {
    throw new Error(
      "Charizard ex was not returned. Confirm it is Active and published to Headless.",
    );
  }

  console.log(`Product: ${product.title} (${product.handle})`);
  console.log(`Available for sale: ${product.availableForSale}`);
  for (const variant of product.variants.nodes) {
    console.log(
      `- ${variant.title}: ${variant.price.amount} ${variant.price.currencyCode}, ` +
        `qty ${variant.quantityAvailable ?? "hidden"}, ` +
        `available ${variant.availableForSale}, SKU ${variant.sku ?? "missing"}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
