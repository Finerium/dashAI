import type { BBox, Detection } from "@/lib/evidence/types";
import type { RawDetection } from "./types";
import { uid } from "@/lib/utils";

function iou(a: BBox, b: BBox): number {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const ix = Math.max(a.x, b.x);
  const iy = Math.max(a.y, b.y);
  const iw = Math.max(0, Math.min(ax2, bx2) - ix);
  const ih = Math.max(0, Math.min(ay2, by2) - iy);
  const inter = iw * ih;
  const uni = a.w * a.h + b.w * b.h - inter;
  return uni <= 0 ? 0 : inter / uni;
}

interface Track extends Detection {
  missed: number;
  cx: number;
  cy: number;
}

const center = (b: BBox) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2 });

/**
 * Greedy IoU multi-object tracker. Assigns stable ids across frames and derives
 * per-track velocity (normalised units/second) — the velocity vector is what
 * powers wrong-way detection (direction vs. dominant flow) and the other-vehicle
 * speed estimate (bbox-scale change).
 */
export class IouTracker {
  private tracks: Track[] = [];
  private lastTs = 0;

  constructor(
    private readonly iouThresh = 0.3,
    private readonly maxMissed = 8,
  ) {}

  update(raws: RawDetection[], ts: number): Detection[] {
    const dt = this.lastTs ? Math.max((ts - this.lastTs) / 1000, 1 / 60) : 1 / 30;
    this.lastTs = ts;

    const matchedTracks = new Set<Track>();
    const matchedRaws = new Set<number>();

    // Greedy: sort candidate pairs by IoU descending.
    const pairs: { t: Track; ri: number; score: number }[] = [];
    for (const t of this.tracks) {
      raws.forEach((r, ri) => {
        if (r.cls !== t.cls) return;
        const s = iou(t.bbox, r.bbox);
        if (s >= this.iouThresh) pairs.push({ t, ri, score: s });
      });
    }
    pairs.sort((a, b) => b.score - a.score);

    for (const { t, ri } of pairs) {
      if (matchedTracks.has(t) || matchedRaws.has(ri)) continue;
      matchedTracks.add(t);
      matchedRaws.add(ri);
      const r = raws[ri];
      const c = center(r.bbox);
      t.vx = (c.cx - t.cx) / dt;
      t.vy = (c.cy - t.cy) / dt;
      t.cx = c.cx;
      t.cy = c.cy;
      t.bbox = r.bbox;
      t.score = r.score;
      t.age = (t.age ?? 0) + 1;
      t.missed = 0;
    }

    // Age out unmatched pre-existing tracks (snapshot before adding new ones so
    // brand-new tracks aren't aged on the frame they appear).
    const existing = this.tracks;
    for (const t of existing) {
      if (!matchedTracks.has(t)) t.missed += 1;
    }
    this.tracks = existing.filter((t) => t.missed <= this.maxMissed);

    // New tracks for unmatched detections (added after aging/filtering).
    raws.forEach((r, ri) => {
      if (matchedRaws.has(ri)) return;
      const c = center(r.bbox);
      this.tracks.push({
        id: uid(),
        cls: r.cls,
        score: r.score,
        bbox: r.bbox,
        vx: 0,
        vy: 0,
        age: 1,
        missed: 0,
        cx: c.cx,
        cy: c.cy,
      });
    });

    return this.tracks
      .filter((t) => t.missed === 0)
      .map(({ missed, cx, cy, ...det }) => det);
  }

  reset(): void {
    this.tracks = [];
    this.lastTs = 0;
  }
}
