import type { RoadContext } from "@/lib/evidence/types";

/**
 * Resolve road context (oneway direction + speed limit) for a GPS coordinate
 * using the OpenStreetMap Overpass API — no API key required.
 *
 * This is the map-grounded half of wrong-way detection and the legal reference
 * for speeding ("self" subject). Results are cached per ~11 m grid cell and the
 * function degrades gracefully (returns null) on any network/parse failure so
 * the live pipeline never blocks on the network.
 */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, RoadContext | null>();

function cacheKey(lat: number, lng: number): string {
  // ~1e-4 deg ≈ 11 m — enough to keep us on the same road segment.
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function bearing(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon));
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

function parseMaxspeed(v: string | undefined): number | null {
  if (!v) return null;
  const m = /(\d+)/.exec(v);
  return m ? Number(m[1]) : null;
}

interface OverpassWay {
  type: string;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

export async function resolveRoadContext(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<RoadContext | null> {
  const key = cacheKey(lat, lng);
  if (cache.has(key)) return cache.get(key) ?? null;

  // Round to 4 decimals (~11 m, matching cache granularity) so we never send
  // full-precision coordinates to the third-party Overpass servers.
  const qLat = lat.toFixed(4);
  const qLng = lng.toFixed(4);

  const query =
    `[out:json][timeout:8];way(around:25,${qLat},${qLng})` +
    `["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|service|living_street)$"];` +
    `out tags geom 1;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { elements?: OverpassWay[] };
      const way = data.elements?.find((e) => e.type === "way");
      if (!way) {
        cache.set(key, null);
        return null;
      }
      const tags = way.tags ?? {};
      const oneway = tags.oneway === "yes" || tags.oneway === "true" || tags.oneway === "1";
      let bearingDeg: number | null = null;
      if (way.geometry && way.geometry.length >= 2) {
        bearingDeg = bearing(way.geometry[0], way.geometry[1]);
      }
      const ctx: RoadContext = {
        name: tags.name,
        oneway,
        bearingDeg,
        maxspeedKmh: parseMaxspeed(tags.maxspeed),
      };
      cache.set(key, ctx);
      return ctx;
    } catch {
      // try next endpoint
    }
  }
  cache.set(key, null);
  return null;
}
