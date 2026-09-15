import "server-only";

import type { ShopifyListingDraft } from "@/lib/shopify/listing-draft";

const SHOPIFY_ADMIN_API_VERSION = "2026-07";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

type AdminGraphqlError = { message: string };
type AdminGraphqlResponse<T> = {
  data?: T;
  errors?: AdminGraphqlError[];
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
};

type CachedToken = {
  value: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function adminConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim();

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Shopify Admin API credentials are not configured.");
  }
  if (!domain.endsWith(".myshopify.com")) {
    throw new Error("SHOPIFY_STORE_DOMAIN must be a *.myshopify.com hostname.");
  }

  return { domain, clientId, clientSecret };
}

async function getAdminAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken.value;
  }

  const { domain, clientId, clientSecret } = adminConfig();
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shopify Admin token request returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as TokenResponse;
  if (!payload.access_token || !payload.expires_in) {
    throw new Error("Shopify Admin token response was incomplete.");
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function adminQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { domain } = adminConfig();
  const response = await fetch(
    `https://${domain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getAdminAccessToken(),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify Admin API returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as AdminGraphqlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(
      `Shopify Admin API error: ${payload.errors.map((error) => error.message).join("; ")}`,
    );
  }
  if (!payload.data) throw new Error("Shopify Admin API returned no data.");
  return payload.data;
}

export type ShopifyAdminStatus = {
  storeName: string;
  domain: string;
  currencyCode: string;
  scopes: string[];
  canWriteProducts: boolean;
};

export type ShopifyAdminProductStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DRAFT"
  | "UNLISTED";

export type ShopifyAdminProduct = {
  id: string;
  title: string;
  handle: string;
  status: ShopifyAdminProductStatus;
  totalInventory: number;
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  variants: Array<{
    id: string;
    title: string;
    sku: string | null;
    inventoryQuantity: number | null;
    price: string;
  }>;
};

type AdminProductsPage = {
  products: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      status: ShopifyAdminProductStatus;
      totalInventory: number;
      featuredMedia: {
        preview: {
          image: ShopifyAdminProduct["featuredImage"];
        } | null;
      } | null;
      variants: { nodes: ShopifyAdminProduct["variants"] };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

/** Read-only inventory used by the protected listing manager. */
export async function getShopifyAdminProducts(): Promise<ShopifyAdminProduct[]> {
  const products: ShopifyAdminProduct[] = [];
  let after: string | null = null;

  do {
    const data: AdminProductsPage = await adminQuery<AdminProductsPage>(/* GraphQL */ `
      query AdminProducts($after: String) {
        products(first: 100, after: $after, sortKey: TITLE) {
          nodes {
            id
            title
            handle
            status
            totalInventory
            featuredMedia {
              preview {
                image { url altText width height }
              }
            }
            variants(first: 100) {
              nodes { id title sku inventoryQuantity price }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `, { after });

    products.push(
      ...data.products.nodes.map((product) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        status: product.status,
        totalInventory: product.totalInventory,
        featuredImage: product.featuredMedia?.preview?.image ?? null,
        variants: product.variants.nodes,
      })),
    );
    after = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (after);

  return products;
}

export type CreatedShopifyDraft = {
  id: string;
  handle: string;
  status: ShopifyAdminProductStatus;
  variants: Array<{ id: string; title: string; sku: string | null }>;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Creates or idempotently replaces one unpublished draft identified by handle. */
export async function createShopifyDraftProduct(
  draft: ShopifyListingDraft,
): Promise<CreatedShopifyDraft> {
  if (draft.status !== "DRAFT" || draft.publishToHeadless) {
    throw new Error("Only unpublished draft products can be created here.");
  }
  if (!/^[a-z0-9][a-z0-9-]{0,254}$/.test(draft.handle)) {
    throw new Error("Invalid Shopify product handle.");
  }
  if (
    draft.variants.length !== 5 ||
    draft.variants.some(
      (variant) =>
        variant.price == null ||
        !/^\d+(\.\d{2})$/.test(variant.price) ||
        !/^PKM-[A-Z0-9]+-[A-Z0-9.]+-(EN|JA)-(NM|LP|MP|HP|DMG)$/.test(
          variant.sku,
        ),
    )
  ) {
    throw new Error("The listing draft has invalid variants, prices, or SKUs.");
  }

  const data = await adminQuery<{
    productSet: {
      product:
        | (Omit<CreatedShopifyDraft, "variants"> & {
            variants: { nodes: CreatedShopifyDraft["variants"] };
          })
        | null;
      userErrors: Array<{
        code: string | null;
        field: string[] | null;
        message: string;
      }>;
    };
  }>(/* GraphQL */ `
    mutation CreateUnpublishedCardDraft(
      $identifier: ProductSetIdentifiers!
      $input: ProductSetInput!
    ) {
      productSet(identifier: $identifier, input: $input, synchronous: true) {
        product {
          id
          handle
          status
          variants(first: 100) {
            nodes { id title sku }
          }
        }
        userErrors { code field message }
      }
    }
  `, {
    identifier: { handle: draft.handle },
    input: {
      title: draft.title,
      handle: draft.handle,
      descriptionHtml: `<p>${escapeHtml(draft.description)}</p>`,
      status: "DRAFT",
      productType: "Single Trading Card",
      vendor: "PokeCell TCG",
      tags: ["pokemon-tcg", "single-card"],
      productOptions: [
        {
          name: draft.optionName,
          position: 1,
          values: draft.variants.map((variant) => ({ name: variant.title })),
        },
      ],
      files: draft.imageUrl
        ? [
            {
              originalSource: draft.imageUrl,
              alt: draft.title,
              contentType: "IMAGE",
            },
          ]
        : [],
      variants: draft.variants.map((variant, index) => ({
        optionValues: [
          { optionName: draft.optionName, name: variant.title },
        ],
        position: index + 1,
        price: variant.price,
        sku: variant.sku,
        inventoryItem: {
          sku: variant.sku,
          tracked: draft.trackQuantity,
          requiresShipping: draft.requiresShipping,
        },
        inventoryPolicy: draft.continueSellingWhenOutOfStock
          ? "CONTINUE"
          : "DENY",
        published: false,
        taxable: true,
      })),
    },
  });

  const result = data.productSet;
  if (result.userErrors.length) {
    throw new Error(
      `Shopify rejected the product draft: ${result.userErrors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  if (!result.product) {
    throw new Error("Shopify did not return the created product draft.");
  }
  const product: CreatedShopifyDraft = {
    ...result.product,
    variants: result.product.variants.nodes,
  };
  if (
    product.status !== "DRAFT" ||
    product.variants.length !== draft.variants.length
  ) {
    throw new Error("Shopify returned an incomplete or non-draft product.");
  }

  return product;
}

export async function getShopifyAdminStatus(): Promise<ShopifyAdminStatus> {
  const data = await adminQuery<{
    shop: { name: string; myshopifyDomain: string; currencyCode: string };
    currentAppInstallation: { accessScopes: Array<{ handle: string }> };
  }>(/* GraphQL */ `
    query AdminConnectionStatus {
      shop { name myshopifyDomain currencyCode }
      currentAppInstallation { accessScopes { handle } }
    }
  `);

  const scopes = data.currentAppInstallation.accessScopes.map((scope) => scope.handle);
  return {
    storeName: data.shop.name,
    domain: data.shop.myshopifyDomain,
    currencyCode: data.shop.currencyCode,
    scopes,
    canWriteProducts: scopes.includes("write_products"),
  };
}

export type ShopifyVariantPriceUpdate = {
  id: string;
  priceCents: number;
};

export async function updateShopifyVariantPrices(
  productId: string,
  updates: ShopifyVariantPriceUpdate[],
): Promise<{ updatedCount: number }> {
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(productId)) {
    throw new Error("Invalid Shopify product ID.");
  }
  if (!updates.length || updates.length > 100) {
    throw new Error("A price update must contain between 1 and 100 variants.");
  }
  for (const update of updates) {
    if (
      !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(update.id) ||
      !Number.isInteger(update.priceCents) ||
      update.priceCents <= 0
    ) {
      throw new Error("Invalid Shopify variant price update.");
    }
  }

  const data = await adminQuery<{
    productVariantsBulkUpdate: {
      productVariants: Array<{ id: string; price: string }>;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>(/* GraphQL */ `
    mutation UpdateMarketPrices(
      $productId: ID!
      $variants: [ProductVariantsBulkInput!]!
    ) {
      productVariantsBulkUpdate(
        productId: $productId
        variants: $variants
        allowPartialUpdates: false
      ) {
        productVariants { id price }
        userErrors { field message }
      }
    }
  `, {
    productId,
    variants: updates.map((update) => ({
      id: update.id,
      price: (update.priceCents / 100).toFixed(2),
    })),
  });

  const payload = data.productVariantsBulkUpdate;
  if (payload.userErrors.length) {
    throw new Error(
      `Shopify rejected the price update: ${payload.userErrors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  if (payload.productVariants.length !== updates.length) {
    throw new Error("Shopify returned an incomplete bulk price update.");
  }

  return { updatedCount: payload.productVariants.length };
}
