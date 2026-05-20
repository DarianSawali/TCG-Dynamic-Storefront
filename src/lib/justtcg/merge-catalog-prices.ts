import "server-only";

import type { Card } from "justtcg-js";
import { JustTCG } from "justtcg-js";
import type { CatalogCard, CatalogCardWithPricing } from "@/lib/catalog";
import {
  CARD_CONDITIONS,
  CONDITION_META,
  buildConditionPrices,
  nmPrice,
  type CardCondition,
  type ConditionPrice,
} from "@/lib/conditions";

const FREE_PLAN_BATCH_MAX = 20;

function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

function pickConditionMarketUsd(card: Card, code: CardCondition): number | null {
  const variants = card.variants ?? [];
  if (!variants.length) return null;

  const meta = CONDITION_META[code];
  const labels = new Set([meta.justTcgName, meta.shortLabel]);
  const matched = variants.filter((v) => labels.has(v.condition));
  const pool = matched.length ? matched : [];
  const prices = pool
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number" && Number.isFinite(p));

  if (!prices.length) return null;
  return Math.min(...prices);
}

function buildPriceMapFromResponse(
  cards: Card[],
): Map<string, Partial<Record<CardCondition, number>>> {
  const map = new Map<string, Partial<Record<CardCondition, number>>>();
  for (const card of cards) {
    const perCondition: Partial<Record<CardCondition, number>> = {};
    for (const code of CARD_CONDITIONS) {
      const usd = pickConditionMarketUsd(card, code);
      if (usd != null) perCondition[code] = dollarsToCents(usd);
    }
    if (Object.keys(perCondition).length) map.set(card.id, perCondition);
  }
  return map;
}

function mergeConditionPrices(
  card: CatalogCard,
  justTcgByCondition?: Partial<Record<CardCondition, number>>,
): ConditionPrice[] {
  const mockRows = buildConditionPrices(card.marketPriceCents);
  if (!justTcgByCondition) return mockRows;

  return mockRows.map((row) => {
    const live = justTcgByCondition[row.condition];
    return live != null ? { ...row, priceCents: live } : row;
  });
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

  const priceByCardId = new Map<string, Partial<Record<CardCondition, number>>>();

  try {
    const client = new JustTCG({ apiKey });
    for (let i = 0; i < lookupIds.length; i += FREE_PLAN_BATCH_MAX) {
      const slice = lookupIds.slice(i, i + FREE_PLAN_BATCH_MAX);
      const items = slice.map((cardId) => ({
        cardId,
        condition: [...CARD_CONDITIONS],
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
    const live = priceByCardId.get(card.justtcgCardId);
    if (!live || Object.keys(live).length === 0) {
      return { ...card, priceSource: "mock" as const, imageUrl: null };
    }

    const conditionPrices = mergeConditionPrices(card, live);
    return {
      ...card,
      conditionPrices,
      marketPriceCents: nmPrice(conditionPrices),
      priceSource: "justtcg" as const,
      imageUrl: null,
    };
  });
}
