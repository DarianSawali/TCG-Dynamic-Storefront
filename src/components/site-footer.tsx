import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#625253]/60 bg-[#181719]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-pokedex-muted">
          Pokémon and related assets are trademarks of Nintendo, Creatures
          Inc., and GAME FREAK inc.
        </p>
        <div className="flex gap-6 text-sm">
          <Link
            href="/cards"
            className="text-pokedex-muted hover:text-pokedex-bright"
          >
            Explore
          </Link>
          <Link
            href="/shop"
            className="text-pokedex-muted hover:text-pokedex-bright"
          >
            Shop
          </Link>
        </div>
      </div>
    </footer>
  );
}
