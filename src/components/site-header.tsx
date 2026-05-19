"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

const navLinkClass =
  "group relative inline-flex text-sm font-medium text-violet-200/85 transition-[color,transform] duration-200 ease-out hover:text-violet-50 active:scale-[0.96] motion-reduce:transition-colors motion-reduce:active:scale-100";

const navUnderlineClass =
  "pointer-events-none absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-linear-to-r from-violet-400 via-fuchsia-400 to-violet-400 opacity-90 shadow-[0_0_10px_rgba(167,139,250,0.6)] transition-transform duration-300 ease-out group-hover:scale-x-100 group-active:scale-x-90 motion-reduce:transition-none";

const cartLinkClass =
  "group relative flex size-9 shrink-0 items-center justify-center rounded-lg text-violet-200/90 transition-[color,transform,background-color,box-shadow] duration-200 ease-out hover:bg-violet-500/15 hover:text-violet-50 hover:shadow-[0_0_18px_-4px_rgba(167,139,250,0.5)] active:scale-[0.92] motion-reduce:transition-colors motion-reduce:hover:shadow-none motion-reduce:active:scale-100";

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

export function SiteHeader() {
  const { itemCount } = useCart();

  return (
    <header className="border-b border-violet-500/25 bg-zinc-950 shadow-[0_1px_0_0_rgba(139,92,246,0.12)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="group relative text-base font-semibold tracking-tight transition-[transform,filter] duration-300 ease-out hover:scale-[1.03] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100 motion-reduce:transition-none"
        >
          <span className="relative z-10 inline-flex items-baseline drop-shadow-[0_0_0_rgba(139,92,246,0)] transition-[filter] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(167,139,250,0.55)] motion-reduce:group-hover:drop-shadow-none">
            <span className="text-white transition-colors duration-300 group-hover:text-violet-100">
              Poke
            </span>
            <span className="bg-linear-to-r from-violet-300 via-fuchsia-400 to-violet-300 bg-size-[200%_100%] bg-clip-text text-transparent motion-safe:animate-[pokecell-cell-shimmer_4s_linear_infinite] group-hover:brightness-110">
              Cell
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-7 sm:gap-8" aria-label="Main">
          {mainNav.map(({ href, label }) => (
            <Link key={href} href={href} className={navLinkClass}>
              <span className="relative z-10">{label}</span>
              <span aria-hidden className={navUnderlineClass} />
            </Link>
          ))}
          <Link
            href="/cart"
            aria-label="Shopping cart"
            className={cartLinkClass}
          >
            <CartIcon className="size-4 transition-transform duration-200 group-hover:-translate-y-px group-active:translate-y-0 motion-reduce:group-hover:translate-y-0" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold leading-4 text-white shadow-[0_0_10px_rgba(217,70,239,0.7)]">
                {itemCount}
              </span>
            ) : null}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-0.5 left-1/2 h-[2px] w-4/5 max-w-4 -translate-x-1/2 origin-center scale-x-0 rounded-full bg-linear-to-r from-violet-400 via-fuchsia-400 to-violet-400 opacity-90 shadow-[0_0_8px_rgba(167,139,250,0.55)] transition-transform duration-300 ease-out group-hover:scale-x-100 group-active:scale-x-75 motion-reduce:transition-none"
            />
          </Link>
          <Link
            href="/admin"
            className="group relative overflow-hidden rounded-md border border-violet-500/50 bg-violet-950/45 px-2.5 py-1 text-sm font-medium text-violet-100 shadow-none transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out hover:border-violet-400/80 hover:bg-violet-900/55 hover:text-white hover:shadow-[0_0_22px_-4px_rgba(167,139,250,0.65)] active:scale-[0.94] motion-reduce:transition-colors motion-reduce:hover:shadow-none motion-reduce:active:scale-100"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-violet-400/25 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full"
            />
            <span className="relative z-10">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
