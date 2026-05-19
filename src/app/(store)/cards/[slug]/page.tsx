import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { getCardBySlug } from "@/data/catalog";
import { formatPrice } from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  const title = card?.name ?? slug.replace(/-/g, " ");
  return {
    title,
    description: card
      ? `${card.name} · ${card.setName}`
      : `Card details for ${slug}.`,
  };
}

export default async function CardDetailPage({ params }: Props) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);

  return (
    <div className="space-y-8">
      <nav className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/cards" className="hover:text-zinc-950 dark:hover:text-zinc-50">
          Explore
        </Link>
        <span className="mx-2 text-zinc-400">/</span>
        <span className="text-zinc-950 dark:text-zinc-50">
          {card?.name ?? slug}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
        {card?.imageUrl ? (
          <div className="relative aspect-63/88 w-full max-w-xs overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:ring-zinc-800">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              className="object-contain p-2"
              sizes="280px"
              priority
            />
          </div>
        ) : (
          <div
            className={
              card
                ? `aspect-63/88 w-full max-w-xs rounded-xl bg-linear-to-br p-4 shadow-inner ${card.gradient}`
                : "aspect-63/88 w-full max-w-xs rounded-xl border border-dashed border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
            }
          />
        )}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            {card?.name ?? slug.replace(/-/g, " ")}
          </h1>
          {card ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              {card.setName} · {card.collectorNumber}
              {card.rarity ? ` · ${card.rarity}` : ""}
            </p>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400">
              Unknown slug in mock data. Set, number, rarity, and imagery will
              come from your database and TCGdex when connected.
            </p>
          )}
          {card?.shopListed ? (
            <div className="max-w-xs">
              <AddToCartButton card={card} />
            </div>
          ) : null}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <dt className="text-zinc-500 dark:text-zinc-400">Slug</dt>
              <dd className="font-mono text-zinc-950 dark:text-zinc-50">
                {slug}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <dt className="text-zinc-500 dark:text-zinc-400">Market</dt>
              <dd className="text-zinc-950 dark:text-zinc-50">
                {card ? formatPrice(card.marketPriceCents) : "—"}
                {card?.priceSource === "justtcg" ? (
                  <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    JustTCG · Near Mint
                  </span>
                ) : null}
              </dd>
            </div>
            {card?.justtcgCardId ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <dt className="text-zinc-500 dark:text-zinc-400">JustTCG card ID</dt>
                <dd className="break-all font-mono text-xs text-zinc-950 dark:text-zinc-50">
                  {card.justtcgCardId}
                </dd>
              </div>
            ) : null}
            {card?.tcgdexCardId ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <dt className="text-zinc-500 dark:text-zinc-400">TCGdex card ID</dt>
                <dd className="break-all font-mono text-xs text-zinc-950 dark:text-zinc-50">
                  {card.tcgdexCardId}
                </dd>
              </div>
            ) : null}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <dt className="text-zinc-500 dark:text-zinc-400">Stock</dt>
              <dd className="text-zinc-950 dark:text-zinc-50">
                {card?.stockLabel ?? "—"}
              </dd>
            </div>
            {card ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <dt className="text-zinc-500 dark:text-zinc-400">Shop</dt>
                <dd className="text-zinc-950 dark:text-zinc-50">
                  {card.shopListed ? "Listed" : "Catalog only"}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}
