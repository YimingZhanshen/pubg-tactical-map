export type MapDef = {
  slug: string;
  zh: string;
  en: string;
  km: number;
  maxZoom: number;
  maxNativeZoom: number;
};

export const MAPS: MapDef[] = [
  { slug: "erangel", zh: "艾伦格", en: "Erangel", km: 8, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "miramar", zh: "米拉玛", en: "Miramar", km: 8, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "taego", zh: "泰戈", en: "Taego", km: 8, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "vikendi", zh: "维寒迪", en: "Vikendi", km: 8, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "rondo", zh: "荣都", en: "Rondo", km: 8, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "deston", zh: "蒂斯顿", en: "Deston", km: 8, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "sanhok", zh: "萨诺", en: "Sanhok", km: 4, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "paramo", zh: "帕拉莫", en: "Paramo", km: 3, maxZoom: 4.25, maxNativeZoom: 4 },
  { slug: "karakin", zh: "卡拉金", en: "Karakin", km: 2, maxZoom: 4.25, maxNativeZoom: 4 },
];

export const MAP_BY_SLUG = Object.fromEntries(MAPS.map((m) => [m.slug, m]));

export type PoiMeta = {
  label: string;
  color: string;
  group: "loot" | "vehicle" | "utility";
  defaultVisible: boolean;
};

export const POI_META: Record<string, PoiMeta> = {
  secret_room: { label: "密室", color: "#b07cff", group: "loot", defaultVisible: true },
  basement: { label: "地下室", color: "#2dd4bf", group: "loot", defaultVisible: true },
  bear_cave: { label: "熊洞", color: "#e08a3c", group: "loot", defaultVisible: true },
  lab_camp: { label: "实验营地", color: "#7ea6f5", group: "loot", defaultVisible: false },
  crowbar: { label: "撬棍点", color: "#9f8fe8", group: "loot", defaultVisible: false },
  car_fixed: { label: "固定刷车", color: "#5ed17a", group: "vehicle", defaultVisible: true },
  garage: { label: "车库", color: "#ff6b6b", group: "vehicle", defaultVisible: false },
  boat: { label: "船只", color: "#35c8dd", group: "vehicle", defaultVisible: true },
  glider: { label: "滑翔机", color: "#efd34a", group: "vehicle", defaultVisible: true },
  revive_station: { label: "复活站", color: "#5b8def", group: "utility", defaultVisible: false },
  gas_station: { label: "加油站", color: "#f39aa4", group: "utility", defaultVisible: false },
  jump_tower: { label: "跳伞塔", color: "#ff9f45", group: "utility", defaultVisible: false },
};

export const GROUP_LABEL: Record<PoiMeta["group"], string> = {
  loot: "物资点位",
  vehicle: "载具",
  utility: "设施",
};
