import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopifyBuyPanel } from "@/app/(store)/shop/products/[handle]/buy-panel";
import { getShopifyProductArtwork } from "@/lib/shopify/artwork";
import { getShopifyProductByHandle } from "@/lib/shopify/products";

type Props = { params: Promise<{ handle: string }> };

export default async function ShopifyProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getShopifyProductByHandle(handle);
  if (!product) notFound();
  const artwork = await getShopifyProductArtwork(product);

  return (
    <div className="space-y-6">
      <Link href="/shop" className="text-sm font-medium text-pokedex hover:text-pokedex-bright hover:underline">
        ← Back to shop
      </Link>
      <div className="grid gap-8 md:grid-cols-[minmax(0,360px)_1fr]">
        <div className="relative aspect-63/88 overflow-hidden rounded-2xl bg-linear-to-br from-orange-600 to-red-950">
          {artwork ? (
            <Image
              src={artwork.url}
              alt={artwork.altText}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-contain p-2"
            />
          ) : (
            <div className="flex h-full items-end p-6 text-7xl font-black text-white/25">
              {product.title.charAt(0)}
            </div>
          )}
        </div>
        {artwork?.source === "tcgdex" ? (
          <p className="text-xs text-zinc-500 md:hidden">Artwork from TCGdex</p>
        ) : null}
        <div className="space-y-6">
          <header>
            <p className="text-sm font-medium text-pokedex">Live Shopify product</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-pokedex-cream">
              {product.title}
            </h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              {product.description || "No description has been added."}
            </p>
          </header>
          {artwork?.source === "tcgdex" ? (
            <p className="hidden text-xs text-zinc-500 md:block">Artwork from TCGdex</p>
          ) : null}
          <ShopifyBuyPanel variants={product.variants} />
        </div>
      </div>
    </div>
  );
}
