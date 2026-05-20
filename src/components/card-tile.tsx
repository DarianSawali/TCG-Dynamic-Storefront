import Image from "next/image";
import Link from "next/link";
import type { CatalogCardWithPricing, StockLabel } from "@/lib/catalog";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatPrice } from "@/lib/catalog";

function StockBadge({ label }: { label: StockLabel }) {
  const styles: Record<StockLabel, string> = {
    "In Stock":
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300",
    "Low Stock":
      "bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200",
    "Out of Stock":
      "bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-xs font-medium ${styles[label]}`}
    >
      {label}
    </span>
  );
}

type CardTileProps = {
  card: CatalogCardWithPricing;
  variant: "catalog" | "shop";
};

function CardArt({ card }: { card: CatalogCardWithPricing }) {
  const initial = card.name.charAt(0).toUpperCase();

  if (card.imageUrl) {
    return (
      <div className="relative aspect-63/88 w-full overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:ring-zinc-800">
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className="object-contain p-1"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-63/88 w-full items-end justify-start overflow-hidden rounded-xl bg-linear-to-br p-3 shadow-inner ${card.gradient}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]"
        aria-hidden
      />
      <span
        className="relative text-4xl font-black tracking-tighter text-white/25 drop-shadow-sm select-none"
        aria-hidden
      >
        {initial}
      </span>
    </div>
  );
}

function CardMeta({ card }: { card: CatalogCardWithPricing }) {
  const sourceLabel =
    card.priceSource === "justtcg" ? " · JustTCG (NM)" : "";

  return (
    <div className="mt-3 flex min-h-24 flex-col justify-start space-y-1.5">
      <h2 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-950 dark:text-zinc-50">
        {card.name}
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {card.setName} · {card.collectorNumber}
        {card.rarity ? ` · ${card.rarity}` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <StockBadge label={card.stockLabel} />
        <span className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          NM{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {formatPrice(card.marketPriceCents)}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500"> · 5 conditions</span>
          {sourceLabel}
        </span>
      </div>
    </div>
  );
}

export function CardTile({ card, variant }: CardTileProps) {
  const href = `/cards/${card.slug}`;

  if (variant === "catalog") {
    return (
      <Link
        href={href}
        className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
      >
        <CardArt card={card} />
        <CardMeta card={card} />
      </Link>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <Link href={href} className="block grow transition hover:opacity-95">
        <CardArt card={card} />
        <CardMeta card={card} />
      </Link>
      <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <span className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
          {formatPrice(card.marketPriceCents)}
        </span>
        <AddToCartButton
          card={card}
          className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 sm:w-auto dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        />
      </div>
    </article>
  );
}
