import "dotenv/config";

const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim();
const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim();

if (!domain || !clientId || !clientSecret) {
  console.error("Shopify Admin API credentials are not configured.");
  process.exit(1);
}

async function main() {
  const tokenResponse = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });
  if (!tokenResponse.ok) {
    throw new Error(`Token request returned HTTP ${tokenResponse.status}.`);
  }

  const token = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!token.access_token) throw new Error("Token response did not include an access token.");

  const apiResponse = await fetch(
    `https://${domain}/admin/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token.access_token,
      },
      body: JSON.stringify({
        query: `query ConnectionCheck {
          shop { name myshopifyDomain currencyCode }
          currentAppInstallation { accessScopes { handle } }
          products(first: 3) {
            nodes {
              id
              title
              handle
              variants(first: 10) { nodes { id title sku price } }
            }
          }
        }`,
      }),
    },
  );
  if (!apiResponse.ok) {
    throw new Error(`Admin API returned HTTP ${apiResponse.status}.`);
  }

  const payload = (await apiResponse.json()) as {
    data?: {
      shop: { name: string; myshopifyDomain: string; currencyCode: string };
      currentAppInstallation: { accessScopes: Array<{ handle: string }> };
      products: {
        nodes: Array<{
          id: string;
          title: string;
          handle: string;
          variants: {
            nodes: Array<{ id: string; title: string; sku: string | null; price: string }>;
          };
        }>;
      };
    };
    errors?: Array<{ message: string }>;
  };
  if (payload.errors?.length || !payload.data) {
    throw new Error(payload.errors?.map((error) => error.message).join("; ") || "No Admin API data.");
  }

  console.log(JSON.stringify({
    connected: true,
    store: payload.data.shop,
    scopes: payload.data.currentAppInstallation.accessScopes.map((scope) => scope.handle),
    tokenLifetimeSeconds: token.expires_in,
    products: payload.data.products.nodes,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
