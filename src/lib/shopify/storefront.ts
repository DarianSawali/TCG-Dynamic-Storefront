import "server-only";

const SHOPIFY_API_VERSION = "2026-07";

type GraphqlError = {
  message: string;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

function shopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();

  if (!domain || !privateToken) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_PRIVATE_TOKEN are required.",
    );
  }

  if (!domain.endsWith(".myshopify.com")) {
    throw new Error("SHOPIFY_STORE_DOMAIN must be a *.myshopify.com hostname.");
  }

  return { domain, privateToken };
}

export async function storefrontQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { buyerIp?: string },
): Promise<T> {
  const { domain, privateToken } = shopifyConfig();
  const response = await fetch(
    `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token": privateToken,
        ...(options?.buyerIp
          ? { "Shopify-Storefront-Buyer-IP": options.buyerIp }
          : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify Storefront API returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(
      `Shopify Storefront API error: ${payload.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  if (!payload.data) {
    throw new Error("Shopify Storefront API returned no data.");
  }

  return payload.data;
}
