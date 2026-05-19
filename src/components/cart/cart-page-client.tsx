"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/catalog";

function QuantityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="px-2 py-1 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="min-w-8 px-2 py-1 text-center text-sm font-medium">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="px-2 py-1 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function CartPageClient() {
  const { items, subtotalCents, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Your cart
        </h1>
        <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
          Your cart is empty. Add cards from the shop to see them here.
        </p>
        <Link
          href="/shop"
          className="inline-flex text-sm font-medium text-violet-600 underline-offset-4 hover:text-violet-500 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Your cart
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Review items, adjust quantity, and continue to checkout later.
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="inline-flex rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Clear cart
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.slug}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Link href={`/cards/${item.slug}`} className="flex items-center gap-3">
              <div className="relative size-20 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                ) : (
                  <div className={`h-full w-full bg-linear-to-br ${item.gradient}`} />
                )}
              </div>
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{item.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.setName}</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                  {formatPrice(item.marketPriceCents)}
                </p>
              </div>
            </Link>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <QuantityControl
                value={item.quantity}
                onChange={(next) => updateQuantity(item.slug, next)}
              />
              <p className="w-24 text-right font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                {formatPrice((item.marketPriceCents ?? 0) * item.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.slug)}
                className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Subtotal</p>
        <p className="text-xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
          {formatPrice(subtotalCents)}
        </p>
      </div>
    </div>
  );
}
