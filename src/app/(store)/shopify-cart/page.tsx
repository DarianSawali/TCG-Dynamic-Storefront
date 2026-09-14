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
        <h1 className="text-2xl font-semibold tracking-tight text-pokedex-cream">
          Shopify cart
        </h1>
        <p className="text-pokedex-muted">
          Your Shopify cart is empty or has expired.
        </p>
        <Link
          href="/shop"
          className="inline-flex text-sm font-medium text-pokedex hover:text-pokedex-bright"
        >
          Return to the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-pokedex">
          Live from Shopify
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-pokedex-cream">
            Shopify cart
          </h1>
          <ClearCartButton />
        </div>
        <p className="mt-2 text-pokedex-muted">
          This page reloads the authoritative cart using the encrypted cookie.
        </p>
      </header>

      <ul className="divide-y divide-[#625253] overflow-hidden rounded-xl border border-[#625253] bg-[#1d1d1f] shadow-sm">
        {cart.lines.map((line) => (
          <li
            key={line.id}
            className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6"
          >
            <div>
              <p className="font-medium text-pokedex-cream">
                {line.merchandise.product.title}
              </p>
              <p className="text-sm text-pokedex-muted">
                {line.merchandise.title}
              </p>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-500">
                {line.merchandise.sku ?? "No SKU"}
              </p>
            </div>
            <p className="text-sm tabular-nums text-pokedex-muted">
              {formatMoney(line.merchandise.price)} each
            </p>
            <CartLineControls lineId={line.id} quantity={line.quantity} />
            <p className="font-semibold tabular-nums text-pokedex-cream">
              {formatMoney(line.cost.totalAmount)}
            </p>
          </li>
        ))}
      </ul>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-pokedex/45 bg-pokedex-deep/35 px-4 py-4">
        <div>
          <p className="text-sm text-pokedex-muted">
            {cart.totalQuantity} item{cart.totalQuantity === 1 ? "" : "s"}
          </p>
          <p className="text-xl font-semibold text-pokedex-cream">
            Subtotal: {formatMoney(cart.cost.subtotalAmount)}
          </p>
        </div>
        <a
          href={cart.checkoutUrl}
          className="inline-flex rounded-lg border border-pokedex bg-pokedex px-4 py-2.5 text-sm font-medium text-white hover:border-pokedex-bright hover:bg-pokedex-bright"
        >
          Continue to Shopify checkout
        </a>
      </section>

      <Link
        href="/shop"
        className="inline-flex text-sm font-medium text-pokedex hover:text-pokedex-bright"
      >
        Continue shopping
      </Link>
    </div>
  );
}
