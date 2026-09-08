import Link from "next/link";
import {
  getShopifyCart,
  type ShopifyCartMoney,
} from "@/lib/shopify/cart";
import {
  CartLineControls,
  ClearCartButton,
} from "@/app/(store)/shopify-cart/cart-controls";

export const metadata = { title: "Shopify cart" };

function formatMoney(money: ShopifyCartMoney): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

export default async function ShopifyCartPage() {
  const cart = await getShopifyCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Shopify cart
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your Shopify cart is empty or has expired.
        </p>
        <Link
          href="/shop"
          className="inline-flex text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          Return to the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
          Live from Shopify
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Shopify cart
          </h1>
          <ClearCartButton />
        </div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This page reloads the authoritative cart using the encrypted cookie.
        </p>
      </header>

      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {cart.lines.map((line) => (
          <li
            key={line.id}
            className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6"
          >
            <div>
              <p className="font-medium text-zinc-950 dark:text-zinc-50">
                {line.merchandise.product.title}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {line.merchandise.title}
              </p>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-500">
                {line.merchandise.sku ?? "No SKU"}
              </p>
            </div>
            <p className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
              {formatMoney(line.merchandise.price)} each
            </p>
            <CartLineControls lineId={line.id} quantity={line.quantity} />
            <p className="font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
              {formatMoney(line.cost.totalAmount)}
            </p>
          </li>
        ))}
      </ul>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {cart.totalQuantity} item{cart.totalQuantity === 1 ? "" : "s"}
          </p>
          <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Subtotal: {formatMoney(cart.cost.subtotalAmount)}
          </p>
        </div>
        <a
          href={cart.checkoutUrl}
          className="inline-flex rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Continue to Shopify checkout
        </a>
      </section>

      <Link
        href="/shop"
        className="inline-flex text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
      >
        Continue shopping
      </Link>
    </div>
  );
}
