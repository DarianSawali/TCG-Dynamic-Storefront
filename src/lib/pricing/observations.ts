import "server-only";

import { CardCondition as PrismaCardCondition } from "@prisma/client";
import type { CatalogCardWithPricing, CardCondition } from "@/lib/catalog";
import { db } from "@/lib/db";
import {
  DEFAULT_PRICE_POLICY,
  type HistoricalPriceObservation,
} from "@/lib/pricing/policy";

const SOURCE = "justtcg";
const CURRENCY = "USD";

export type PriceObservationHistory = {
  previousByCardCondition: Map<string, HistoricalPriceObservation>;
  recordedCount: number;
};

export function priceObservationKey(slug: string, condition: CardCondition): string {
  return `${slug}:${condition}`;
}

export async function observeJustTcgPrices(
  cards: CatalogCardWithPricing[],
  observedAt = new Date(),
): Promise<PriceObservationHistory> {
  const liveCards = cards.filter(
    (card) =>
      card.priceSource === "justtcg" &&
      card.justtcgCardId &&
      card.livePriceConditions.length > 0,
  );
  if (!liveCards.length) {
    return { previousByCardCondition: new Map(), recordedCount: 0 };
  }

  const storedCards = await db.card.findMany({
    where: {
      OR: [
        {
          justtcgCardId: {
            in: liveCards
              .map((card) => card.justtcgCardId)
              .filter((id): id is string => Boolean(id)),
          },
        },
        { slug: { in: liveCards.map((card) => card.slug) } },
      ],
    },
    select: { id: true, slug: true, justtcgCardId: true },
  });
  const storedByJustTcgId = new Map(
    storedCards.flatMap((card) =>
      card.justtcgCardId ? [[card.justtcgCardId, card] as const] : [],
    ),
  );
  const storedBySlug = new Map(storedCards.map((card) => [card.slug, card]));
  const slugByStoredId = new Map(storedCards.map((card) => [card.id, card.slug]));

  const candidates = liveCards.flatMap((card) => {
    const stored = card.justtcgCardId
      ? storedByJustTcgId.get(card.justtcgCardId)
      : undefined;
    const matchedStoredCard = stored ?? storedBySlug.get(card.slug);
    if (!matchedStoredCard) return [];
    return card.conditionPrices.flatMap((price) =>
      card.livePriceConditions.includes(price.condition) && price.priceCents != null
        ? [{
            cardId: matchedStoredCard.id,
            slug: matchedStoredCard.slug,
            condition: price.condition,
            amountCents: price.priceCents,
          }]
        : [],
    );
  });
  if (!candidates.length) {
    throw new Error(
      "Live JustTCG cards have no matching database card IDs; run the catalog seed.",
    );
  }

  const confirmationCutoff = new Date(
    observedAt.getTime() - DEFAULT_PRICE_POLICY.largeDecreaseConfirmationMs,
  );
  const oldestConfirmation = new Date(
    observedAt.getTime() - DEFAULT_PRICE_POLICY.largeDecreaseConfirmationMaxAgeMs,
  );
  const cardIds = [...new Set(candidates.map((candidate) => candidate.cardId))];

  const [previousSnapshots, recentSnapshots] = await Promise.all([
    db.priceSnapshot.findMany({
      where: {
        cardId: { in: cardIds },
        source: SOURCE,
        currency: CURRENCY,
        fetchedAt: { gte: oldestConfirmation, lte: confirmationCutoff },
      },
      orderBy: { fetchedAt: "desc" },
    }),
    db.priceSnapshot.findMany({
      where: {
        cardId: { in: cardIds },
        source: SOURCE,
        currency: CURRENCY,
        fetchedAt: { gt: confirmationCutoff },
      },
      select: { cardId: true, condition: true },
    }),
  ]);

  const previousByCardCondition = new Map<string, HistoricalPriceObservation>();
  for (const snapshot of previousSnapshots) {
    if (!snapshot.condition) continue;
    const slug = slugByStoredId.get(snapshot.cardId);
    if (!slug) continue;
    const key = priceObservationKey(slug, snapshot.condition);
    if (!previousByCardCondition.has(key)) {
      previousByCardCondition.set(key, {
        amountCents: snapshot.amountCents,
        fetchedAt: snapshot.fetchedAt,
      });
    }
  }

  const recentlyObserved = new Set(
    recentSnapshots.flatMap((snapshot) => {
      if (!snapshot.condition) return [];
      const slug = slugByStoredId.get(snapshot.cardId);
      return slug ? [priceObservationKey(slug, snapshot.condition)] : [];
    }),
  );
  const toRecord = candidates.filter(
    (candidate) =>
      !recentlyObserved.has(priceObservationKey(candidate.slug, candidate.condition)),
  );

  if (toRecord.length) {
    await db.priceSnapshot.createMany({
      data: toRecord.map((candidate) => ({
        cardId: candidate.cardId,
        source: SOURCE,
        condition: candidate.condition as PrismaCardCondition,
        currency: CURRENCY,
        amountCents: candidate.amountCents,
        fetchedAt: observedAt,
      })),
    });
  }

  return { previousByCardCondition, recordedCount: toRecord.length };
}
