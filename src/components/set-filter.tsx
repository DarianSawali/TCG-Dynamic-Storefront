import Link from "next/link";
import {
  getVisibleStoreSets,
  localeBadge,
  showLocaleBadge,
  type CardLocale,
} from "@/lib/sets";

type SetFilterProps = {
  activeSetCode?: string;
  activeLocale?: CardLocale;
};

export function SetFilter({ activeSetCode, activeLocale }: SetFilterProps) {
  const allActive = !activeSetCode && !activeLocale;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/cards"
        className={filterClass(allActive)}
      >
        All sets
      </Link>
      {getVisibleStoreSets().map((set) => {
        const active =
          activeSetCode === set.code &&
          (activeLocale == null || activeLocale === set.locale);
        const href = showLocaleBadge(set.locale)
          ? `/cards?set=${encodeURIComponent(set.code)}&locale=${set.locale}`
          : `/cards?set=${encodeURIComponent(set.code)}`;
        const label =
          set.locale === "ja" && set.nameJa
            ? `${set.name} · ${set.nameJa}`
            : set.name;

        return (
          <Link key={`${set.code}-${set.locale}`} href={href} className={filterClass(active)}>
            {label}
            {showLocaleBadge(set.locale) ? (
              <span className="ml-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold dark:bg-white/10">
                {localeBadge(set.locale)}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function filterClass(active: boolean): string {
  return [
    "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition",
    active
      ? "border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-600"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600",
  ].join(" ");
}
