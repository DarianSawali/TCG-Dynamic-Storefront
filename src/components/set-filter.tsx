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
      className="grid grid-cols-1 gap-2 border border-[#625253] bg-[#1d1d1f] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] min-[360px]:grid-cols-2 sm:flex sm:flex-wrap"
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
    "inline-flex min-w-0 items-center justify-center border px-3 py-2 text-center font-mono text-xs leading-tight font-medium tracking-wide uppercase transition sm:shrink-0 sm:justify-start sm:whitespace-nowrap sm:text-sm",
    active
      ? "border-pokedex bg-pokedex-deep/80 text-pokedex-bright shadow-[0_0_16px_-7px_rgba(223,90,72,0.65)]"
      : "border-[#625253] bg-[#29282a] text-pokedex-muted hover:border-pokedex/70 hover:text-pokedex-cream",
  ].join(" ");
}
