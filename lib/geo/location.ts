import type { GeoPoint } from "@/lib/evidence/types";

/**
 * Thin wrapper over the Geolocation API. Ego-speed and heading come straight
 * from the GPS chip and are accurate — this is the trustworthy half of dashAI's
 * speed story (the "self" subject). Estimating *other* vehicles' speed is done
 * elsewhere and is explicitly an estimate.
 */
export type LocationCallback = (p: GeoPoint) => void;

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function watchLocation(
  cb: LocationCallback,
  onError?: (e: GeolocationPositionError) => void,
): () => void {
  if (!isGeolocationAvailable()) {
    onError?.({
      code: 2,
      message: "Geolocation tidak tersedia",
    } as GeolocationPositionError);
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      cb({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speedMps: pos.coords.speed,
        headingDeg: pos.coords.heading,
        timestamp: pos.timestamp,
      });
    },
    (err) => onError?.(err),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

/** Smallest signed angle (degrees) between two bearings, in [-180, 180]. */
export function angleDelta(a: number, b: number): number {
  let d = ((a - b + 540) % 360) - 180;
  if (d < -180) d += 360;
  return d;
}
