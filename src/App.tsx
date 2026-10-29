import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { MapCanvas } from "@/components/MapCanvas";
import { Readout } from "@/components/Readout";
import { Sidebar } from "@/components/Sidebar";
import { MAP_BY_SLUG, MAPS, POI_META } from "@/data/maps";
import { POINTS } from "@/data/points";
import type { Point } from "@/lib/geo";

type Mode = "mortar" | "measure";

const STORAGE_KEY = "pubg-tactical-map-v1";

const DEFAULT_LAYERS: Record<string, boolean> = Object.fromEntries(
  Object.entries(POI_META).map(([type, meta]) => [type, meta.defaultVisible]),
);

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as {
      slug?: string;
      mode?: Mode;
      grid?: boolean;
      layers?: Record<string, boolean>;
    };
  } catch {
    return {};
  }
}

const saved = loadSaved();

export default function App() {
  const [slug, setSlug] = useState(() => (saved.slug && MAP_BY_SLUG[saved.slug] ? saved.slug : "erangel"));
  const [mode, setMode] = useState<Mode>(saved.mode === "measure" ? "measure" : "mortar");
  const [grid, setGrid] = useState(saved.grid ?? true);
  const [layers, setLayers] = useState<Record<string, boolean>>({ ...DEFAULT_LAYERS, ...(saved.layers ?? {}) });
  const [a, setA] = useState<Point | null>(null);
  const [b, setB] = useState<Point | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ id: string; n: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const map = MAP_BY_SLUG[slug] ?? MAPS[0];
  const points = useMemo(() => POINTS[slug] ?? [], [slug]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const p of points) result[p.type] = (result[p.type] ?? 0) + 1;
    return result;
  }, [points]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ slug, mode, grid, layers }));
    } catch {
      /* storage unavailable */
    }
  }, [slug, mode, grid, layers]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "Escape") {
        setA(null);
        setB(null);
        setSelected(null);
        setPanelOpen(false);
      } else if (e.key.toLowerCase() === "g") {
        setGrid((v) => !v);
      } else if (e.key.toLowerCase() === "m") {
        setMode((v) => (v === "mortar" ? "measure" : "mortar"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pick = (p: Point) => {
    if (!a) setA(p);
    else if (!b) setB(p);
    else {
      setA(p);
      setB(null);
    }
  };

  const changeMap = (next: string) => {
    if (next === slug) return;
    setSlug(next);
    setA(null);
    setB(null);
    setSelected(null);
    setQuery("");
  };

  const setPointFromPoi = (id: string, which: "a" | "b") => {
    const poi = points.find((p) => p.id === id);
    if (!poi) return;
    if (which === "a") setA({ x: poi.x, y: poi.y });
    else setB({ x: poi.x, y: poi.y });
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--hud-bg)] text-[var(--text)]">
      {panelOpen && (
        <div
          className="fixed inset-0 z-[650] bg-black/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setPanelOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[700] w-[340px] max-w-[88vw] border-r border-[var(--stroke)] transition-transform duration-300 md:static md:z-auto md:w-[336px] md:translate-x-0 ${
          panelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          map={map}
          points={points}
          counts={counts}
          layers={layers}
          a={a}
          query={query}
          onQuery={setQuery}
          onMap={changeMap}
          onToggleLayer={(type) => setLayers((prev) => ({ ...prev, [type]: !prev[type] }))}
          onSelect={(id) => {
            setSelected({ id, n: Date.now() });
            setPanelOpen(false);
          }}
          onClose={() => setPanelOpen(false)}
        />
      </aside>

      <main className="relative min-w-0 flex-1">
        <MapCanvas
          map={map}
          points={points}
          visible={layers}
          a={a}
          b={b}
          mode={mode}
          grid={grid}
          selected={selected}
          onPick={pick}
          onDrag={(which, p) => (which === "a" ? setA(p) : setB(p))}
          onSetPoint={setPointFromPoi}
          onReset={() => {
            setA(null);
            setB(null);
          }}
        />

        <div className="absolute left-3 top-3 z-[600] md:hidden">
          <button type="button" className="hud-btn" onClick={() => setPanelOpen(true)} aria-label="打开地图与图层面板">
            <Menu size={15} />
            <span>地图 / 点位</span>
          </button>
        </div>

        <div className="absolute right-3 top-3 z-[600] flex flex-col items-end gap-2">
          <div className="seg" role="group" aria-label="工具模式">
            <button
              type="button"
              className={mode === "mortar" ? "on" : ""}
              onClick={() => setMode("mortar")}
              aria-pressed={mode === "mortar"}
            >
              迫击炮
            </button>
            <button
              type="button"
              className={mode === "measure" ? "on" : ""}
              onClick={() => setMode("measure")}
              aria-pressed={mode === "measure"}
            >
              测距
            </button>
          </div>
          <button
            type="button"
            className={`hud-btn ${grid ? "is-on" : ""}`}
            onClick={() => setGrid((v) => !v)}
            aria-pressed={grid}
          >
            100m 网格
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-[620] md:right-auto md:w-[304px]">
          <Readout map={map} a={a} b={b} mode={mode} onReset={() => { setA(null); setB(null); }} />
        </div>
      </main>
    </div>
  );
}
