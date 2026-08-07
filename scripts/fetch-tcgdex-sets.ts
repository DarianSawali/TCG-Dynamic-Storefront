import "dotenv/config";
import { CardLocale, StockStatus } from "@prisma/client";
import { db } from "../src/lib/db";
import { getVisibleStoreSets } from "../src/lib/sets";

/** Cycled for cards without a curated gradient; art almost always covers this. */
const PLACEHOLDER_GRADIENTS = [
  "from-violet-600 to-fuchsia-900",
  "from-orange-600 to-red-900",
  "from-emerald-500 to-teal-800",
  "from-cyan-500 to-blue-900",
  "from-pink-500 to-rose-900",
  "from-amber-500 to-orange-800",
  "from-lime-600 to-emerald-900",
  "from-indigo-600 to-purple-950",
];

type TcgdexSetCard = {
  id: string;
  image?: string;
  localId: string;
  name: string;
};

type TcgdexSetResponse = {
  cards: TcgdexSetCard[];
};

type TcgdexCardDetail = {
  rarity?: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function gradientFor(localId: string): string {
  let hash = 0;
  for (const char of localId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_GRADIENTS[hash % PLACEHOLDER_GRADIENTS.length];
}

/** Runs `fn` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function fetchSetCards(setCode: string): Promise<TcgdexSetCard[]> {
  const res = await fetch(
    `https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(setCode)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) {
    throw new Error(`TCGdex set ${setCode} responded ${res.status}`);
  }
  const data = (await res.json()) as TcgdexSetResponse;
  return data.cards;
}

async function fetchRarity(cardId: string): Promise<string | null> {
  const res = await fetch(
    `https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(cardId)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as TcgdexCardDetail;
  return data.rarity ?? null;
}

async function main() {
  const sets = getVisibleStoreSets().filter((s) => s.locale === "en");

  for (const set of sets) {
    console.log(`\n[${set.code}] fetching set card list…`);
    const cards = await fetchSetCards(set.code);
    console.log(`[${set.code}] ${cards.length} cards, fetching rarity…`);

    let done = 0;
    const withRarity = await mapWithConcurrency(cards, 10, async (card) => {
      const rarity = await fetchRarity(card.id);
      done += 1;
      if (done % 50 === 0) console.log(`[${set.code}] ${done}/${cards.length}`);
      return { ...card, rarity };
    });

    let created = 0;
    let updated = 0;
    for (const card of withRarity) {
      const existing = await db.card.findUnique({
        where: { tcgdexCardId: card.id },
      });

      const dbCard = await db.card.upsert({
        where: { tcgdexCardId: card.id },
        update: {
          name: card.name,
          collectorNumber: card.localId,
          rarity: card.rarity ?? undefined,
          tcgdexImageUrl: card.image ?? null,
        },
        create: {
          slug: `${slugify(card.name)}-${set.code.toLowerCase()}-${card.localId}`,
          name: card.name,
          setCode: set.code,
          locale: CardLocale.en,
          setName: set.name,
          collectorNumber: card.localId,
          rarity: card.rarity ?? undefined,
          gradient: gradientFor(card.localId),
          tcgdexCardId: card.id,
          tcgdexImageUrl: card.image ?? null,
        },
      });

      if (existing) updated += 1;
      else created += 1;

      const listing = await db.listing.findUnique({
        where: { cardId: dbCard.id },
      });
      if (!listing) {
        await db.listing.create({
          data: {
            cardId: dbCard.id,
            shopListed: false,
            stockStatus: StockStatus.IN_STOCK,
            marketPriceCents: null,
          },
        });
      }
    }

    console.log(`[${set.code}] done — ${created} created, ${updated} updated.`);
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
