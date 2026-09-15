import "dotenv/config";
import { CardCondition } from "@prisma/client";
import type { Card } from "justtcg-js";
import { JustTCG } from "justtcg-js";
import { db } from "../src/lib/db";

const PAGE_SIZE = 20;
const REQUEST_INTERVAL_MS = 6_500;
const MAX_RATE_LIMIT_RETRIES = 5;

const SETS = [
  { tcgdex: "sv03.5", justtcg: "sv-scarlet-violet-151-pokemon" },
  { tcgdex: "me02", justtcg: "me02-phantasmal-flames-pokemon" },
  { tcgdex: "me02.5", justtcg: "me-ascended-heroes-pokemon" },
] as const;

function collectorKey(value: string | null): string | null {
  if (!value) return null;
  const local = value.split("/", 1)[0].trim().toUpperCase();
  if (!local) return null;
  return /^\d+$/.test(local) ? String(Number(local)) : local.replace(/^0+/, "");
}

function nearMintCents(card: Card): number | null {
  const prices = (card.variants ?? [])
    .filter((variant) => variant.condition === "Near Mint")
    .map((variant) => variant.price)
    .filter((price): price is number => Number.isFinite(price));

  return prices.length ? Math.round(Math.min(...prices) * 100) : null;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchPage(
  client: JustTCG,
  setId: string,
  offset: number,
) {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    try {
      return await client.v1.cards.get({
        game: "Pokemon",
        set: setId,
        condition: ["NM"],
        include_null_prices: false,
        limit: PAGE_SIZE,
        offset,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const rateLimited = /rate limit|429/i.test(message);
      if (!rateLimited || attempt === MAX_RATE_LIMIT_RETRIES) throw error;

      const backoffMs = Math.min(30_000, 5_000 * 2 ** attempt);
      console.warn(`Rate limited; retrying in ${backoffMs / 1_000}s...`);
      await wait(backoffMs);
    }
  }

  throw new Error("JustTCG retry limit reached.");
}

async function fetchSet(client: JustTCG, setId: string): Promise<Card[]> {
  const cards: Card[] = [];
  let offset = 0;

  while (true) {
    const response = await fetchPage(client, setId, offset);
    if (response.error) {
      throw new Error(`${response.code ?? "JustTCG"}: ${response.error}`);
    }

    cards.push(...response.data);
    if (!response.pagination?.hasMore) return cards;
    offset += PAGE_SIZE;
    await wait(REQUEST_INTERVAL_MS);
  }
}

async function main() {
  const apiKey = process.env.JUSTTCG_API_KEY?.trim();
  if (!apiKey) throw new Error("JUSTTCG_API_KEY is not configured.");

  const client = new JustTCG({ apiKey });
  let updated = 0;
  let unmatched = 0;

  for (const set of SETS) {
    const catalogCards = await db.card.findMany({
      where: { setCode: set.tcgdex, locale: "en" },
      select: {
        id: true,
        collectorNumber: true,
        listing: { select: { id: true } },
      },
    });

    console.log(`[${set.tcgdex}] downloading NM prices from JustTCG...`);
    const marketCards = await fetchSet(client, set.justtcg);
    const marketByNumber = new Map(
      marketCards.flatMap((card) => {
        const key = collectorKey(card.number);
        return key ? [[key, card] as const] : [];
      }),
    );

    for (const catalogCard of catalogCards) {
      const marketCard = marketByNumber.get(collectorKey(catalogCard.collectorNumber) ?? "");
      const amountCents = marketCard ? nearMintCents(marketCard) : null;
      if (!marketCard || amountCents == null || !catalogCard.listing) {
        unmatched += 1;
        continue;
      }

      await db.$transaction([
        db.card.update({
          where: { id: catalogCard.id },
          data: { justtcgCardId: marketCard.id },
        }),
        db.listing.update({
          where: { id: catalogCard.listing.id },
          data: { marketPriceCents: amountCents },
        }),
        db.listingCondition.upsert({
          where: {
            listingId_condition: {
              listingId: catalogCard.listing.id,
              condition: CardCondition.NM,
            },
          },
          update: { priceCents: amountCents },
          create: {
            listingId: catalogCard.listing.id,
            condition: CardCondition.NM,
            priceCents: amountCents,
          },
        }),
        db.priceSnapshot.create({
          data: {
            cardId: catalogCard.id,
            source: "justtcg",
            condition: CardCondition.NM,
            currency: "USD",
            amountCents,
          },
        }),
      ]);
      updated += 1;
    }

    console.log(
      `[${set.tcgdex}] ${marketCards.length} market records; ${catalogCards.length} catalog cards checked.`,
    );
  }

  console.log(`Done: ${updated} NM prices updated; ${unmatched} cards had no priced match.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
