// One-off converter: dev/data/points.js (community dataset, 8192px space) -> data/points.ts
import fs from "node:fs";

const src = fs.readFileSync("dev/data/points.js", "utf8");
const win = {};
new Function("window", src)(win);
const raw = win.MAP_POINTS;

const types = [
  "secret_room",
  "car_fixed",
  "garage",
  "boat",
  "glider",
  "revive_station",
  "gas_station",
  "bear_cave",
  "lab_camp",
  "jump_tower",
  "basement",
  "crowbar",
];

const rows = [];
for (const [slug, list] of Object.entries(raw)) {
  for (const p of list) {
    if (!types.includes(p.type)) throw new Error(`unknown type ${p.type}`);
    rows.push([p.id, types.indexOf(p.type), Math.round(p.x), Math.round(p.y), slug]);
  }
}

const byMap = {};
for (const [id, t, x, y, slug] of rows) {
  (byMap[slug] ||= []).push([id, t, x, y]);
}

const out = `// Generated from a community-annotated PUBG POI dataset (coordinates in 8192px map space).
// Approximate by nature; treat placements as guidance, not game-exact.
export const POI_TYPE_KEYS = ${JSON.stringify(types)} as const;

export type PoiType = (typeof POI_TYPE_KEYS)[number];

export type Poi = { id: string; type: PoiType; x: number; y: number };

const M: Record<string, RawPoi[]> = {
${Object.entries(byMap)
  .map(
    ([slug, list]) =>
      `  ${slug}: ${JSON.stringify(list)},`,
  )
  .join("\n")}
};

type RawPoi = [string, number, number, number];

export const POINTS: Record<string, Poi[]> = Object.fromEntries(
  Object.entries(M).map(([slug, list]) => [
    slug,
    list.map(([id, t, x, y]) => ({ id, type: POI_TYPE_KEYS[t], x, y })),
  ]),
);
`;

fs.writeFileSync("data/points.ts", out);
console.log("points:", rows.length, "maps:", Object.keys(byMap).length, "size:", (out.length / 1024).toFixed(1) + "KB");
