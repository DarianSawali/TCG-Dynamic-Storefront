import { notFound } from "next/navigation";
import {
  getShopifyProductByHandle,
  type ShopifyMoney,
} from "@/lib/shopify/products";
import { ShopifyCartTest } from "@/app/(store)/shopify-test/cart-test";

export const metadata = { title: "Shopify connection test" };

function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

export default async function ShopifyTestPage() {
  const product = await getShopifyProductByHandle("charizard-ex");
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-pokedex">
          Live from Shopify
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-pokedex-cream">
          {product.title}
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {product.description || "No product description has been added."}
        </p>
      </header>

      <div className="rounded-xl border border-[#625253] bg-[#1d1d1f] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#625253] bg-pokedex-deep/35 px-4 py-3">
          <h2 className="font-semibold text-pokedex-cream">
            Condition variants
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {product.availableForSale ? "Product available" : "Product unavailable"}
          </span>
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {product.variants.map((variant) => (
            <li
              key={variant.id}
              className="grid gap-2 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
            >
              <div>
                <p className="font-medium text-pokedex-cream">
                  {variant.title}
                </p>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {variant.sku ?? "No SKU"}
                </p>
              </div>
              <p className="font-semibold tabular-nums text-pokedex-cream">
                {formatMoney(variant.price)}
              </p>
              <p
                className={
                  variant.availableForSale
                    ? "text-sm font-medium text-emerald-700 dark:text-emerald-400"
                    : "text-sm font-medium text-zinc-500"
                }
              >
                {variant.availableForSale
                  ? `${variant.quantityAvailable ?? "?"} available`
                  : "Out of stock"}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <ShopifyCartTest variants={product.variants} />

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        This isolated route reads directly from Shopify. The existing catalog and
        cart are unchanged.
      </p>
    </div>
  );
}
