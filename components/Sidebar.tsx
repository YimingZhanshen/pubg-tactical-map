import { Crosshair, Search, X } from "lucide-react";
import type { MapDef } from "@/data/maps";
import { GROUP_LABEL, MAPS, POI_META } from "@/data/maps";
import { POINTS, type Poi } from "@/data/points";
import { distanceMeters, gridRef, type Point } from "@/lib/geo";

type Props = {
  map: MapDef;
  points: Poi[];
  counts: Record<string, number>;
  layers: Record<string, boolean>;
  a: Point | null;
  query: string;
  onQuery: (q: string) => void;
  onMap: (slug: string) => void;
  onToggleLayer: (type: string) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
};

const TYPE_ORDER = Object.keys(POI_META);

export function Sidebar({
  map,
  points,
  counts,
  layers,
  a,
  query,
  onQuery,
  onMap,
  onToggleLayer,
  onSelect,
  onClose,
}: Props) {
  const q = query.trim().toLowerCase();
  const rows = points
    .filter((p) => layers[p.type])
    .filter((p) => !q || p.id.toLowerCase().includes(q) || POI_META[p.type].label.includes(q) || p.type.includes(q))
    .sort((p, q2) => TYPE_ORDER.indexOf(p.type) - TYPE_ORDER.indexOf(q2.type));

  const visibleCount = rows.length;

  return (
    <div className="flex h-full flex-col bg-[var(--panel)]">
      <header className="flex items-start justify-between gap-2 border-b border-[var(--stroke)] px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="brand-mark">
            <Crosshair size={18} />
          </span>
          <div>
            <h1 className="text-[15px] font-bold tracking-wide text-[var(--text)]">PUBG 战术地图</h1>
            <p className="text-[10.5px] tracking-wide text-[var(--muted)]">迫击炮测距 · 密室 · 载具点位</p>
          </div>
        </div>
        <button type="button" className="icon-btn md:hidden" onClick={onClose} aria-label="关闭面板">
          <X size={16} />
        </button>
      </header>

      <div className="border-b border-[var(--stroke)] px-4 py-3">
        <div className="section-label">地图 MAP</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {MAPS.map((m) => {
            const active = m.slug === map.slug;
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => onMap(m.slug)}
                className={`map-cell ${active ? "is-on" : ""}`}
                aria-pressed={active}
              >
                <span className="map-cell-zh">{m.zh}</span>
                <span className="map-cell-meta">
                  {(POINTS[m.slug]?.length ?? 0) === 0 ? "仅测距 · " + m.km + "km" : m.en + " · " + m.km + "km"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-[var(--stroke)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="section-label">图层 LAYERS</span>
          <span className="text-[10px] text-white/30">{map.km}×{map.km} km</span>
        </div>
        <div className="mt-2 space-y-2">
          {(Object.keys(GROUP_LABEL) as Array<keyof typeof GROUP_LABEL>).map((group) => {
            const types = Object.entries(POI_META).filter(([, meta]) => meta.group === group);
            return (
              <div key={group}>
                <div className="mb-1 text-[10px] tracking-wider text-white/35">{GROUP_LABEL[group]}</div>
                <div className="flex flex-wrap gap-1.5">
                  {types.map(([type, meta]) => {
                    const count = counts[type] ?? 0;
                    if (!count) return null;
                    const on = !!layers[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onToggleLayer(type)}
                        className={`layer-chip ${on ? "is-on" : ""}`}
                        aria-pressed={on}
                      >
                        <span className="dot" style={{ background: meta.color }} />
                        {meta.label}
                        <span className="chip-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-4 pb-2 pt-3">
          <div className="search-box flex-1">
            <Search size={13} className="text-[var(--muted)]" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="搜索点位类型或编号"
              aria-label="搜索点位"
            />
          </div>
          <span className="text-[10px] text-white/35">{visibleCount}</span>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {points.length === 0 ? (
            <p className="px-2 py-6 text-center text-[11px] leading-relaxed text-[var(--muted)]">
              该地图暂无点位数据，<br />
              仍可使用测距与迫击炮换算。
            </p>
          ) : rows.length === 0 ? (
            <p className="px-2 py-6 text-center text-[11px] text-[var(--muted)]">没有匹配的点位</p>
          ) : (
            rows.map((poi) => {
              const meta = POI_META[poi.type];
              const dist = a ? Math.round(distanceMeters(map.km, a, poi)) : null;
              return (
                <button key={poi.id} type="button" className="poi-row" onClick={() => onSelect(poi.id)}>
                  <span className="poi-row-dot" style={{ background: meta.color }} />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-baseline justify-between gap-2">
                      <b className="text-[12px] font-medium text-[var(--text)]">{meta.label}</b>
                      {dist != null && <span className="shrink-0 font-mono text-[11px] text-[var(--accent)]">{dist} m</span>}
                    </span>
                    <span className="mt-0.5 flex justify-between text-[10px] text-white/35">
                      <span>#{poi.id}</span>
                      <span>网格 {gridRef(map.km, poi)}</span>
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-[var(--stroke)] px-4 py-2">
        <a
          href="/guide.html"
          target="_blank"
          rel="noopener"
          className="flex items-center justify-between text-[11px] text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          <span>使用说明 · 迫击炮怎么测</span>
          <span aria-hidden>→</span>
        </a>
      </div>
      <footer className="px-4 pb-2 text-[10px] leading-relaxed text-white/30">
        点位来自社区标注，版本更新后可能有偏差，仅供战术参考。
      </footer>
    </div>
  );
}
