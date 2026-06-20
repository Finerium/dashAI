import type { CSSProperties } from "react";
import { CornerBrackets } from "@/components/ui";
import { POSE_CONNECTIONS } from "@/lib/cv/pose";
import { VEHICLE_CLASSES } from "@/lib/cv/types";
import type { FrameAnalysis } from "@/lib/cv/types";
import type { BBox } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

/**
 * DetectionOverlay — a pure, absolutely-positioned HUD layer drawn over a
 * <video>. All geometry comes from normalised (0..1) coords mapped to
 * percentages, so it scales with whatever the video element is sized to.
 *
 * Pure render: no hooks, no browser APIs — safe as a server component.
 */
export function DetectionOverlay({
  frame,
  activeTrackIds,
  className,
}: {
  frame: FrameAnalysis;
  activeTrackIds?: Set<string>;
  className?: string;
}) {
  const { detections, faces, poses, dominantFlow } = frame;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* Skeleton lines + joints in one stretched SVG (normalised 0..100 space). */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {poses.map((pose, pi) => {
          const kp = pose.keypoints;
          return (
            <g key={`pose-${pi}`}>
              {POSE_CONNECTIONS.map(([a, b], ci) => {
                const ka = kp[a];
                const kb = kp[b];
                if (!ka || !kb || ka.score <= 0.4 || kb.score <= 0.4) return null;
                return (
                  <line
                    key={`l-${pi}-${ci}`}
                    x1={ka.x * 100}
                    y1={ka.y * 100}
                    x2={kb.x * 100}
                    y2={kb.y * 100}
                    stroke="var(--color-verified)"
                    strokeWidth={0.4}
                    strokeOpacity={0.85}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {kp.map((k, ki) =>
                k.score > 0.4 ? (
                  <circle
                    key={`j-${pi}-${ki}`}
                    cx={k.x * 100}
                    cy={k.y * 100}
                    r={0.6}
                    fill="var(--color-verified)"
                    fillOpacity={0.9}
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null,
              )}
            </g>
          );
        })}
      </svg>

      {/* Vehicle + person detection boxes. */}
      {detections.map((d) => {
        const isVehicle = VEHICLE_CLASSES.has(d.cls);
        if (isVehicle) {
          const active = activeTrackIds?.has(d.id) ?? false;
          return (
            <VehicleBox
              key={d.id}
              bbox={d.bbox}
              cls={d.cls}
              id4={d.id.slice(0, 4)}
              score={d.score}
              active={active}
            />
          );
        }
        if (d.cls === "person") {
          return <PersonBox key={d.id} bbox={d.bbox} />;
        }
        return null;
      })}

      {/* Faces — privacy-preserving blur chip, never identity. */}
      {faces.map((f, fi) => (
        <FaceChip key={`face-${fi}`} bbox={f.bbox} />
      ))}

      {/* Dominant traffic flow HUD arrow, bottom-right. */}
      {dominantFlow ? <FlowArrow flow={dominantFlow} /> : null}
    </div>
  );
}

/** Convert a normalised bbox into a CSS percentage box style. */
function boxStyle(b: BBox): CSSProperties {
  return {
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: `${b.w * 100}%`,
    height: `${b.h * 100}%`,
  };
}

function VehicleBox({
  bbox,
  cls,
  id4,
  score,
  active,
}: {
  bbox: BBox;
  cls: string;
  id4: string;
  score: number;
  active: boolean;
}) {
  const pct = Math.round(score * 100);
  return (
    <div
      className={cn(
        "absolute",
        active
          ? "border-2 border-signal/90 pulse-signal"
          : "border border-amber/70",
      )}
      style={boxStyle(bbox)}
    >
      {active ? <CornerBrackets tone="signal" /> : null}
      <span
        className={cn(
          "mono absolute left-0 top-0 -translate-y-full whitespace-nowrap px-1 text-[0.55rem] leading-tight tracking-wide",
          active
            ? "bg-signal/15 text-signal"
            : "bg-ink/60 text-amber/90",
        )}
      >
        {cls} #{id4} {pct}%
      </span>
    </div>
  );
}

function PersonBox({ bbox }: { bbox: BBox }) {
  return (
    <div
      className="absolute border border-line-strong/50"
      style={boxStyle(bbox)}
    />
  );
}

function FaceChip({ bbox }: { bbox: BBox }) {
  return (
    <div
      className="absolute flex items-center justify-center overflow-hidden border border-line bg-ink/30 backdrop-blur-md"
      style={boxStyle(bbox)}
    >
      <span className="mono px-1 text-center text-[0.5rem] uppercase leading-tight tracking-[0.12em] text-muted">
        WAJAH • blur
      </span>
    </div>
  );
}

function FlowArrow({ flow }: { flow: { vx: number; vy: number } }) {
  // Heading from the dominant flow vector; SVG y grows downward, matching frame coords.
  const angleDeg = (Math.atan2(flow.vy, flow.vx) * 180) / Math.PI;
  const mag = Math.hypot(flow.vx, flow.vy);
  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 border border-line bg-ink/55 px-1.5 py-1 backdrop-blur-sm">
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        style={{ transform: `rotate(${angleDeg}deg)` }}
        aria-hidden="true"
      >
        <line
          x1="3"
          y1="12"
          x2="21"
          y2="12"
          stroke="var(--color-amber)"
          strokeWidth={1.5}
        />
        <polyline
          points="15,6 21,12 15,18"
          stroke="var(--color-amber)"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="mono text-[0.5rem] uppercase tracking-[0.12em] text-amber/80">
        arus {mag > 0.001 ? "" : "diam"}
      </span>
    </div>
  );
}
