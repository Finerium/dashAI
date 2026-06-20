import type {
  BBox,
  Subject,
  ViolationKey,
} from "@/lib/evidence/types";
import type { RoadContext } from "@/lib/evidence/types";
import type { FrameAnalysis } from "@/lib/cv/types";
import { VEHICLE_CLASSES } from "@/lib/cv/types";
import { angleDelta } from "@/lib/geo/location";

export interface EngineContext {
  road: RoadContext | null;
  egoSpeedKmh: number | null;
  egoHeadingDeg: number | null;
  isNight: boolean;
  trafficLightState: "red" | "yellow" | "green" | null;
}

export interface ViolationCandidate {
  violation: ViolationKey;
  subject: Subject;
  confidence: number;
  trackId?: string;
  bbox?: BBox;
  vehicleClass?: string;
  otherSpeedKmh?: number | null;
  speedLimitKmh?: number | null;
  egoSpeedKmh?: number | null;
  notes?: string;
}

const DEBOUNCE_MS = 6000;
const MIN_TRACK_AGE = 4; // frames — kills single-frame noise
const SPEED_MARGIN_KMH = 5;

const center = (b: BBox) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

function pointInBox(px: number, py: number, b: BBox, pad = 0): boolean {
  return (
    px >= b.x - pad &&
    px <= b.x + b.w + pad &&
    py >= b.y - pad &&
    py <= b.y + b.h + pad
  );
}

/**
 * The violation rule engine. Stateful across frames so it can require minimum
 * track age and debounce per (violation, track) — a violation is reported once,
 * not every frame it persists. Only rules with a sound signal from the
 * detector + GPS stack fire live; specialized detections (helmet, plate, lights,
 * cabin) are catalogued and demonstrated via the curated sample set.
 */
export class ViolationEngine {
  private lastFired = new Map<string, number>();

  update(frame: FrameAnalysis, ctx: EngineContext, nowMs: number): ViolationCandidate[] {
    const out: ViolationCandidate[] = [];

    for (const c of [
      ...this.ruleWrongWayOther(frame),
      ...this.ruleWrongWaySelf(ctx),
      ...this.ruleSpeedingSelf(ctx),
      ...this.ruleOvercapacity(frame),
      ...this.ruleRedLightSelf(ctx),
    ]) {
      const key = `${c.violation}:${c.trackId ?? c.subject}`;
      const last = this.lastFired.get(key) ?? 0;
      if (nowMs - last < DEBOUNCE_MS) continue;
      this.lastFired.set(key, nowMs);
      out.push(c);
    }
    return out;
  }

  /** Vehicles moving against the dominant traffic flow (classic "motor lawan arah"). */
  private ruleWrongWayOther(frame: FrameAnalysis): ViolationCandidate[] {
    const flow = frame.dominantFlow;
    if (!flow) return [];
    const flowMag = Math.hypot(flow.vx, flow.vy);
    if (flowMag < 0.02) return []; // not enough motion to define a flow
    // Require enough moving vehicle tracks before trusting the dominant flow,
    // otherwise the direction is too noisy and yields false positives.
    const movingVehicles = frame.detections.filter(
      (d) =>
        VEHICLE_CLASSES.has(d.cls) &&
        Math.hypot(d.vx ?? 0, d.vy ?? 0) > 0.02,
    );
    if (movingVehicles.length < 3) return [];
    const res: ViolationCandidate[] = [];
    for (const d of frame.detections) {
      if (!VEHICLE_CLASSES.has(d.cls)) continue;
      if ((d.age ?? 0) < MIN_TRACK_AGE) continue;
      const vx = d.vx ?? 0;
      const vy = d.vy ?? 0;
      const mag = Math.hypot(vx, vy);
      if (mag < 0.02) continue;
      // cosine similarity vs dominant flow; strongly negative = opposing.
      const cos = (vx * flow.vx + vy * flow.vy) / (mag * flowMag);
      if (cos < -0.6) {
        res.push({
          violation: "lawan-arus",
          subject: "other",
          confidence: Math.min(0.92, 0.5 + (-cos - 0.6) * 1.0 + Math.min(mag, 0.2)),
          trackId: d.id,
          bbox: d.bbox,
          vehicleClass: d.cls,
          notes: "Arah gerak berlawanan dengan arus dominan lalu lintas.",
        });
      }
    }
    return res;
  }

  /** Ego vehicle on a one-way road, heading opposite the legal direction. */
  private ruleWrongWaySelf(ctx: EngineContext): ViolationCandidate[] {
    const { road, egoHeadingDeg, egoSpeedKmh } = ctx;
    if (!road?.oneway || road.bearingDeg == null || egoHeadingDeg == null) return [];
    if ((egoSpeedKmh ?? 0) < 8) return []; // ignore when nearly stopped
    const delta = Math.abs(angleDelta(egoHeadingDeg, road.bearingDeg));
    if (delta > 120) {
      return [
        {
          violation: "lawan-arus",
          subject: "self",
          confidence: 0.9,
          notes: `Arah kendaraan (${Math.round(egoHeadingDeg)}°) berlawanan dengan arah sah ruas satu-arah (${Math.round(road.bearingDeg)}°).`,
        },
      ];
    }
    return [];
  }

  /** Ego speed (accurate, GPS) over the OSM speed limit. */
  private ruleSpeedingSelf(ctx: EngineContext): ViolationCandidate[] {
    const limit = ctx.road?.maxspeedKmh ?? null;
    const speed = ctx.egoSpeedKmh ?? null;
    if (limit == null || speed == null) return [];
    if (speed > limit + SPEED_MARGIN_KMH) {
      return [
        {
          violation: "melebihi-kecepatan",
          subject: "self",
          confidence: 0.95,
          egoSpeedKmh: speed,
          speedLimitKmh: limit,
          notes: `Kecepatan GPS ${speed} km/jam melebihi batas ${limit} km/jam.`,
        },
      ];
    }
    return [];
  }

  /** Motorcycle carrying more than one passenger (>=3 people on the bike). */
  private ruleOvercapacity(frame: FrameAnalysis): ViolationCandidate[] {
    const motorcycles = frame.detections.filter(
      (d) => d.cls === "motorcycle" && (d.age ?? 0) >= MIN_TRACK_AGE,
    );
    const persons = frame.detections.filter((d) => d.cls === "person");
    const res: ViolationCandidate[] = [];
    for (const m of motorcycles) {
      const onBike = persons.filter((p) => {
        const c = center(p.bbox);
        return pointInBox(c.x, c.y, m.bbox);
      });
      if (onBike.length >= 3) {
        res.push({
          violation: "boncengan-lebih",
          subject: "other",
          confidence: Math.min(0.85, 0.55 + (onBike.length - 3) * 0.1),
          trackId: m.id,
          bbox: m.bbox,
          vehicleClass: "motorcycle",
          notes: `${onBike.length} orang terdeteksi pada satu sepeda motor.`,
        });
      }
    }
    return res;
  }

  /** Ego crossing on red (traffic light red + still moving). */
  private ruleRedLightSelf(ctx: EngineContext): ViolationCandidate[] {
    if (ctx.trafficLightState !== "red") return [];
    if ((ctx.egoSpeedKmh ?? 0) < 10) return [];
    return [
      {
        violation: "terobos-lampu-merah",
        subject: "self",
        confidence: 0.8,
        egoSpeedKmh: ctx.egoSpeedKmh,
        notes: "Lampu lalu lintas merah terdeteksi sementara kendaraan masih melaju.",
      },
    ];
  }

  reset(): void {
    this.lastFired.clear();
  }
}
