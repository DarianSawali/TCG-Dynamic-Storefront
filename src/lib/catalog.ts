import {
  buildConditionPrices,
  nmPrice,
  type CardCondition,
  type ConditionPrice,
} from "@/lib/conditions";

export type { CardCondition, ConditionPrice };
export { buildConditionPrices, nmPrice };

export type StockLabel =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock";

export type PriceSource = "justtcg" | "mock";

export type CatalogCard = {
  slug: string;
  name: string;
  setName: string;
  collectorNumber: string;
  rarity?: string;
  /** Tailwind gradient utility classes (e.g. `from-violet-500 to-fuchsia-700`) */
  gradient: string;
  /** Per-condition shelf prices (NM → DMG) */
  conditionPrices: ConditionPrice[];
  /** NM market price (convenience; mirrors conditionPrices.NM) */
  marketPriceCents: number | null;
  stockLabel: StockLabel;
  /** When true, card appears on `/shop` as well as `/cards` */
  shopListed: boolean;
  /**
   * JustTCG `cardId` for batch price lookup. See
   * https://justtcg.com/docs — IDs look like `pokemon-{set}-{name}-{rarity}`.
   */
  justtcgCardId?: string;
  /**
   * TCGdex `id` for artwork (`GET https://api.tcgdex.net/v2/en/cards/{id}`).
   * Example: `svp-027`, `base1-4`, `sv03.5-193`.
   */
  tcgdexCardId?: string;
};

/** After `getCatalogCards()` merges JustTCG prices and TCGdex image URLs. */
export type CatalogCardWithPricing = CatalogCard & {
  priceSource: PriceSource;
  /** Full HTTPS URL (e.g. …/high.webp) or null to use gradient placeholder. */
  imageUrl: string | null;
};

export function formatPrice(
  cents: number | null,
  currency: string = "USD",
): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Mock catalog; replace with DB queries later */
export const mockCards: CatalogCard[] = [
  {
    slug: "pikachu-svp-027",
    name: "Pikachu",
    setName: "SV Black Star Promos",
    collectorNumber: "027",
    rarity: "Promo",
    gradient: "from-amber-400 to-yellow-600",
    ...withConditionPrices(249),
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "svp-027",
  },
  {
    slug: "charizard-base-set-shadowless",
    name: "Charizard",
    setName: "Base Set",
    collectorNumber: "4",
    rarity: "Holo Rare",
    gradient: "from-orange-600 to-red-900",
    ...withConditionPrices(1899),
    stockLabel: "Low Stock",
    shopListed: true,
    justtcgCardId: "pokemon-base-set-shadowless-charizard-holo-rare",
    tcgdexCardId: "base1-4",
  },
  {
    slug: "mew-ex-151",
    name: "Mew ex",
    setName: "151",
    collectorNumber: "193",
    rarity: "Ultra Rare",
    gradient: "from-pink-500 to-violet-700",
    ...withConditionPrices(6299),
    stockLabel: "Low Stock",
    shopListed: true,
    tcgdexCardId: "sv03.5-193",
  },
  {
    slug: "basic-fire-energy-sv03",
    name: "Basic Fire Energy",
    setName: "Obsidian Flames",
    collectorNumber: "230",
    rarity: "Hyper rare",
    gradient: "from-teal-500 to-cyan-800",
    ...withConditionPrices(175),
    stockLabel: "In Stock",
    shopListed: false,
    tcgdexCardId: "sv03-230",
  },
  {
    slug: "lucario-ex-stellar-082",
    name: "Lucario ex",
    setName: "Stellar Crown",
    collectorNumber: "082",
    rarity: "Double Rare",
    gradient: "from-slate-500 to-indigo-900",
    ...withConditionPrices(null),
    stockLabel: "Out of Stock",
    shopListed: false,
    tcgdexCardId: "sv07-082",
  },
  {
    slug: "gardevoir-ex-paldean-fates",
    name: "Gardevoir ex",
    setName: "Paldean Fates",
    collectorNumber: "217",
    rarity: "Shiny Ultra Rare",
    gradient: "from-emerald-500 to-teal-800",
    ...withConditionPrices(425),
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "sv04.5-217",
  },
];

function withConditionPrices(nmCents: number | null): {
  conditionPrices: ConditionPrice[];
  marketPriceCents: number | null;
} {
  const conditionPrices = buildConditionPrices(nmCents);
  return { conditionPrices, marketPriceCents: nmPrice(conditionPrices) };
}
