"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { CatalogCardWithPricing } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";
import {
  chunkIntoBoxes,
  sortCatalogForExplore,
} from "@/lib/collector-number";

const SLOT_COUNT = 24;
/** Initial desktop split; users can drag between the bounded ratios below. */
const DEFAULT_DETAIL_RATIO = 0.34;
const MIN_DETAIL_RATIO = 0.22;
const MAX_DETAIL_RATIO = 0.62;
const MIN_DETAIL_HEIGHT = 280;
const MIN_GRID_HEIGHT = 180;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatBoxLabel(boxNumber: number, title: string) {
  return `BOX ${String(boxNumber).padStart(2, "0")} – ${title}`;
}

function DetailPanel({ card }: { card: CatalogCardWithPricing | null }) {
  if (!card) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-4 text-center text-zinc-500">
        <p className="font-mono text-xs tracking-widest uppercase">Empty slot</p>
        <p className="max-w-[14rem] font-mono text-[11px] leading-relaxed text-zinc-600">
          Select a filled cell to inspect a card in this set.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-48 flex-col px-4 py-4 sm:px-6 sm:py-5 lg:items-center lg:py-8">
      <h2 className="text-center font-mono text-sm font-medium tracking-wide text-zinc-100 sm:text-base">
        {card.name}
      </h2>

      <div className="mt-4 flex min-h-0 w-full flex-1 flex-col items-center justify-center sm:flex-row sm:gap-6 lg:flex-col lg:justify-start lg:gap-0">
        <div className="relative aspect-[5/7] w-full max-w-28 shrink-0 overflow-hidden border border-[#625253] bg-[#29282a] sm:max-w-32 md:max-w-36 lg:mt-2 lg:max-w-[11rem]">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              className="object-contain p-1"
              sizes="176px"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-linear-to-br font-mono text-[10px] tracking-widest text-white/50 uppercase ${card.gradient}`}
            >
              #{card.collectorNumber}
            </div>
          )}
        </div>

        <div className="mt-3 flex min-w-0 flex-col items-center text-center sm:mt-0 lg:mt-5 lg:w-full">
          <div className="space-y-1 font-mono text-[11px] text-zinc-400 sm:text-xs">
            <p className="break-words">
              {card.setName} · #{card.collectorNumber}
            </p>
            {card.rarity ? <p className="text-zinc-300">{card.rarity}</p> : null}
            <p className="pt-1 text-sm text-zinc-100">
              NM market {formatPrice(card.marketPriceCents)}
            </p>
            <p className="text-[10px] text-zinc-500">
              {card.priceSource === "justtcg" ? "Synced · JustTCG" : "Price unavailable"}
            </p>
          </div>

          <Link
            href={`/cards/${card.slug}`}
            className="mt-4 inline-flex w-full max-w-[12rem] items-center justify-center border border-zinc-500 bg-zinc-950 px-3 py-2.5 font-mono text-[11px] tracking-wide text-zinc-100 transition-colors hover:border-pokedex hover:text-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex sm:text-xs lg:mt-6"
          >
            [ VIEW CARD ]
          </Link>
        </div>
      </div>
    </div>
  );
}

function SlotCell({
  card,
  selected,
  onSelect,
  index,
}: {
  card: CatalogCardWithPricing | null;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const filled = card !== null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={
        filled
          ? `Slot ${index + 1}: ${card.name}, #${card.collectorNumber}`
          : `Empty slot ${index + 1}`
      }
      aria-pressed={selected}
      className={[
        "relative aspect-square overflow-hidden border transition-[border-color,background-color,box-shadow,transform] duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex",
        filled
          ? "border-[#625253] bg-[#29282a] hover:border-pokedex/70"
          : "border-[#4b4142] bg-[#171719] hover:border-[#625253]",
        selected
          ? "scale-[1.03] border-pokedex-bright shadow-[0_0_0_1px_rgba(255,121,101,0.7),0_0_18px_-4px_rgba(223,90,72,0.55)]"
          : "",
      ].join(" ")}
    >
      {filled ? (
        card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt=""
            fill
            className="object-contain p-0.5"
            sizes="(max-width: 640px) 28vw, 80px"
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-0.5 p-1 font-mono text-[8px] leading-tight text-zinc-300 @[280px]:text-[9px]">
            <span className="line-clamp-2 text-center">{card.name.split(" ")[0]}</span>
            <span className="text-zinc-500">#{card.collectorNumber}</span>
          </span>
        )
      ) : null}
    </button>
  );
}

type ExplorePcBoxProps = {
  cards: CatalogCardWithPricing[];
  /** Active set label for the box header (e.g. "151"), or "ALL SETS". */
  boxTitle: string;
};

export function ExplorePcBox({ cards, boxTitle }: ExplorePcBoxProps) {
  const ordered = useMemo(() => sortCatalogForExplore(cards), [cards]);
  const boxes = useMemo(
    () => chunkIntoBoxes(ordered, SLOT_COUNT),
    [ordered],
  );

  const [boxIndex, setBoxIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(0);

  const [detailRatio, setDetailRatio] = useState(DEFAULT_DETAIL_RATIO);
  const [detailHeight, setDetailHeight] = useState(400);
  const [isLarge, setIsLarge] = useState(false);
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLarge(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const safeBoxIndex = Math.min(boxIndex, Math.max(0, boxes.length - 1));
  const currentBox = useMemo(
    () => boxes[safeBoxIndex] ?? [],
    [boxes, safeBoxIndex],
  );

  const slots = useMemo(() => {
    const next: (CatalogCardWithPricing | null)[] = [...currentBox];
    while (next.length < SLOT_COUNT) next.push(null);
    return next;
  }, [currentBox]);

  const selectedCard = slots[selectedSlot] ?? null;
  const canPage = boxes.length > 1;

  function goToBox(nextIndex: number) {
    if (boxes.length === 0) return;
    const wrapped = (nextIndex + boxes.length) % boxes.length;
    setBoxIndex(wrapped);
    setSelectedSlot(0);
  }

  /** Vertical resize only on stacked (mobile) layout; desktop stays locked 1:5. */
  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const body = bodyRef.current;
      if (!body) return;

      const rect = body.getBoundingClientRect();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);

      const onMove = (moveEvent: PointerEvent) => {
        if (isLarge) {
          const next = (moveEvent.clientX - rect.left) / rect.width;
          setDetailRatio(clamp(next, MIN_DETAIL_RATIO, MAX_DETAIL_RATIO));
        } else {
          const maxDetail = Math.max(
            MIN_DETAIL_HEIGHT,
            rect.height - MIN_GRID_HEIGHT,
          );
          const next = moveEvent.clientY - rect.top;
          setDetailHeight(clamp(next, MIN_DETAIL_HEIGHT, maxDetail));
        }
      };

      const onUp = () => {
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [isLarge],
  );

  if (ordered.length === 0) {
    return (
      <section className="rounded-2xl border border-[#625253] bg-[#1d1d1f] px-6 py-16 text-center font-mono text-sm text-pokedex-muted">
        No cards in this box yet.
      </section>
    );
  }

  return (
    <section
      aria-label={`${boxTitle} PC box`}
      className="overflow-hidden rounded-2xl border border-[#625253] bg-[#1d1d1f] text-pokedex-cream shadow-[0_18px_50px_-30px_rgba(223,90,72,0.7)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#625253] bg-pokedex-deep/45 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={() => goToBox(safeBoxIndex - 1)}
          disabled={!canPage}
          aria-label="Previous box — see more cards"
          className="flex size-9 shrink-0 items-center justify-center border border-zinc-600 font-mono text-sm text-zinc-300 transition-colors hover:border-pokedex hover:text-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-zinc-600 disabled:hover:text-zinc-300"
        >
          ◀
        </button>
        <div className="min-w-0 text-center">
          <h2 className="truncate font-mono text-xs tracking-[0.12em] text-zinc-100 uppercase sm:text-sm">
            {formatBoxLabel(safeBoxIndex + 1, boxTitle)}
          </h2>
          {canPage ? (
            <p className="mt-1 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              {safeBoxIndex + 1} / {boxes.length} · see more
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => goToBox(safeBoxIndex + 1)}
          disabled={!canPage}
          aria-label="Next box — see more cards"
          className="flex size-9 shrink-0 items-center justify-center border border-zinc-600 font-mono text-sm text-zinc-300 transition-colors hover:border-pokedex hover:text-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-zinc-600 disabled:hover:text-zinc-300"
        >
          ▶
        </button>
      </header>

      <div
        ref={bodyRef}
        className={[
          "flex min-h-[28rem] w-full",
          isLarge ? "flex-row" : "flex-col",
          dragging ? "select-none" : "",
        ].join(" ")}
      >
        <div
          className="min-h-0 min-w-0 overflow-hidden"
          style={
            isLarge
              ? {
                  width: `${detailRatio * 100}%`,
                  flexShrink: 0,
                }
              : { height: detailHeight, flexShrink: 0 }
          }
        >
          <DetailPanel card={selectedCard} />
        </div>

        <div
          role="separator"
          aria-orientation={isLarge ? "vertical" : "horizontal"}
          aria-valuemin={isLarge ? MIN_DETAIL_RATIO * 100 : MIN_DETAIL_HEIGHT}
          aria-valuemax={isLarge ? MAX_DETAIL_RATIO * 100 : 600}
          aria-valuenow={
            isLarge ? Math.round(detailRatio * 100) : Math.round(detailHeight)
          }
          aria-label="Resize detail and grid panes"
          tabIndex={0}
          onPointerDown={onResizePointerDown}
          onKeyDown={(event) => {
            const ratioStep = event.shiftKey ? 0.04 : 0.02;
            if (isLarge) {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                setDetailRatio((ratio) =>
                  clamp(ratio - ratioStep, MIN_DETAIL_RATIO, MAX_DETAIL_RATIO),
                );
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                setDetailRatio((ratio) =>
                  clamp(ratio + ratioStep, MIN_DETAIL_RATIO, MAX_DETAIL_RATIO),
                );
              }
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setDetailHeight((height) =>
                Math.max(MIN_DETAIL_HEIGHT, height - 16),
              );
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setDetailHeight((height) => height + 16);
            }
          }}
          className={[
            "group relative z-10 flex shrink-0 touch-none items-center justify-center border-[#625253] bg-[#181719] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-pokedex",
            isLarge
              ? "w-3 cursor-col-resize border-x hover:bg-[#29282a]"
              : "h-3 cursor-row-resize border-y hover:bg-[#29282a]",
            dragging ? "bg-[#29282a]" : "",
          ].join(" ")}
        >
          <span
            aria-hidden
            className={[
              "rounded-full bg-zinc-600",
              isLarge ? "h-8 w-px bg-zinc-500" : "h-0.5 w-8 bg-zinc-500 group-hover:bg-pokedex-bright group-focus-visible:bg-pokedex-bright",
              dragging ? "bg-pokedex-bright" : "",
            ].join(" ")}
          />
        </div>

        <div
          className="@container flex h-full min-h-0 min-w-0 flex-col p-4 sm:p-5"
          style={{ flex: 1 }}
        >
          <div
            className="grid flex-1 content-start grid-cols-3 gap-2 @min-[340px]:grid-cols-4 @min-[480px]:grid-cols-5 @min-[600px]:grid-cols-6 @min-[720px]:gap-3"
            role="listbox"
            aria-label={`Cards in ${boxTitle}, ordered by set number`}
          >
            {slots.map((card, index) => (
              <SlotCell
                key={card?.slug ?? `empty-${safeBoxIndex}-${index}`}
                card={card}
                index={index}
                selected={index === selectedSlot}
                onSelect={() => setSelectedSlot(index)}
              />
            ))}
          </div>

          <p className="mt-auto pt-6 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            {currentBox.length}/{SLOT_COUNT} in this box · {ordered.length}{" "}
            total · sorted by #
          </p>
        </div>
      </div>
    </section>
  );
}
