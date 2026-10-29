export const MAP_UNITS = 8192;
export const MORTAR_MIN = 121;
export const MORTAR_MAX = 700;

export type Point = { x: number; y: number };

export const metersPerUnit = (km: number) => (km * 1000) / MAP_UNITS;

export function metersToUnits(km: number, meters: number) {
  return meters / metersPerUnit(km);
}

export function distanceMeters(km: number, a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y) * metersPerUnit(km);
}

export function bearingDeg(a: Point, b: Point) {
  let deg = (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

const COMPASS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];

export function compassZh(deg: number) {
  return COMPASS[Math.round(deg / 45) % 8];
}

export function gridRef(km: number, p: Point) {
  const cell = MAP_UNITS / km;
  const col = Math.min(km - 1, Math.max(0, Math.floor(p.x / cell)));
  const row = Math.min(km - 1, Math.max(0, Math.floor(p.y / cell)));
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

export function clampToMap(p: Point): Point {
  return {
    x: Math.min(MAP_UNITS, Math.max(0, p.x)),
    y: Math.min(MAP_UNITS, Math.max(0, p.y)),
  };
}

export type MortarState = "idle" | "waiting" | "short" | "far" | "ok";

export function mortarState(distance: number): MortarState {
  if (!Number.isFinite(distance)) return "idle";
  if (distance < MORTAR_MIN) return "short";
  if (distance > MORTAR_MAX) return "far";
  return "ok";
}
