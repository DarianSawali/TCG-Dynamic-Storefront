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
    <nav
      aria-label="Set boxes"
      className="flex flex-wrap gap-2 border border-dashed border-zinc-600 bg-zinc-950/80 p-2"
    >
      <Link href="/cards" className={tabClass(allActive)}>
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
          <Link
            key={`${set.code}-${set.locale}`}
            href={href}
            className={tabClass(active)}
          >
            {label}
            {showLocaleBadge(set.locale) ? (
              <span className="ml-1.5 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-bold dark:bg-white/10">
                {localeBadge(set.locale)}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function tabClass(active: boolean): string {
  return [
    "inline-flex items-center border px-3 py-2 font-mono text-xs font-medium tracking-wide uppercase transition sm:text-sm",
    active
      ? "border-violet-400/80 bg-violet-950/70 text-violet-100 shadow-[0_0_16px_-6px_rgba(167,139,250,0.65)]"
      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
  ].join(" ");
}
