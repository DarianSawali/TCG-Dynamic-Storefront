import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { getCatalogCards, type CatalogCardWithPricing } from "@/data/catalog";
import { findCatalogCardForShopifyProduct } from "@/lib/pricing/shopify-match";
import { getVisibleStoreSets } from "@/lib/sets";
import {
  getShopifyAdminProducts,
  getShopifyAdminStatus,
  type ShopifyAdminProduct,
} from "@/lib/shopify/admin";
import { getShopifyProducts } from "@/lib/shopify/products";

export const metadata: Metadata = {
  title: "Listings",
};

type ListingState = "connected" | "attention" | "catalog-only";

type ListingRow = {
  key: string;
  card: CatalogCardWithPricing | null;
  products: ShopifyAdminProduct[];
  state: ListingState;
  stateLabel: string;
  detail: string;
  headless: boolean;
};

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    set?: string | string[];
    status?: string | string[];
  }>;
};

const stateStyles: Record<ListingState, string> = {
  connected:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  attention:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  "catalog-only":
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function evaluateRow(
  card: CatalogCardWithPricing,
  products: ShopifyAdminProduct[],
  headlessProductIds: Set<string>,
): Omit<ListingRow, "key" | "card" | "products"> {
  if (products.length === 0) {
    return card.shopListed
      ? {
          state: "attention",
          stateLabel: "Missing in Shopify",
          detail: "Catalog marks this card as listed, but no Shopify product matched.",
          headless: false,
        }
      : {
          state: "catalog-only",
          stateLabel: "Catalog only",
          detail: "This card is intentionally not marked for sale.",
          headless: false,
        };
  }

  if (products.length > 1) {
    return {
      state: "attention",
      stateLabel: "Duplicate matches",
      detail: `${products.length} Shopify products match this catalog card.`,
      headless: products.some((product) => headlessProductIds.has(product.id)),
    };
  }

  const product = products[0];
  const headless = headlessProductIds.has(product.id);
  const missingSkus = product.variants.filter((variant) => !variant.sku).length;

  if (!card.shopListed) {
    return {
      state: "attention",
      stateLabel: "Catalog mismatch",
      detail: "A Shopify product exists, but the catalog listing flag is off.",
      headless,
    };
  }
  if (product.status !== "ACTIVE") {
    return {
      state: "attention",
      stateLabel: `Shopify ${product.status.toLowerCase()}`,
      detail: "The matched Shopify product is not active.",
      headless,
    };
  }
  if (!headless) {
    return {
      state: "attention",
      stateLabel: "Not on Headless",
      detail: "The product is not visible through the Storefront API.",
      headless: false,
    };
  }
  if (missingSkus > 0) {
    return {
      state: "attention",
      stateLabel: "Missing SKU",
      detail: `${missingSkus} variant${missingSkus === 1 ? " is" : "s are"} missing a SKU.`,
      headless,
    };
  }

  return {
    state: "connected",
    stateLabel: "Connected",
    detail: "Active, published to Headless, and all variants have SKUs.",
    headless,
  };
}

function buildRows(
  cards: CatalogCardWithPricing[],
  products: ShopifyAdminProduct[],
  headlessProductIds: Set<string>,
): ListingRow[] {
  const matches = new Map<string, ShopifyAdminProduct[]>();
  const matchedProductIds = new Set<string>();

  for (const product of products) {
    const card = findCatalogCardForShopifyProduct(product, cards);
    if (!card) continue;
    matchedProductIds.add(product.id);
    matches.set(card.slug, [...(matches.get(card.slug) ?? []), product]);
  }

  const catalogRows = cards.map((card): ListingRow => {
    const matchedProducts = matches.get(card.slug) ?? [];
    return {
      key: `card:${card.slug}`,
      card,
      products: matchedProducts,
      ...evaluateRow(card, matchedProducts, headlessProductIds),
    };
  });

  const unmatchedRows = products
    .filter((product) => !matchedProductIds.has(product.id))
    .map((product): ListingRow => ({
      key: `product:${product.id}`,
      card: null,
      products: [product],
      state: "attention",
      stateLabel: "Unmatched product",
      detail: "No catalog card matched this Shopify product's title and SKU.",
      headless: headlessProductIds.has(product.id),
    }));

  return [...catalogRows, ...unmatchedRows];
}

function formatPrice(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = one(params.q).trim();
  const setCode = one(params.set);
  const requestedState = one(params.status);
  const stateFilter: ListingState | "all" =
    requestedState === "connected" ||
    requestedState === "attention" ||
    requestedState === "catalog-only"
      ? requestedState
      : "all";

  const [catalogResult, adminProductsResult, headlessResult, adminStatusResult] =
    await Promise.allSettled([
      getCatalogCards(),
      getShopifyAdminProducts(),
      getShopifyProducts(),
      getShopifyAdminStatus(),
    ]);

  const cards = catalogResult.status === "fulfilled" ? catalogResult.value : [];
  const adminProducts =
    adminProductsResult.status === "fulfilled" ? adminProductsResult.value : [];
  const headlessProducts =
    headlessResult.status === "fulfilled" ? headlessResult.value : [];
  const adminStatus =
    adminStatusResult.status === "fulfilled" ? adminStatusResult.value : null;
  const headlessProductIds = new Set(headlessProducts.map((product) => product.id));
  const rows = buildRows(cards, adminProducts, headlessProductIds);

  const normalizedQuery = query.toLowerCase();
  const filteredRows = rows.filter((row) => {
    if (stateFilter !== "all" && row.state !== stateFilter) return false;
    if (setCode && row.card?.setCode !== setCode) return false;
    if (!normalizedQuery) return true;

    const productText = row.products
      .flatMap((product) => [
        product.title,
        product.handle,
        ...product.variants.map((variant) => variant.sku ?? ""),
      ])
      .join(" ");
    const cardText = row.card
      ? `${row.card.name} ${row.card.setName} ${row.card.setCode} ${row.card.collectorNumber}`
      : "";
    return `${cardText} ${productText}`.toLowerCase().includes(normalizedQuery);
  });

  const counts = {
    connected: rows.filter((row) => row.state === "connected").length,
    attention: rows.filter((row) => row.state === "attention").length,
    catalogOnly: rows.filter((row) => row.state === "catalog-only").length,
  };

  return (
    <div className="space-y-6">
      <AdminNav current="listings" />

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Listings
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Read-only catalog and Shopify health. Matching uses the product
              title plus the structured card SKU; this page cannot change store data.
            </p>
          </div>
          <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            Read only
          </span>
        </div>
      </div>

      {catalogResult.status === "rejected" ||
      adminProductsResult.status === "rejected" ||
      headlessResult.status === "rejected" ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Some listing data could not be loaded. Check the database, Shopify
          credentials, and Headless publication before trusting these results.
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Catalog cards" value={cards.length} />
        <SummaryCard label="Connected" value={counts.connected} tone="good" />
        <SummaryCard label="Needs attention" value={counts.attention} tone="warn" />
        <SummaryCard label="Catalog only" value={counts.catalogOnly} />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              Listing inventory
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {adminStatus
                ? `${adminStatus.storeName} · ${adminProducts.length} Shopify product${adminProducts.length === 1 ? "" : "s"} · ${headlessProducts.length} visible to Headless`
                : "Shopify Admin connection unavailable"}
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Showing {filteredRows.length} of {rows.length}
          </p>
        </div>

        <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_12rem_12rem_auto_auto]">
          <label className="space-y-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span>Search</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Name, number, handle, or SKU"
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span>Set</span>
            <select
              name="set"
              defaultValue={setCode}
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">All sets</option>
              {getVisibleStoreSets().map((set) => (
                <option key={`${set.code}-${set.locale}`} value={set.code}>
                  {set.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span>Status</span>
            <select
              name="status"
              defaultValue={stateFilter}
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="all">All statuses</option>
              <option value="connected">Connected</option>
              <option value="attention">Needs attention</option>
              <option value="catalog-only">Catalog only</option>
            </select>
          </label>
          <button
            type="submit"
            className="h-10 self-end rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Apply
          </button>
          <Link
            href="/admin/listings"
            className="flex h-10 items-center justify-center self-end rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset
          </Link>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="hidden border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 lg:grid lg:grid-cols-[minmax(14rem,1.5fr)_minmax(10rem,1fr)_minmax(11rem,1fr)_6rem_6rem] lg:gap-3">
          <span>Catalog card</span>
          <span>Health</span>
          <span>Shopify product</span>
          <span>Variants</span>
          <span>Inventory</span>
        </div>

        {filteredRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            No listings match these filters.
          </p>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredRows.map((row) => (
              <ListingRowView key={row.key} row={row} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "good" | "warn";
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-950 dark:text-zinc-50";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function ListingRowView({ row }: { row: ListingRow }) {
  const product = row.products[0] ?? null;
  const imageUrl = row.card?.imageUrl ?? product?.featuredImage?.url ?? null;

  return (
    <article className="grid gap-4 p-4 text-sm lg:grid-cols-[minmax(14rem,1.5fr)_minmax(10rem,1fr)_minmax(11rem,1fr)_6rem_6rem] lg:items-center lg:gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={row.card?.name ?? product?.title ?? "Listing image"}
              fill
              className="object-contain p-0.5"
              sizes="48px"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">
            {row.card?.name ?? product?.title ?? "Unknown product"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {row.card
              ? `${row.card.setName} · #${row.card.collectorNumber} · ${row.card.locale.toUpperCase()}`
              : "No catalog match"}
          </p>
          {row.card ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-zinc-500">
                NM {formatPrice(row.card.marketPriceCents)}
              </span>
              {row.products.length === 0 ? (
                <Link
                  href={`/admin/listings/new?card=${encodeURIComponent(row.card.slug)}`}
                  className="font-semibold text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
                >
                  Review draft
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${stateStyles[row.state]}`}>
          {row.stateLabel}
        </span>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{row.detail}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
          {product?.title ?? "—"}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {product ? `/${product.handle}` : "No matched handle"}
        </p>
        {product ? (
          <p className="mt-1 text-xs text-zinc-500">
            {product.status} · {row.headless ? "Headless" : "Not on Headless"}
            {row.products.length > 1 ? ` · ${row.products.length} matches` : ""}
          </p>
        ) : null}
      </div>

      <div>
        <span className="text-xs text-zinc-500 lg:hidden">Variants: </span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {product?.variants.length ?? "—"}
        </span>
      </div>

      <div>
        <span className="text-xs text-zinc-500 lg:hidden">Inventory: </span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {product?.totalInventory ?? "—"}
        </span>
      </div>
    </article>
  );
}
