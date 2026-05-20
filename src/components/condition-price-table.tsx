import type { ConditionPrice } from "@/lib/conditions";
import { formatPrice } from "@/lib/catalog";

type ConditionPriceTableProps = {
  prices: ConditionPrice[];
  priceSource?: "justtcg" | "mock";
  highlight?: ConditionPrice["condition"];
};

export function ConditionPriceTable({
  prices,
  priceSource,
  highlight,
}: ConditionPriceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Condition</th>
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {prices.map((row) => {
            const active = highlight === row.condition;
            return (
              <tr
                key={row.condition}
                className={
                  active
                    ? "bg-violet-50/80 dark:bg-violet-950/30"
                    : "bg-white dark:bg-zinc-950"
                }
              >
                <td className="px-3 py-2.5">
                  <span className="font-medium text-zinc-950 dark:text-zinc-50">
                    {row.label}
                  </span>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {row.description}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {row.shortLabel}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium text-zinc-950 dark:text-zinc-50">
                  {formatPrice(row.priceCents)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {priceSource === "justtcg" ? (
        <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Live market prices from JustTCG by condition (NM → DMG).
        </p>
      ) : null}
    </div>
  );
}
