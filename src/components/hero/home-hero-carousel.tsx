"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type HeroSlide = {
  id: string;
  /** Optional banner under `public/hero/…` — gradient used when missing */
  imageSrc?: string | null;
  gradient: string;
  label: string;
  headline: string;
};

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "umbreon",
    imageSrc: "/hero/umbreon.jpg",
    gradient: "from-indigo-950 via-violet-900 to-zinc-950",
    label: "Umbreon",
    headline: "Night market energy.",
  },
  {
    id: "rayquaza",
    imageSrc: "/hero/rayquaza.jpg",
    gradient: "from-emerald-800 via-rose-800 to-zinc-950",
    label: "Rayquaza",
    headline: "Sky-high pulls, grounded prices.",
  },
  {
    id: "lugia",
    imageSrc: "/hero/lugia.jpg",
    gradient: "from-slate-800 via-teal-900 to-zinc-950",
    label: "Lugia",
    headline: "Storm in — browse the boxes.",
  },
  {
    id: "leafeon",
    imageSrc: "/hero/leafeon.jpg",
    gradient: "from-lime-800 via-emerald-900 to-zinc-950",
    label: "Leafeon",
    headline: "Fresh stock, carefully curated.",
  },
  {
    id: "giratina",
    imageSrc: "/hero/giratina.jpg",
    gradient: "from-red-950 via-amber-900 to-zinc-950",
    label: "Giratina",
    headline: "Alternate art. Same obsession.",
  },
];

const INTERVAL_MS = 7000;

type HomeHeroCarouselProps = {
  slides?: HeroSlide[];
};

export function HomeHeroCarousel({
  slides = DEFAULT_SLIDES,
}: HomeHeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [entered, setEntered] = useState(false);

  const count = slides.length;
  const active = slides[index] ?? slides[0];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, count]);

  const goTo = useCallback((next: number) => {
    setIndex((next + count) % count);
  }, [count]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured sets"
      className="relative isolate min-h-[min(78vh,40rem)] w-full overflow-hidden bg-zinc-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => {
        const isActive = i === index;
        const showImage = Boolean(slide.imageSrc) && !failedImages[slide.id];

        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={[
              "absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none",
              isActive ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <div
              className={[
                "absolute inset-0 bg-linear-to-br",
                slide.gradient,
              ].join(" ")}
            />
            {showImage && slide.imageSrc ? (
              <Image
                src={slide.imageSrc}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className={[
                  "object-cover",
                  isActive && !reduceMotion
                    ? "motion-safe:animate-[hero-ken-burns_8s_ease-out_forwards]"
                    : "scale-100",
                ].join(" ")}
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [slide.id]: true }))
                }
              />
            ) : null}
            {/* Readability scrim — not a floating badge */}
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/25"
            />
          </div>
        );
      })}

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[min(78vh,40rem)] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:px-6 sm:pb-16">
        <div
          className={[
            "max-w-xl space-y-4 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
            entered
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
          ].join(" ")}
        >
          <p className="font-mono text-[11px] tracking-[0.28em] text-violet-300/90 uppercase">
            PokeCell
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {active?.headline ?? "Your boxes are ready."}
          </h1>
          <p
            className={[
              "max-w-md text-base text-zinc-300 transition-opacity duration-500 delay-100 motion-reduce:transition-none",
              entered ? "opacity-100" : "opacity-0 motion-reduce:opacity-100",
            ].join(" ")}
          >
            Focused English inventory: 151, Phantasmal Flames, and Ascended
            Heroes. Open the catalog or shop live listings.
          </p>
          <div
            className={[
              "flex flex-wrap gap-3 pt-2 transition-[opacity,transform] duration-700 delay-150 ease-out motion-reduce:transition-none",
              entered
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            ].join(" ")}
          >
            <Link
              href="/cards"
              className="inline-flex items-center justify-center rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-400"
            >
              Explore catalog
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
            >
              Shop
            </Link>
          </div>
        </div>

        {/* Dots + set label */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
            {active?.label}
            <span className="text-zinc-600">
              {" "}
              · {index + 1}/{count}
            </span>
          </p>
          <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${slide.label}`}
                onClick={() => goTo(i)}
                className={[
                  "h-1.5 rounded-full transition-[width,background-color] duration-300",
                  i === index
                    ? "w-8 bg-violet-400"
                    : "w-1.5 bg-white/35 hover:bg-white/55",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
