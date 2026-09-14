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
/** Picked card : grid = 1 : 5 → detail is 1/6 of the row. */
const DETAIL_FLEX = 1;
const GRID_FLEX = 5;
const MIN_DETAIL_HEIGHT = 200;
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
    <div className="flex h-full min-h-48 flex-col items-center px-4 py-5 sm:px-6 lg:py-8">
      <h2 className="text-center font-mono text-sm font-medium tracking-wide text-zinc-100 sm:text-base">
        {card.name}
      </h2>

      <div className="relative mt-5 aspect-[5/7] w-full max-w-[10rem] overflow-hidden border border-dashed border-zinc-600 bg-zinc-950/60 lg:mt-6 lg:max-w-[11rem]">
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

      <div className="mt-5 space-y-1 text-center font-mono text-xs text-zinc-400 lg:mt-6">
        <p>
          {card.setName} · #{card.collectorNumber}
        </p>
        {card.rarity ? <p className="text-zinc-300">{card.rarity}</p> : null}
        <p className="pt-1 text-sm text-zinc-100">
          NM {formatPrice(card.marketPriceCents)}
        </p>
      </div>

      <Link
        href={`/cards/${card.slug}`}
        className="mt-auto inline-flex w-full max-w-[12rem] items-center justify-center border border-zinc-500 bg-zinc-950 px-3 py-2.5 font-mono text-xs tracking-wide text-zinc-100 transition-colors hover:border-zinc-300 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      >
        [ VIEW CARD ]
      </Link>
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
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
        filled
          ? "border-zinc-400 bg-zinc-900/80 hover:border-zinc-200"
          : "border-zinc-700 bg-transparent hover:border-zinc-500",
        selected
          ? "scale-[1.03] border-violet-300 shadow-[0_0_0_1px_rgba(196,181,253,0.7),0_0_18px_-4px_rgba(167,139,250,0.55)]"
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

  const [detailHeight, setDetailHeight] = useState(320);
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
      if (isLarge) return;
      event.preventDefault();
      const body = bodyRef.current;
      if (!body) return;

      const rect = body.getBoundingClientRect();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);

      const onMove = (moveEvent: PointerEvent) => {
        const maxDetail = Math.max(
          MIN_DETAIL_HEIGHT,
          rect.height - MIN_GRID_HEIGHT,
        );
        const next = moveEvent.clientY - rect.top;
        setDetailHeight(clamp(next, MIN_DETAIL_HEIGHT, maxDetail));
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
      <section className="rounded-2xl border border-dashed border-zinc-600 bg-zinc-950 px-6 py-16 text-center font-mono text-sm text-zinc-500">
        No cards in this box yet.
      </section>
    );
  }

  return (
    <section
      aria-label={`${boxTitle} PC box`}
      className="overflow-hidden rounded-2xl border border-zinc-600 bg-zinc-950 text-zinc-100 shadow-[0_0_0_1px_rgba(63,63,70,0.8)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-dashed border-zinc-600 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={() => goToBox(safeBoxIndex - 1)}
          disabled={!canPage}
          aria-label="Previous box — see more cards"
          className="flex size-9 shrink-0 items-center justify-center border border-zinc-600 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-zinc-600 disabled:hover:text-zinc-300"
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
          className="flex size-9 shrink-0 items-center justify-center border border-zinc-600 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-zinc-600 disabled:hover:text-zinc-300"
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
                  flexGrow: DETAIL_FLEX,
                  flexShrink: 1,
                  flexBasis: 0,
                  height: "100%",
                }
              : { height: detailHeight, flexShrink: 0 }
          }
        >
          <DetailPanel card={selectedCard} />
        </div>

        <div
          role="separator"
          aria-orientation={isLarge ? "vertical" : "horizontal"}
          aria-valuemin={isLarge ? undefined : MIN_DETAIL_HEIGHT}
          aria-valuemax={isLarge ? undefined : 600}
          aria-valuenow={isLarge ? undefined : Math.round(detailHeight)}
          aria-label={
            isLarge
              ? "Detail and grid split (1 to 5)"
              : "Resize detail and grid panes"
          }
          tabIndex={isLarge ? undefined : 0}
          onPointerDown={onResizePointerDown}
          onKeyDown={
            isLarge
              ? undefined
              : (event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setDetailHeight((h) => Math.max(MIN_DETAIL_HEIGHT, h - 16));
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setDetailHeight((h) => h + 16);
                  }
                }
          }
          className={[
            "group relative z-10 flex shrink-0 items-center justify-center",
            "border-dashed border-zinc-600 bg-zinc-950",
            isLarge
              ? "w-3 cursor-default border-x"
              : "h-3 cursor-row-resize touch-none border-y hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-400",
            dragging ? "bg-zinc-900" : "",
          ].join(" ")}
        >
          <span
            aria-hidden
            className={[
              "rounded-full bg-zinc-600",
              isLarge ? "h-8 w-px bg-zinc-500" : "h-0.5 w-8 bg-zinc-500 group-hover:bg-violet-300 group-focus-visible:bg-violet-300",
              dragging ? "bg-violet-300" : "",
            ].join(" ")}
          />
        </div>

        <div
          className="@container flex h-full min-h-0 min-w-0 flex-col p-4 sm:p-5"
          style={
            isLarge
              ? { flexGrow: GRID_FLEX, flexShrink: 1, flexBasis: 0 }
              : { flex: 1 }
          }
        >
          <div
            className="grid flex-1 content-start grid-cols-3 gap-2 @min-[240px]:grid-cols-4 @min-[340px]:grid-cols-5 @min-[440px]:grid-cols-6 sm:gap-2.5"
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
