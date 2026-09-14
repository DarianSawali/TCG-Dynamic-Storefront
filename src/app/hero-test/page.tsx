import { HeroTestHeader } from "@/components/hero/hero-test-header";
import { HomeHeroCarousel } from "@/components/hero/home-hero-carousel";
import { SiteFooter } from "@/components/site-footer";
import { getShopifyCart } from "@/lib/shopify/cart";

export const metadata = {
  title: "Hero + nav prototype",
};

export const dynamic = "force-dynamic";

export default async function HeroTestPage() {
  let cartCount = 0;
  try {
    cartCount = (await getShopifyCart())?.totalQuantity ?? 0;
  } catch {
    cartCount = 0;
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-950">
      <p className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-center font-mono text-[11px] tracking-wide text-amber-100/90 uppercase">
        Layout prototype · not live · banners in{" "}
        <code className="normal-case tracking-normal text-amber-50">
          public/hero/
        </code>
      </p>

      <HeroTestHeader cartCount={cartCount} />
      <main className="flex-1">
        <HomeHeroCarousel />

        <section className="mx-auto max-w-6xl space-y-3 px-4 py-12 sm:px-6">
          <h2 className="font-mono text-sm tracking-wide text-zinc-400 uppercase">
            Below the fold (placeholder)
          </h2>
          <p className="max-w-2xl text-sm text-zinc-500">
            Real home content (set cards, etc.) would sit here after the hero.
            This page only previews the solid dock nav + full-bleed carousel.
          </p>
          <ul className="list-inside list-disc font-mono text-xs text-zinc-600">
            <li>public/hero/umbreon.jpg</li>
            <li>public/hero/rayquaza.jpg</li>
            <li>public/hero/lugia.jpg</li>
            <li>public/hero/leafeon.jpg</li>
            <li>public/hero/giratina.jpg</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
