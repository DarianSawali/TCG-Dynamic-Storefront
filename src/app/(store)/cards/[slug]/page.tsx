import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConditionPriceTable } from "@/components/condition-price-table";
import { getCardBySlug } from "@/data/catalog";
import { formatPrice } from "@/lib/catalog";
import { localeBadge, showLocaleBadge } from "@/lib/sets";

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
      <nav className="flex min-w-0 items-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/cards" className="hover:text-pokedex-bright">
          Explore
        </Link>
        <span className="mx-2 text-zinc-400">/</span>
        <span className="truncate text-pokedex-cream">
          {card?.name ?? slug}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
        {card?.imageUrl ? (
          <div className="relative mx-auto aspect-63/88 w-full max-w-xs overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/80 lg:mx-0 dark:bg-zinc-900 dark:ring-zinc-800">
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
                ? `mx-auto aspect-63/88 w-full max-w-xs rounded-xl bg-linear-to-br p-4 shadow-inner lg:mx-0 ${card.gradient}`
                : "mx-auto aspect-63/88 w-full max-w-xs rounded-xl border border-[#625253] bg-[#29282a] lg:mx-0"
            }
          />
        )}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-pokedex-cream sm:text-3xl">
            {card?.name ?? slug.replace(/-/g, " ")}
          </h1>
          {card ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              {showLocaleBadge(card.locale) ? (
                <span className="mr-2 inline-flex rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {localeBadge(card.locale)}
                </span>
              ) : null}
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
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-lg bg-pokedex px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex"
            >
              View live Shopify inventory
            </Link>
          ) : null}

          {card ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Prices by condition
              </h2>
              <ConditionPriceTable
                prices={card.conditionPrices}
                priceSource={card.priceSource}
              />
            </section>
          ) : null}

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-[#625253] bg-[#1d1d1f] px-3 py-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Slug</dt>
              <dd className="font-mono text-pokedex-cream">
                {slug}
              </dd>
            </div>
            <div className="rounded-lg border border-[#625253] bg-[#1d1d1f] px-3 py-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Market (NM)</dt>
              <dd className="text-pokedex-cream">
                {card ? formatPrice(card.marketPriceCents) : "—"}
                {card?.priceSource === "justtcg" ? (
                  <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    JustTCG · NM baseline
                  </span>
                ) : null}
              </dd>
            </div>
            {card?.justtcgCardId ? (
              <div className="rounded-lg border border-[#625253] bg-[#1d1d1f] px-3 py-2">
                <dt className="text-zinc-500 dark:text-zinc-400">JustTCG card ID</dt>
                <dd className="break-all font-mono text-xs text-pokedex-cream">
                  {card.justtcgCardId}
                </dd>
              </div>
            ) : null}
            {card?.tcgdexCardId ? (
              <div className="rounded-lg border border-[#625253] bg-[#1d1d1f] px-3 py-2">
                <dt className="text-zinc-500 dark:text-zinc-400">TCGdex card ID</dt>
                <dd className="break-all font-mono text-xs text-pokedex-cream">
                  {card.tcgdexCardId}
                </dd>
              </div>
            ) : null}
            <div className="rounded-lg border border-[#625253] bg-[#1d1d1f] px-3 py-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Stock</dt>
              <dd className="text-pokedex-cream">
                {card?.stockLabel ?? "—"}
              </dd>
            </div>
            {card ? (
              <div className="rounded-lg border border-[#625253] bg-[#1d1d1f] px-3 py-2">
                <dt className="text-zinc-500 dark:text-zinc-400">Shop</dt>
                <dd className="text-pokedex-cream">
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
