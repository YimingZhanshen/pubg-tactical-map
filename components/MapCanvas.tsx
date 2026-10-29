import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { MapDef } from "@/data/maps";
import { POI_META } from "@/data/maps";
import type { Poi, PoiType } from "@/data/points";
import {
  MAP_UNITS,
  MORTAR_MAX,
  MORTAR_MIN,
  clampToMap,
  distanceMeters,
  gridRef,
  metersToUnits,
  type Point,
} from "@/lib/geo";

const CRS = L.extend({}, L.CRS.Simple, {
  transformation: new L.Transformation(1, 0, 1, 0),
  scale: (z: number) => Math.pow(2, z - 5),
  zoom: (s: number) => Math.log(s) / Math.LN2 + 5,
}) as L.CRS;

const BOUNDS = L.latLngBounds([0, 0], [MAP_UNITS, MAP_UNITS]);
const toLatLng = (p: Point) => L.latLng(p.y, p.x);
const toPoint = (ll: L.LatLng) => clampToMap({ x: ll.lng, y: ll.lat });

type Props = {
  map: MapDef;
  points: Poi[];
  visible: Record<string, boolean>;
  a: Point | null;
  b: Point | null;
  mode: "mortar" | "measure";
  grid: boolean;
  selected: { id: string; n: number } | null;
  onPick: (p: Point) => void;
  onDrag: (which: "a" | "b", p: Point) => void;
  onSetPoint: (id: string, which: "a" | "b") => void;
  onReset: () => void;
};

export function MapCanvas(props: Props) {
  const { map: mapDef, points, visible, a, b, mode, grid, selected } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const imageRef = useRef<L.TileLayer | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const minorRef = useRef<L.LayerGroup | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const measureRef = useRef<L.LayerGroup | null>(null);
  const renderersRef = useRef<{ major?: L.Canvas; minor?: L.Canvas }>({});

  const stateRef = useRef({ a, b, km: mapDef.km, onPick: props.onPick, onDrag: props.onDrag, onSetPoint: props.onSetPoint });
  useEffect(() => {
    stateRef.current = { a, b, km: mapDef.km, onPick: props.onPick, onDrag: props.onDrag, onSetPoint: props.onSetPoint };
  });

  const onPopupClick = (ev: MouseEvent) => {
    const target = (ev.target as HTMLElement).closest?.("[data-poi-act]") as HTMLElement | null;
    if (!target) return;
    const id = target.dataset.poiId;
    const act = target.dataset.poiAct;
    if (id && (act === "a" || act === "b")) {
      ev.stopPropagation();
      stateRef.current.onSetPoint(id, act);
      mapRef.current?.closePopup();
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = L.map(el, {
      crs: CRS,
      minZoom: 1.2,
      maxZoom: 5,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 140,
      preferCanvas: true,
      maxBounds: L.latLngBounds([-500, -500], [MAP_UNITS + 500, MAP_UNITS + 500]),
      maxBoundsViscosity: 0.7,
    });
    mapRef.current = map;
    map.setView([MAP_UNITS / 2, MAP_UNITS / 2], 2);

    const minorCanvas = L.canvas({ padding: 0.4 });
    const gridCanvas = L.canvas({ padding: 0.4 });
    renderersRef.current = { major: gridCanvas, minor: minorCanvas };

    map.on("click", (e: L.LeafletMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (target?.closest(".leaflet-popup")) return;
      stateRef.current.onPick(toPoint(e.latlng));
    });
    map.on("zoomend", () => {
      const minor = minorRef.current;
      if (!minor) return;
      if (map.getZoom() >= 2.6) {
        if (!map.hasLayer(minor)) minor.addTo(map);
      } else if (map.hasLayer(minor)) {
        map.removeLayer(minor);
      }
    });

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    imageRef.current?.remove();
    const layer = L.tileLayer(`/tiles/${mapDef.slug}/{z}/{x}/{y}.webp`, {
      tileSize: 256,
      // Must stay at 0: the fitted view can round to tile zoom 1, which Layer treats as out of range below 1.
      minZoom: 0,
      maxZoom: mapDef.maxZoom,
      maxNativeZoom: mapDef.maxNativeZoom,
      noWrap: true,
      bounds: BOUNDS,
      keepBuffer: 3,
      updateWhenZooming: false,
      updateWhenIdle: true,
      className: "map-tiles",
    });
    imageRef.current = layer.addTo(map);
    map.setMaxZoom(mapDef.maxZoom);
    map.fitBounds(BOUNDS, { animate: false });
  }, [mapDef.slug, mapDef.maxZoom, mapDef.maxNativeZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    gridLayerRef.current?.remove();
    minorRef.current?.remove();

    const km = mapDef.km;
    const cell = MAP_UNITS / km;
    const step = cell / 10;
    const major = L.layerGroup();
    const minor = L.layerGroup();
    const renderer = renderersRef.current.major;
    const minorRenderer = renderersRef.current.minor;

    if (grid) {
      for (let i = 0; i <= km * 10; i++) {
        const isMajor = i % 10 === 0;
        const v = i * step;
        const target = isMajor ? major : minor;
        const style: L.PolylineOptions = {
          color: isMajor ? "#ffffff" : "#ffffff",
          weight: 1,
          opacity: isMajor ? 0.38 : 0.14,
          interactive: false,
          renderer: isMajor ? renderer : minorRenderer,
        };
        L.polyline([[0, v], [MAP_UNITS, v]], style).addTo(target);
        L.polyline([[v, 0], [v, MAP_UNITS]], style).addTo(target);
      }
      for (let col = 0; col < km; col++) {
        for (let row = 0; row < km; row++) {
          const letter = String.fromCharCode(65 + col);
          L.marker([row * cell + cell / 2, col * cell + cell / 2], {
            interactive: false,
            keyboard: false,
            icon: L.divIcon({
              className: "grid-label",
              html: `<span>${letter}${row + 1}</span>`,
              iconSize: [28, 16],
            }),
          }).addTo(major);
        }
      }
      major.addTo(map);
      if (map.getZoom() >= 2.6) minor.addTo(map);
    }

    gridLayerRef.current = major;
    minorRef.current = minor;
    return () => {
      major.remove();
      minor.remove();
    };
  }, [grid, mapDef.km]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    poiLayerRef.current?.remove();
    const layer = L.layerGroup();
    const markers = new Map<string, L.CircleMarker>();

    for (const poi of points) {
      if (!visible[poi.type]) continue;
      const meta = POI_META[poi.type as PoiType];
      if (!meta) continue;
      const marker = L.circleMarker(toLatLng(poi), {
        radius: 5,
        weight: 1.4,
        color: "#0a0d0c",
        opacity: 0.9,
        fillColor: meta.color,
        fillOpacity: 1,
        bubblingMouseEvents: false,
      });
      marker.bindPopup(
        () => {
          const { a: aPoint, b: bPoint, km } = stateRef.current;
          const rows: string[] = [];
          if (aPoint) rows.push(`距 A 点 <b>${Math.round(distanceMeters(km, aPoint, poi))} m</b>`);
          if (bPoint) rows.push(`距 B 点 <b>${Math.round(distanceMeters(km, bPoint, poi))} m</b>`);
          return `<div class="poi-pop">
            <div class="poi-pop-title"><span class="poi-swatch" style="background:${meta.color}"></span>${meta.label}<span class="poi-pop-id">#${poi.id}</span></div>
            <div class="poi-pop-meta">网格 <b>${gridRef(km, poi)}</b> · 坐标 ${Math.round(poi.x)}, ${Math.round(poi.y)}</div>
            ${rows.length ? `<div class="poi-pop-dist">${rows.join("<br/>")}</div>` : ""}
            <div class="poi-pop-actions">
              <button type="button" data-poi-act="a" data-poi-id="${poi.id}">设为 A 点</button>
              <button type="button" data-poi-act="b" data-poi-id="${poi.id}">设为 B 点</button>
            </div>
          </div>`;
        },
        { className: "poi-popup", closeButton: false, maxWidth: 260, minWidth: 220 },
      );
      marker.on("popupopen", (e) => {
        const popupEl = e.popup.getElement();
        if (!popupEl || popupEl.dataset.bound === "1") return;
        popupEl.dataset.bound = "1";
        popupEl.addEventListener("click", onPopupClick);
      });
      marker.addTo(layer);
      markers.set(poi.id, marker);
    }

    layer.addTo(map);
    poiLayerRef.current = layer;
    markerByIdRef.current = markers;
    return () => {
      layer.remove();
    };
  }, [points, visible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    measureRef.current?.remove();
    const group = L.layerGroup();
    const km = mapDef.km;

    if (a && b) {
      L.polyline([toLatLng(a), toLatLng(b)], {
        color: "#f2a900",
        weight: 2.5,
        opacity: 0.95,
        dashArray: "9 7",
        className: "measure-line",
        interactive: false,
      }).addTo(group);

      const mid = L.latLng((a.y + b.y) / 2, (a.x + b.x) / 2);
      L.marker(mid, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "dist-tag-wrap",
          html: `<div class="dist-tag">${Math.round(distanceMeters(km, a, b))} m</div>`,
          iconSize: [1, 1],
        }),
      }).addTo(group);
    }

    if (a && mode === "mortar") {
      L.circle(toLatLng(a), {
        radius: metersToUnits(km, MORTAR_MIN),
        color: "#ff6b6b",
        weight: 1.2,
        opacity: 0.55,
        dashArray: "4 6",
        fill: false,
        interactive: false,
      }).addTo(group);
      L.circle(toLatLng(a), {
        radius: metersToUnits(km, MORTAR_MAX),
        color: "#f2a900",
        weight: 1.4,
        opacity: 0.5,
        dashArray: "4 8",
        fill: false,
        interactive: false,
      }).addTo(group);
    }

    const pin = (p: Point, label: "A" | "B") => {
      const marker = L.marker(toLatLng(p), {
        draggable: true,
        keyboard: false,
        zIndexOffset: 1200,
        icon: L.divIcon({
          className: "pin-wrap",
          html: `<div class="pin pin-${label.toLowerCase()}">${label}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });
      marker.on("dragend", () => {
        stateRef.current.onDrag(label.toLowerCase() as "a" | "b", toPoint(marker.getLatLng()));
      });
      marker.addTo(group);
    };
    if (a) pin(a, "A");
    if (b) pin(b, "B");

    group.addTo(map);
    measureRef.current = group;
    return () => {
      group.remove();
    };
  }, [a, b, mode, mapDef.km]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selected) {
      map.closePopup();
      return;
    }
    const marker = markerByIdRef.current.get(selected.id);
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 3.25), { duration: 0.5 });
    marker.openPopup();
  }, [selected]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" aria-label="PUBG 地图" />
      <div className="pointer-events-none absolute inset-0 map-vignette" />

      <div className="absolute right-3 top-24 z-[500] flex flex-col gap-2">
        <div className="zoom-stack">
          <button
            type="button"
            aria-label="放大"
            onClick={() => mapRef.current?.zoomIn(0.5)}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            aria-label="缩小"
            onClick={() => mapRef.current?.zoomOut(0.5)}
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            aria-label="回到全图"
            onClick={() => mapRef.current?.fitBounds(BOUNDS, { animate: true })}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-1.5 right-2 z-[450] hidden text-[10px] text-white/35 md:block">
        底图 © KRAFTON · 点位为社区标注，仅供参考
      </div>
    </div>
  );
}
