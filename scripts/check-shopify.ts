import "dotenv/config";

type ShopQuery = {
  shop: {
    name: string;
    primaryDomain: {
      host: string;
    };
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
    query CheckShopifyConnection {
      shop {
        name
        primaryDomain {
          host
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
    data?: ShopQuery;
    errors?: { message: string }[];
  };
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }
  if (!payload.data) throw new Error("Shopify returned no data.");
  const data = payload.data;

  console.log(`Connected to Shopify store: ${data.shop.name}`);
  console.log(`Primary domain: ${data.shop.primaryDomain.host}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
