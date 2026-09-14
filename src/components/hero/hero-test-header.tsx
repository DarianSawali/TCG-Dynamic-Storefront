"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkBase =
  "group relative inline-flex text-sm font-medium transition-[color,transform] duration-200 ease-out active:scale-[0.96] motion-reduce:transition-colors motion-reduce:active:scale-100";

const underlineBase =
  "pointer-events-none absolute -bottom-1 left-0 h-[2px] w-full origin-left rounded-full bg-pokedex opacity-90 shadow-[0_0_10px_rgba(223,90,72,0.6)] transition-transform duration-300 ease-out motion-reduce:transition-none";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.41L23 6H6" />
    </svg>
  );
}

const mainNav = [
  { href: "/cards", label: "Explore" },
  { href: "/shop", label: "Shop" },
] as const;

type HeroTestHeaderProps = {
  cartCount?: number;
};

/** Prototype solid dock nav — not wired into the live store layout yet. */
export function HeroTestHeader({ cartCount = 0 }: HeroTestHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-pokedex/35 bg-zinc-950 shadow-[0_1px_0_0_rgba(223,90,72,0.18)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/hero-test"
          className="group relative text-base font-semibold tracking-tight transition-[transform,filter] duration-300 ease-out hover:scale-[1.03] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100 motion-reduce:transition-none"
        >
          <span className="relative z-10 inline-flex items-baseline transition-[filter] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(167,139,250,0.55)] motion-reduce:group-hover:drop-shadow-none">
            <span className="text-white transition-colors duration-300 group-hover:text-pokedex-cream">
              Poke
            </span>
            <span className="text-pokedex-bright group-hover:brightness-110">
              Cell
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-7 sm:gap-8" aria-label="Main prototype">
          {mainNav.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  navLinkBase,
                  active ? "text-pokedex-bright" : "text-pokedex-muted hover:text-pokedex-cream",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative z-10">{label}</span>
                <span
                  aria-hidden
                  className={[
                    underlineBase,
                    active
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100 group-active:scale-x-90",
                  ].join(" ")}
                />
              </Link>
            );
          })}

          <Link
            href="/shopify-cart"
            aria-label={`Cart with ${cartCount} items`}
            className="group relative flex size-9 shrink-0 items-center justify-center rounded-lg text-pokedex-muted transition-[color,transform,background-color,box-shadow] duration-200 ease-out hover:bg-pokedex/15 hover:text-pokedex-bright hover:shadow-[0_0_18px_-4px_rgba(223,90,72,0.5)] active:scale-[0.92] motion-reduce:transition-colors motion-reduce:hover:shadow-none motion-reduce:active:scale-100"
          >
            <CartIcon className="size-4 transition-transform duration-200 group-hover:-translate-y-px motion-reduce:group-hover:translate-y-0" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-pokedex px-1 text-[10px] font-semibold leading-4 text-white shadow-[0_0_10px_rgba(223,90,72,0.7)]">
                {cartCount}
              </span>
            ) : null}
          </Link>

          <Link
            href="/admin"
            className="rounded-md border border-pokedex/35 bg-transparent px-2 py-1 text-xs font-medium text-pokedex-muted transition-colors hover:border-pokedex/60 hover:text-pokedex-bright"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
