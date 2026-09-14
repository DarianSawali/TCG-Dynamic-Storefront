import { PcBoxPanel } from "@/components/pc-box/pc-box-panel";

export const metadata = {
  title: "PC box layout test",
};

export default function PcBoxTestPage() {
  return (
    <div className="-mx-4 min-h-[70vh] bg-zinc-900 px-4 py-8 sm:-mx-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-[11px] tracking-[0.2em] text-violet-300/90 uppercase">
            Layout prototype · not live
          </p>
          <h1 className="font-mono text-lg tracking-wide text-zinc-100 sm:text-xl">
            PokeCell PC Box
          </h1>
          <p className="max-w-2xl font-mono text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Three boxes only: 151, Phantasmal Flames, Ascended Heroes. Click
            slots for detail, ◀ ▶ to switch boxes, drag the divider to resize
            panes.
          </p>
        </header>

        <PcBoxPanel />
      </div>
    </div>
  );
}
