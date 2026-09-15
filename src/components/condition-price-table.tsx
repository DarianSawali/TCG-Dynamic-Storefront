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
    <div className="overflow-hidden rounded-xl border border-[#625253]">
      <table className="w-full text-left text-sm">
        <thead className="bg-pokedex-deep/45 text-xs uppercase tracking-wide text-pokedex-muted">
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
                    ? "bg-pokedex/10 dark:bg-pokedex-deep/30"
                    : "bg-[#1d1d1f]"
                }
              >
                <td className="px-3 py-2.5">
                  <span className="font-medium text-pokedex-cream">
                    {row.label}
                  </span>
                  <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
                    {row.description}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {row.shortLabel}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium text-pokedex-cream">
                  {formatPrice(row.priceCents)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {priceSource === "justtcg" ? (
        <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Latest synced market pricing from JustTCG.
        </p>
      ) : null}
    </div>
  );
}
