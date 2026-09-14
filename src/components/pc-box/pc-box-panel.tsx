"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  MOCK_PC_BOXES,
  firstFilledSlotIndex,
  type PcBoxCard,
} from "@/components/pc-box/mock-boxes";

const SLOT_COUNT = 24;
const DEFAULT_DETAIL_RATIO = 0.42;
const MIN_DETAIL_RATIO = 0.28;
const MAX_DETAIL_RATIO = 0.62;
const MIN_DETAIL_HEIGHT = 200;
const MIN_GRID_HEIGHT = 180;

function formatBoxLabel(index: number, title: string) {
  return `BOX ${String(index).padStart(2, "0")} – ${title}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DetailPanel({ card }: { card: PcBoxCard | null }) {
  if (!card) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-4 text-center text-zinc-500">
        <p className="font-mono text-xs tracking-widest uppercase">Empty slot</p>
        <p className="max-w-[14rem] font-mono text-[11px] leading-relaxed text-zinc-600">
          Select a filled cell to inspect a card.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-48 flex-col items-center px-4 py-5 sm:px-6">
      <h2 className="font-mono text-sm font-medium tracking-wide text-zinc-100 sm:text-base">
        {card.name}
      </h2>

      <div className="mt-5 flex aspect-[5/7] w-full max-w-[11rem] items-center justify-center border border-[#625253] bg-[#29282a] font-mono text-[10px] tracking-widest text-pokedex-muted uppercase">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-contain"
          />
        ) : (
          "[ CARD IMAGE ]"
        )}
      </div>

      <div className="mt-5 space-y-1 text-center font-mono text-xs text-zinc-400">
        <p>{card.set}</p>
        <p className="text-zinc-300">{card.rarity}</p>
        <p className="pt-1 text-sm text-zinc-100">{card.price}</p>
      </div>

      <button
        type="button"
        className="mt-auto w-full max-w-[14rem] border border-zinc-500 bg-zinc-950 px-3 py-2.5 font-mono text-xs tracking-wide text-zinc-100 transition-colors hover:border-pokedex hover:text-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex"
      >
        [ ADD TO CART ]
      </button>
    </div>
  );
}

function SlotCell({
  card,
  selected,
  onSelect,
  index,
}: {
  card: PcBoxCard | null;
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
        filled ? `Slot ${index + 1}: ${card.name}` : `Empty slot ${index + 1}`
      }
      aria-pressed={selected}
      className={[
        "aspect-square border transition-[border-color,background-color,box-shadow,transform] duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex",
        filled
          ? "border-[#625253] bg-[#29282a] hover:border-pokedex/70"
          : "border-[#4b4142] bg-[#171719] hover:border-[#625253]",
        selected
          ? "border-pokedex-bright shadow-[0_0_0_1px_rgba(255,121,101,0.7),0_0_18px_-4px_rgba(223,90,72,0.55)] scale-[1.03]"
          : "",
      ].join(" ")}
    >
      {filled ? (
        <span className="flex h-full items-center justify-center p-1 font-mono text-[8px] leading-tight text-zinc-300 @[280px]:text-[9px] @[400px]:text-[10px]">
          {card.name.split(" ")[0]}
        </span>
      ) : null}
    </button>
  );
}

export function PcBoxPanel() {
  const [boxIndex, setBoxIndex] = useState(0);
  const box = MOCK_PC_BOXES[boxIndex] ?? MOCK_PC_BOXES[0];
  const [selectedSlot, setSelectedSlot] = useState(() =>
    firstFilledSlotIndex(MOCK_PC_BOXES[0]),
  );

  /** Desktop: detail column width as % of body. Mobile: detail pane height in px. */
  const [detailRatio, setDetailRatio] = useState(DEFAULT_DETAIL_RATIO);
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

  const slots = useMemo(() => {
    const next = [...box.slots];
    while (next.length < SLOT_COUNT) next.push(null);
    return next.slice(0, SLOT_COUNT);
  }, [box]);

  const selectedCard = slots[selectedSlot] ?? null;

  function goToBox(nextIndex: number) {
    const wrapped = (nextIndex + MOCK_PC_BOXES.length) % MOCK_PC_BOXES.length;
    const nextBox = MOCK_PC_BOXES[wrapped];
    setBoxIndex(wrapped);
    setSelectedSlot(firstFilledSlotIndex(nextBox));
  }

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const body = bodyRef.current;
      if (!body) return;

      const rect = body.getBoundingClientRect();
      const pointerId = event.pointerId;
      event.currentTarget.setPointerCapture(pointerId);
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

  return (
    <section
      aria-label="PC box layout prototype"
      className="overflow-hidden rounded-2xl border border-[#625253] bg-[#1d1d1f] text-pokedex-cream shadow-[0_18px_50px_-30px_rgba(223,90,72,0.7)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#625253] bg-pokedex-deep/45 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={() => goToBox(boxIndex - 1)}
          aria-label="Previous box"
          className="flex size-9 shrink-0 items-center justify-center border border-zinc-600 font-mono text-sm text-zinc-300 transition-colors hover:border-pokedex hover:text-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex"
        >
          ◀
        </button>
        <h1 className="min-w-0 truncate text-center font-mono text-xs tracking-[0.12em] text-zinc-100 uppercase sm:text-sm">
          {formatBoxLabel(box.index, box.title)}
        </h1>
        <button
          type="button"
          onClick={() => goToBox(boxIndex + 1)}
          aria-label="Next box"
          className="flex size-9 shrink-0 items-center justify-center border border-zinc-600 font-mono text-sm text-zinc-300 transition-colors hover:border-pokedex hover:text-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex"
        >
          ▶
        </button>
      </header>

      <div
        ref={bodyRef}
        className={[
          "flex min-h-[28rem]",
          isLarge ? "flex-row" : "flex-col",
          dragging ? "select-none" : "",
        ].join(" ")}
      >
        <div
          className="min-w-0 overflow-hidden"
          style={
            isLarge
              ? { width: `${detailRatio * 100}%`, flexShrink: 0 }
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
            const step = event.shiftKey ? 0.04 : 0.02;
            if (isLarge) {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                setDetailRatio((r) =>
                  clamp(r - step, MIN_DETAIL_RATIO, MAX_DETAIL_RATIO),
                );
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                setDetailRatio((r) =>
                  clamp(r + step, MIN_DETAIL_RATIO, MAX_DETAIL_RATIO),
                );
              }
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setDetailHeight((h) => Math.max(MIN_DETAIL_HEIGHT, h - 16));
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setDetailHeight((h) => h + 16);
            }
          }}
          className={[
            "group relative z-10 flex shrink-0 items-center justify-center touch-none",
            "bg-zinc-950 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-pokedex",
            isLarge
              ? "w-3 cursor-col-resize border-x border-[#625253]"
              : "h-3 cursor-row-resize border-y border-[#625253]",
            dragging ? "bg-zinc-900" : "",
          ].join(" ")}
        >
          <span
            aria-hidden
            className={[
              "rounded-full bg-zinc-500 transition-colors group-hover:bg-pokedex-bright group-focus-visible:bg-pokedex-bright",
              isLarge ? "h-8 w-0.5" : "h-0.5 w-8",
              dragging ? "bg-pokedex-bright" : "",
            ].join(" ")}
          />
        </div>

        <div className="@container flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div
            className="grid grid-cols-2 gap-2 @min-[250px]:grid-cols-3 @min-[360px]:grid-cols-4 @min-[480px]:grid-cols-5 @min-[600px]:grid-cols-6 @min-[720px]:gap-3"
            role="listbox"
            aria-label={`Slots in ${box.title}`}
          >
            {slots.map((card, index) => (
              <SlotCell
                key={`${box.id}-${index}`}
                card={card}
                index={index}
                selected={index === selectedSlot}
                onSelect={() => setSelectedSlot(index)}
              />
            ))}
          </div>

          <p className="mt-auto pt-6 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            {slots.filter(Boolean).length}/{SLOT_COUNT} occupied · drag divider
            to resize
          </p>
        </div>
      </div>
    </section>
  );
}
