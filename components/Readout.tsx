import { Compass, RotateCcw, Target } from "lucide-react";
import type { MapDef } from "@/data/maps";
import {
  MORTAR_MAX,
  MORTAR_MIN,
  bearingDeg,
  compassZh,
  distanceMeters,
  gridRef,
  mortarState,
  type Point,
} from "@/lib/geo";

type Props = {
  map: MapDef;
  a: Point | null;
  b: Point | null;
  mode: "mortar" | "measure";
  onReset: () => void;
};

export function Readout({ map, a, b, mode, onReset }: Props) {
  const distance = a && b ? distanceMeters(map.km, a, b) : null;
  const state = distance != null ? mortarState(distance) : "idle";
  const bearing = a && b ? bearingDeg(a, b) : null;

  const status =
    !a ? "待设 A 点" : !b ? "待设 B 点" : mode === "mortar" ? { ok: "射程内", short: "低于最小射程", far: "超出最大射程", idle: "", waiting: "" }[state] : "直线距离";

  const statusTone =
    state === "ok" || (mode === "measure" && distance != null) ? "ok" : state === "short" || state === "far" ? "bad" : "idle";

  const dial = distance == null ? null : mode === "mortar" ? (state === "ok" ? Math.round(distance) : null) : null;
  const pct = distance == null ? 0 : Math.min(100, Math.max(0, (distance / 800) * 100));

  return (
    <div className="readout">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="readout-icon">
            {mode === "mortar" ? <Target size={14} /> : <Compass size={14} />}
          </span>
          <span className="hud-label">{mode === "mortar" ? "MORTAR 迫击炮" : "RANGE 测距"}</span>
        </div>
        <span className={`status-pill status-${statusTone}`}>{status}</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <span className="big-num">{distance == null ? "———" : Math.round(distance)}</span>
        <span className="pb-1.5 text-[13px] text-[var(--muted)]">m 平面距离</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]">
        <span>
          网格 <b className="text-[var(--text)]">{a ? gridRef(map.km, a) : "—"}</b>
          <span className="mx-1.5 text-white/25">→</span>
          <b className="text-[var(--text)]">{b ? gridRef(map.km, b) : "—"}</b>
        </span>
        <span>
          方位 <b className="text-[var(--text)]">{bearing == null ? "—" : `${Math.round(bearing)}° ${compassZh(bearing)}`}</b>
        </span>
      </div>

      {mode === "mortar" && (
        <>
          <div className="range-bar mt-3" aria-hidden>
            <span className="range-zone zone-min" />
            <span className="range-zone zone-mid" />
            <span className="range-zone zone-max" />
            {distance != null && <i className="range-caret" style={{ left: `${pct}%` }} />}
          </div>
          <div className="mt-1 flex justify-between text-[10px] tracking-wider text-white/35">
            <span>0</span>
            <span>121</span>
            <span>700</span>
            <span>800m</span>
          </div>

          <div className="dial-box mt-2">
            <div>
              <div className="hud-label">表盘读数</div>
              <div className="text-[11px] text-[var(--muted)]">游戏内按米设置</div>
            </div>
            <div className={`dial-num ${state === "ok" ? "" : "is-off"}`}>
              {dial == null ? "—" : dial}
              <span className="ml-1 text-[12px] text-[var(--muted)]">m</span>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
            {!a
              ? "在地图上点一下放迫击炮阵地（A 点），再点目标位置（B 点）。"
              : !b
                ? "再点一下目标位置（B 点），自动换算表盘距离。"
                : state === "far"
                  ? `目标 ${Math.round(distance!)} m，超出 700 m 最大射程，需要向前推进。`
                  : state === "short"
                    ? `目标 ${Math.round(distance!)} m，低于 121 m 最小射程，需要后撤。`
                    : "表盘按约 10 m 一档就近设置；低打高加档、高打低减档，坡度需手动修正。"}
          </p>
        </>
      )}

      {mode === "measure" && (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
          {!a ? "点击地图设置 A 点。" : !b ? "再点一下设置 B 点。" : "两点之间为地图平面直线距离，可拖动 A / B 微调。"}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-white/30">
          射程 {MORTAR_MIN}–{MORTAR_MAX} m · G 网格 · M 模式
        </span>
        <button type="button" className="reset-btn" onClick={onReset} disabled={!a && !b}>
          <RotateCcw size={12} /> 重置 A / B
        </button>
      </div>
    </div>
  );
}
