import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { getCatalogCards } from "@/data/catalog";
import type { CardCondition } from "@/lib/conditions";
import { evaluatePriceChange, type PriceDecision } from "@/lib/pricing/policy";
import { getShopifyProducts } from "@/lib/shopify/products";

export const metadata: Metadata = {
  title: "Pricing",
};

const decisionLabel: Record<PriceDecision, string> = {
  "auto-update": "Would update",
  "approval-required": "Needs approval",
  "awaiting-confirmation": "Awaiting confirmation",
  "no-change": "No change",
  skipped: "Skipped",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function variantCondition(title: string): CardCondition | null {
  return title.match(/\b(NM|LP|MP|HP|DMG)\b/i)?.[1].toUpperCase() as CardCondition ?? null;
}

function cents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

function money(value: number | null, currency = "USD"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value / 100);
}

export default async function AdminPricingPage() {
  const [shopifyResult, catalogResult] = await Promise.allSettled([
    getShopifyProducts(),
    getCatalogCards(),
  ]);
  const products = shopifyResult.status === "fulfilled" ? shopifyResult.value : [];
  const cards = catalogResult.status === "fulfilled" ? catalogResult.value : [];
  const checkedAt = new Date();

  const rows = products.flatMap((product) => {
    const card = cards.find(
      (candidate) => candidate.locale === "en" && normalize(candidate.name) === normalize(product.title),
    );
    return product.variants.map((variant) => {
      const condition = variantCondition(variant.title);
      const marketCents = condition
        ? card?.conditionPrices.find((price) => price.condition === condition)?.priceCents ?? null
        : null;
      const isLive = card?.priceSource === "justtcg";
      const sameCurrency = variant.price.currencyCode === "USD";
      const targetCents = isLive && sameCurrency ? marketCents : null;
      const evaluation = evaluatePriceChange({
        currentPriceCents: cents(variant.price.amount),
        targetPriceCents: targetCents,
        marketFetchedAt: targetCents == null ? null : checkedAt,
        now: checkedAt,
      });

      let reason = evaluation.reason;
      if (!condition) reason = "The Shopify variant title has no NM/LP/MP/HP/DMG code.";
      else if (!card) reason = "No matching catalog card was found.";
      else if (!isLive) reason = "A JustTCG card ID/live price is not available; mock prices are never synced.";
      else if (!sameCurrency) reason = "Currency conversion must be configured before this price can sync.";

      return { product, variant, condition, marketCents, evaluation: { ...evaluation, reason } };
    });
  });

  return (
    <div className="space-y-6">
      <AdminNav current="pricing" />
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Pricing
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Dry run only. This page compares Shopify prices with eligible JustTCG
          condition prices and never writes to Shopify.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">Active guardrails</h2>
        <ul className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
          <li>Check every 6 hours; market data must be under 24 hours old.</li>
          <li>Maximum one automatic update per variant every 24 hours.</li>
          <li>Increases up to 25% can update automatically.</li>
          <li>Larger increases require approval.</li>
          <li>Drops over 10% and $2 require two checks 6–24 hours apart.</li>
          <li>Manual changes lock automation for 7 days.</li>
        </ul>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">Current dry run</h2>
          <p className="mt-1 text-xs text-zinc-500">Target currently equals market price; markup and currency conversion are not applied yet.</p>
        </div>
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
            Shopify products could not be loaded or no products are published.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950/60">
                <tr>
                  <th className="px-4 py-3">Product / condition</th>
                  <th className="px-4 py-3 text-right">Shopify</th>
                  <th className="px-4 py-3 text-right">Market</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {rows.map(({ product, variant, condition, marketCents, evaluation }) => (
                  <tr key={variant.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-950 dark:text-zinc-50">{product.title}</span>
                      <span className="block text-xs text-zinc-500">{condition ?? variant.title}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{money(cents(variant.price.amount), variant.price.currencyCode)}</td>
                    <td className="px-4 py-3 text-right">{money(marketCents)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{decisionLabel[evaluation.decision]}</td>
                    <td className="min-w-72 px-4 py-3 text-xs text-zinc-500">{evaluation.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
