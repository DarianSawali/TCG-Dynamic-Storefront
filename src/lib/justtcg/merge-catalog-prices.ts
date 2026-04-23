import "server-only";

import type { Card } from "justtcg-js";
import { JustTCG } from "justtcg-js";
import type { CatalogCard, CatalogCardWithPricing } from "@/lib/catalog";

const FREE_PLAN_BATCH_MAX = 20;

function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

/** Prefer Near Mint; use the cheapest NM variant for a conservative market display. */
function pickNearMintMarketUsd(card: Card): number | null {
  const variants = card.variants ?? [];
  if (!variants.length) return null;

  const nearMint = variants.filter((v) => v.condition === "Near Mint");
  const pool = nearMint.length ? nearMint : variants;
  const prices = pool
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number" && Number.isFinite(p));

  if (!prices.length) return null;
  return Math.min(...prices);
}

function buildPriceMapFromResponse(cards: Card[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const card of cards) {
    const usd = pickNearMintMarketUsd(card);
    if (usd != null) map.set(card.id, dollarsToCents(usd));
  }
  return map;
}

export async function mergeJustTcgPrices(
  cards: CatalogCard[],
): Promise<CatalogCardWithPricing[]> {
  const withMockOnly = (): CatalogCardWithPricing[] =>
    cards.map((c) => ({
      ...c,
      priceSource: "mock" as const,
      imageUrl: null,
    }));

  const apiKey = process.env.JUSTTCG_API_KEY?.trim();
  if (!apiKey) return withMockOnly();

  const lookupIds = [
    ...new Set(
      cards.map((c) => c.justtcgCardId).filter((id): id is string => Boolean(id)),
    ),
  ];

  if (!lookupIds.length) return withMockOnly();

  const priceByCardId = new Map<string, number>();

  try {
    const client = new JustTCG({ apiKey });

    for (let i = 0; i < lookupIds.length; i += FREE_PLAN_BATCH_MAX) {
      const slice = lookupIds.slice(i, i + FREE_PLAN_BATCH_MAX);
      const items = slice.map((cardId) => ({
        cardId,
        condition: ["Near Mint" as const],
      }));

      const response = await client.v1.cards.getByBatch(items);

      if (response.error) {
        console.warn("[JustTCG]", response.code ?? "", response.error);
        return withMockOnly();
      }

      const merged = buildPriceMapFromResponse(response.data);
      for (const [id, cents] of merged) priceByCardId.set(id, cents);
    }
  } catch (err) {
    console.warn("[JustTCG] request failed:", err);
    return withMockOnly();
  }

  return cards.map((card) => {
    if (!card.justtcgCardId) {
      return { ...card, priceSource: "mock" as const, imageUrl: null };
    }
    const cents = priceByCardId.get(card.justtcgCardId);
    if (cents == null) {
      return { ...card, priceSource: "mock" as const, imageUrl: null };
    }
    return {
      ...card,
      marketPriceCents: cents,
      priceSource: "justtcg" as const,
      imageUrl: null,
    };
  });
}
