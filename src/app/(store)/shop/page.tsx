import Image from "next/image";
import Link from "next/link";
import { getShopifyProductArtwork } from "@/lib/shopify/artwork";
import { getShopifyProducts, type ShopifyMoney } from "@/lib/shopify/products";

export const metadata = { title: "Shop" };

function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

export default async function ShopPage() {
  const products = await getShopifyProducts();
  const artworkByProductId = new Map(
    await Promise.all(
      products.map(async (product) => [
        product.id,
        await getShopifyProductArtwork(product),
      ] as const),
    ),
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-pokedex">
          Live Shopify inventory
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-pokedex-cream">
          Shop Pokémon singles
        </h1>
        <p className="mt-2 max-w-2xl text-pokedex-muted">
          Prices, conditions, and availability are loaded directly from Shopify.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="text-pokedex-muted">
          No products are currently published to the Headless channel.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => {
            const available = product.variants.filter((variant) => variant.availableForSale);
            const displayVariant = available[0] ?? product.variants[0];
            const artwork = artworkByProductId.get(product.id);
            return (
              <li key={product.id}>
                <Link
                  href={`/shop/products/${product.handle}`}
                  className="group block h-full rounded-2xl border border-[#625253] bg-[#1d1d1f] p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-pokedex/70 hover:shadow-[0_12px_30px_-20px_rgba(223,90,72,0.8)]"
                >
                  <div className="relative aspect-63/88 overflow-hidden rounded-xl bg-linear-to-br from-orange-600 to-red-950">
                    {artwork ? (
                      <Image
                        src={artwork.url}
                        alt={artwork.altText}
                        fill
                        loading={index === 0 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 45vw, 220px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full items-end p-4 text-5xl font-black text-white/25">
                        {product.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  {artwork?.source === "tcgdex" ? (
                    <p className="mt-2 text-[11px] text-zinc-400">Artwork from TCGdex</p>
                  ) : null}
                  <h2 className="mt-3 font-semibold text-pokedex-cream">
                    {product.title}
                  </h2>
                  <p className="mt-1 text-sm text-pokedex-muted">
                    {available.length} condition{available.length === 1 ? "" : "s"} in stock
                  </p>
                  <p className="mt-2 font-semibold text-pokedex-cream">
                    {displayVariant ? `From ${formatMoney(displayVariant.price)}` : "Unavailable"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
