import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getShopifyCart } from "@/lib/shopify/cart";

// The shared header reads a per-customer Shopify cart cookie.
export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let shopifyItemCount = 0;
  try {
    shopifyItemCount = (await getShopifyCart())?.totalQuantity ?? 0;
  } catch (error) {
    console.error("Could not load Shopify cart count", error);
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#101011] text-pokedex-cream">
      <SiteHeader shopifyItemCount={shopifyItemCount} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
