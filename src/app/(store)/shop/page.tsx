import { CardGrid } from "@/components/card-grid";
import { getShopCards } from "@/data/catalog";

export const metadata = {
  title: "Shop",
};

export const revalidate = 600;

export default async function ShopPage() {
  const listings = await getShopCards();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Shop
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Cards marked as listed for sale. Checkout will use Shopify later; add
          to cart is disabled for now.
        </p>
      </div>
      {listings.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No listings yet.
        </p>
      ) : (
        <CardGrid cards={listings} variant="shop" />
      )}
    </div>
  );
}
