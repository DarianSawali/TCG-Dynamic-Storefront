import type { Metadata } from "next";
import { ApprovePricesForm } from "@/app/admin/(protected)/pricing/approve-prices-form";
import { AdminNav } from "@/components/admin-nav";
import { getLiveShopCards } from "@/data/catalog";
import {
  evaluatePriceChange,
  previousLargeDecreaseAt,
  type PriceDecision,
} from "@/lib/pricing/policy";
import {
  observeJustTcgPrices,
  priceObservationKey,
  type PriceObservationHistory,
} from "@/lib/pricing/observations";
import {
  conditionFromShopifyVariantTitle,
  findCatalogCardForShopifyProduct,
} from "@/lib/pricing/shopify-match";
import { getShopifyAdminStatus } from "@/lib/shopify/admin";
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

function cents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

function money(value: number | null, currency = "USD"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value / 100);
}

export default async function AdminPricingPage() {
  const [shopifyResult, catalogResult, adminResult] = await Promise.allSettled([
    getShopifyProducts(),
    getLiveShopCards(),
    getShopifyAdminStatus(),
  ]);
  const products = shopifyResult.status === "fulfilled" ? shopifyResult.value : [];
  const cards = catalogResult.status === "fulfilled" ? catalogResult.value : [];
  const adminStatus = adminResult.status === "fulfilled" ? adminResult.value : null;
  const checkedAt = new Date();
  let priceHistory: PriceObservationHistory = {
    previousByCardCondition: new Map(),
    recordedCount: 0,
  };
  try {
    priceHistory = await observeJustTcgPrices(cards, checkedAt);
  } catch (error) {
    console.error("Could not persist JustTCG price observations", error);
  }

  const rows = products.flatMap((product) => {
    const card = findCatalogCardForShopifyProduct(product, cards);
    return product.variants.map((variant) => {
      const condition = conditionFromShopifyVariantTitle(variant.title);
      const conditionPriceCents = condition
        ? card?.conditionPrices.find((price) => price.condition === condition)?.priceCents ?? null
        : null;
      const isLive = Boolean(
        condition &&
          card?.priceSource === "justtcg" &&
          card.livePriceConditions.includes(condition),
      );
      const marketCents = isLive ? conditionPriceCents : null;
      const sameCurrency = variant.price.currencyCode === "USD";
      const targetCents = isLive && sameCurrency ? marketCents : null;
      const currentPriceCents = cents(variant.price.amount);
      const previousObservation = condition && card
        ? priceHistory.previousByCardCondition.get(
            priceObservationKey(card.slug, condition),
          )
        : null;
      const evaluation = evaluatePriceChange({
        currentPriceCents,
        targetPriceCents: targetCents,
        marketFetchedAt: targetCents == null ? null : checkedAt,
        now: checkedAt,
        previousLargeDecreaseAt: previousLargeDecreaseAt(
          currentPriceCents,
          previousObservation,
          checkedAt,
        ),
      });

      let reason = evaluation.reason;
      if (!condition) reason = "The Shopify variant title has no NM/LP/MP/HP/DMG code.";
      else if (!card) reason = "No matching catalog card was found.";
      else if (!isLive) reason = "A JustTCG card ID/live price is not available; mock prices are never synced.";
      else if (!sameCurrency) reason = "Currency conversion must be configured before this price can sync.";

      return { product, variant, condition, marketCents, evaluation: { ...evaluation, reason } };
    });
  });
  const approvals = products.map((product) => ({
    product,
    count: rows.filter(
      (row) =>
        row.product.id === product.id &&
        (row.evaluation.decision === "auto-update" ||
          row.evaluation.decision === "approval-required"),
    ).length,
  })).filter(({ count }) => count > 0);

  return (
    <div className="space-y-6">
      <AdminNav current="pricing" />
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Pricing
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Compare Shopify with live JustTCG prices first. Updates only run after
          an authenticated admin explicitly confirms a product-level bulk change.
        </p>
      </div>

      <section className={`rounded-xl border p-5 ${
        adminStatus?.canWriteProducts
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              Shopify Admin API
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {adminStatus
                ? `Connected to ${adminStatus.storeName} (${adminStatus.domain}) · ${adminStatus.currencyCode}`
                : "Not connected. Check the server credentials and app installation."}
            </p>
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold dark:bg-zinc-950/60">
            {adminStatus?.canWriteProducts ? "write_products granted" : "Connection unavailable"}
          </span>
        </div>
      </section>

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
          <p className="mt-1 text-xs text-zinc-500">
            {priceHistory.recordedCount > 0
              ? `${priceHistory.recordedCount} new live condition observations saved for timed confirmation.`
              : "Live observations are already recorded for the current 6-hour window."}
          </p>
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
        {adminStatus?.canWriteProducts && approvals.length > 0 ? (
          <div className="space-y-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">
              Approval refreshes market data on the server and updates only
              eligible conditions in one atomic Shopify request. Prices awaiting
              timed confirmation are excluded.
            </p>
            <div className="flex flex-wrap gap-3">
              {approvals.map(({ product, count }) => (
                <ApprovePricesForm
                  key={product.id}
                  handle={product.handle}
                  count={count}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
