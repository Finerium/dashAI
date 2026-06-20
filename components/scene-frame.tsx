import type { ReactNode } from "react";
import { CornerBrackets, StatusDot } from "@/components/ui";
import { VIOLATION_CATALOG } from "@/lib/legal/catalog";
import type { SceneType, ViolationEvent } from "@/lib/evidence/types";
import { cn, fmtTime } from "@/lib/utils";

/**
 * SceneFrame — renders a SYNTHETIC, stylised dashcam scene as inline SVG.
 *
 * Nothing here is photoreal: scenes are abstract geometry (perspective lane
 * lines, glows, guardrails) drawn on a near-black canvas with grain + scanline
 * overlays, on-brand with the "forensic evidence terminal" aesthetic. When
 * `showOverlay` is on it dresses the canvas as an evidence frame: a top
 * REC●/timestamp strip, a bottom plate/speed strip, a sweeping scan line, and
 * (if the event carries a bbox) a signal-red detection box with HUD brackets
 * and a floating label chip.
 *
 * Pure render — no hooks, no browser APIs — so it stays a server component.
 */

/** Internal viewBox geometry; the SVG scales to its 16:9 container. */
const VW = 320;
const VH = 180;
/** Vanishing point near the upper third for road perspective. */
const VPX = VW / 2;
const VPY = VH * 0.36;

const SCENE_LABEL_ID: Record<SceneType, string> = {
  "street-day": "Jalan kota, siang hari",
  "street-night": "Jalan kota, malam hari",
  intersection: "Persimpangan dengan lampu lalu lintas",
  highway: "Jalan tol multi-lajur",
  alley: "Gang sempit satu arah",
};

/** Human-readable aria-label describing the whole evidence frame. */
function describe(event: ViolationEvent): string {
  const scene = event.scene ? SCENE_LABEL_ID[event.scene] : "Adegan sintetis";
  const meta = VIOLATION_CATALOG[event.violation];
  const who = event.subject === "self" ? "diri sendiri" : "kendaraan lain";
  const pct = Math.round(event.confidence * 100);
  return `Rekonstruksi adegan sintetis: ${scene}. Pelanggaran ${meta.labelId} oleh ${who}, keyakinan ${pct} persen. Wajah dan pelat dikaburkan.`;
}

/* -------------------------------------------------------------------------- */
/*  Scene backdrops (pure SVG, abstract/geometric)                            */
/* -------------------------------------------------------------------------- */

/** A set of perspective lane lines converging on the vanishing point. */
function LaneLines({
  color,
  dashed = true,
  count = 1,
  width = 1,
  opacity = 0.5,
}: {
  color: string;
  dashed?: boolean;
  count?: number;
  width?: number;
  opacity?: number;
}) {
  // Centre lane plus symmetric outer lanes spreading toward the frame edges.
  const baseSpread = VW * 0.16;
  const lines: ReactNode[] = [];
  for (let i = -count; i <= count; i++) {
    const baseX = VPX + i * baseSpread;
    lines.push(
      <line
        key={i}
        x1={VPX + i * (baseSpread * 0.12)}
        y1={VPY}
        x2={baseX + i * baseSpread * 1.4}
        y2={VH + 8}
        stroke={color}
        strokeWidth={width}
        strokeOpacity={opacity}
        strokeDasharray={dashed && i !== 0 ? "6 9" : undefined}
        vectorEffect="non-scaling-stroke"
      />,
    );
  }
  return <g>{lines}</g>;
}

function StreetDay() {
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sf-day-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2417" />
          <stop offset="0.55" stopColor="#171513" />
          <stop offset="1" stopColor="#0c0c0d" />
        </linearGradient>
        <radialGradient id="sf-day-haze" cx="0.5" cy="0.42" r="0.5">
          <stop offset="0" stopColor="#ffb020" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffb020" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sf-day-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1c1f" />
          <stop offset="1" stopColor="#0a0b0c" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={VW} height={VH} fill="url(#sf-day-sky)" />
      {/* warm hazy sun glow near the horizon */}
      <rect x="0" y="0" width={VW} height={VH * 0.7} fill="url(#sf-day-haze)" />
      {/* distant horizon haze line */}
      <line x1="0" y1={VPY} x2={VW} y2={VPY} stroke="#ffb020" strokeOpacity="0.18" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {/* road surface as a trapezoid to the vanishing point */}
      <path d={`M0 ${VH} L${VW} ${VH} L${VPX + 26} ${VPY} L${VPX - 26} ${VPY} Z`} fill="url(#sf-day-road)" />
      <LaneLines color="#cfd3da" count={1} opacity={0.45} />
      {/* solid road edges */}
      <line x1={VPX - 26} y1={VPY} x2={2} y2={VH} stroke="#9aa1aa" strokeOpacity="0.3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1={VPX + 26} y1={VPY} x2={VW - 2} y2={VH} stroke="#9aa1aa" strokeOpacity="0.3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function StreetNight() {
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sf-night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1322" />
          <stop offset="0.6" stopColor="#0a0d16" />
          <stop offset="1" stopColor="#07080b" />
        </linearGradient>
        <radialGradient id="sf-night-head" cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stopColor="#e9ecff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#9fb4ff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#9fb4ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sf-night-sodium" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb020" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffb020" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={VW} height={VH} fill="url(#sf-night-sky)" />
      <path d={`M0 ${VH} L${VW} ${VH} L${VPX + 26} ${VPY} L${VPX - 26} ${VPY} Z`} fill="#0a0c10" />
      {/* sodium streetlights down both sides */}
      {[0.78, 0.6, 0.48].map((t, i) => {
        const ly = VPY + (VH - VPY) * t;
        const spread = 24 + t * 90;
        return (
          <g key={i}>
            <ellipse cx={VPX - spread} cy={ly} rx={10 + t * 10} ry={6 + t * 6} fill="url(#sf-night-sodium)" />
            <ellipse cx={VPX + spread} cy={ly} rx={10 + t * 10} ry={6 + t * 6} fill="url(#sf-night-sodium)" />
            <rect x={VPX - spread - 0.5} y={ly} width="1" height={22 + t * 18} fill="#3a3322" />
            <rect x={VPX + spread - 0.5} y={ly} width="1" height={22 + t * 18} fill="#3a3322" />
          </g>
        );
      })}
      {/* oncoming headlight glow pair */}
      <ellipse cx={VPX - 9} cy={VPY + 18} rx="22" ry="13" fill="url(#sf-night-head)" />
      <ellipse cx={VPX + 9} cy={VPY + 18} rx="22" ry="13" fill="url(#sf-night-head)" />
      <LaneLines color="#7e8aa6" count={1} opacity={0.4} />
    </g>
  );
}

function Intersection({ redLight }: { redLight: boolean }) {
  const tlx = VW - 44;
  const tly = 18;
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sf-cross-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#161922" />
          <stop offset="1" stopColor="#0a0b0d" />
        </linearGradient>
        <radialGradient id="sf-cross-redglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff4d4f" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ff4d4f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={VW} height={VH} fill="url(#sf-cross-sky)" />
      {/* forward road */}
      <path d={`M0 ${VH} L${VW} ${VH} L${VPX + 26} ${VPY} L${VPX - 26} ${VPY} Z`} fill="#0c0e11" />
      {/* crossing road as a horizontal band */}
      <rect x="0" y={VH * 0.6} width={VW} height={VH * 0.16} fill="#101216" />
      <line x1="0" y1={VH * 0.6} x2={VW} y2={VH * 0.6} stroke="#9aa1aa" strokeOpacity="0.28" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1="0" y1={VH * 0.76} x2={VW} y2={VH * 0.76} stroke="#9aa1aa" strokeOpacity="0.28" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {/* zebra / stop-line dashes across the forward lane */}
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={VPX - 30 + i * 9} y={VH * 0.58} width="5" height="3" fill="#cfd3da" fillOpacity="0.55" />
      ))}
      <LaneLines color="#cfd3da" count={1} opacity={0.4} />
      {/* traffic-light glyph: pole + 3-aspect head */}
      <rect x={tlx - 1} y={tly} width="2" height={VH * 0.5} fill="#2a2e36" />
      <rect x={tlx - 7} y={tly - 2} width="14" height="30" rx="2" fill="#0e0f12" stroke="#2a2e36" strokeWidth="1" />
      <circle cx={tlx} cy={tly + 5} r="3.4" fill={redLight ? "#ff4d4f" : "#3a1f20"} />
      <circle cx={tlx} cy={tly + 14} r="3.4" fill="#3a3622" />
      <circle cx={tlx} cy={tly + 23} r="3.4" fill="#1e3326" />
      {redLight && <circle cx={tlx} cy={tly + 5} r="9" fill="url(#sf-cross-redglow)" />}
    </g>
  );
}

function Highway() {
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sf-hw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13161d" />
          <stop offset="1" stopColor="#0a0b0d" />
        </linearGradient>
        <linearGradient id="sf-hw-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#171a1e" />
          <stop offset="1" stopColor="#090a0b" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={VW} height={VH} fill="url(#sf-hw-sky)" />
      <line x1="0" y1={VPY} x2={VW} y2={VPY} stroke="#2ecf7e" strokeOpacity="0.1" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {/* wide multi-lane carriageway */}
      <path d={`M${-20} ${VH} L${VW + 20} ${VH} L${VPX + 34} ${VPY} L${VPX - 34} ${VPY} Z`} fill="url(#sf-hw-road)" />
      <LaneLines color="#cfd3da" count={2} opacity={0.42} />
      {/* guardrails along both edges */}
      <line x1={VPX - 34} y1={VPY} x2={-18} y2={VH} stroke="#6b7280" strokeOpacity="0.55" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <line x1={VPX + 34} y1={VPY} x2={VW + 18} y2={VH} stroke="#6b7280" strokeOpacity="0.55" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {/* guardrail posts */}
      {[0.2, 0.42, 0.7].map((t, i) => {
        const y = VPY + (VH - VPY) * t;
        const lx = VPX - 34 - (VPX + 14) * t;
        const rx = VPX + 34 + (VPX + 14) * t;
        return (
          <g key={i} stroke="#4b515c" strokeOpacity="0.5" strokeWidth="1" vectorEffect="non-scaling-stroke">
            <line x1={lx} y1={y} x2={lx} y2={y + 6 + t * 8} />
            <line x1={rx} y1={y} x2={rx} y2={y + 6 + t * 8} />
          </g>
        );
      })}
    </g>
  );
}

function Alley() {
  const ax = VW / 2;
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sf-alley-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14110d" />
          <stop offset="1" stopColor="#0a0908" />
        </linearGradient>
        <linearGradient id="sf-alley-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b1814" />
          <stop offset="1" stopColor="#0d0c0a" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={VW} height={VH} fill="url(#sf-alley-bg)" />
      {/* narrow corridor: two converging walls */}
      <path d={`M0 0 L${VPX - 16} ${VPY} L${VPX - 16} ${VH} L0 ${VH} Z`} fill="url(#sf-alley-wall)" />
      <path d={`M${VW} 0 L${VPX + 16} ${VPY} L${VPX + 16} ${VH} L${VW} ${VH} Z`} fill="url(#sf-alley-wall)" transform={`scale(-1,1) translate(${-VW},0)`} />
      {/* floor */}
      <path d={`M${VPX - 16} ${VH} L${VPX + 16} ${VH} L${VPX + 16} ${VPY} L${VPX - 16} ${VPY} Z`} fill="#100f0d" />
      {/* one-way directional arrow painted on the narrow floor */}
      <g stroke="#ffb020" strokeOpacity="0.7" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke">
        <line x1={ax} y1={VH - 12} x2={ax} y2={VH * 0.62} />
        <path d={`M${ax - 6} ${VH * 0.62 + 9} L${ax} ${VH * 0.62} L${ax + 6} ${VH * 0.62 + 9}`} />
      </g>
      {/* faint wall seam lines */}
      <line x1={VPX - 16} y1={VPY} x2={VPX - 16} y2={VH} stroke="#9aa1aa" strokeOpacity="0.18" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1={VPX + 16} y1={VPY} x2={VPX + 16} y2={VH} stroke="#9aa1aa" strokeOpacity="0.18" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function SceneBackdrop({ event }: { event: ViolationEvent }) {
  switch (event.scene) {
    case "street-night":
      return <StreetNight />;
    case "intersection":
      return <Intersection redLight={event.violation === "terobos-lampu-merah"} />;
    case "highway":
      return <Highway />;
    case "alley":
      return <Alley />;
    case "street-day":
    default:
      return <StreetDay />;
  }
}

/* -------------------------------------------------------------------------- */
/*  Detection overlay                                                          */
/* -------------------------------------------------------------------------- */

function DetectionBox({ event }: { event: ViolationEvent }) {
  const { bbox } = event;
  if (!bbox) return null;
  const isSelf = event.subject === "self";
  const tone = isSelf ? "amber" : "signal";
  const meta = VIOLATION_CATALOG[event.violation];
  const pct = Math.round(event.confidence * 100);

  // Place above the box when there's room, otherwise below it.
  const chipBelow = bbox.y < 0.16;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${bbox.x * 100}%`,
        top: `${bbox.y * 100}%`,
        width: `${bbox.w * 100}%`,
        height: `${bbox.h * 100}%`,
      }}
    >
      {/* the detection rectangle */}
      <div
        className={cn(
          "absolute inset-0 border",
          isSelf ? "border-amber/70 bg-amber/5" : "border-signal/70 bg-signal/5",
        )}
      >
        <CornerBrackets tone={tone} />
      </div>

      {/* floating label chip with violation + confidence */}
      <div
        className={cn(
          "absolute left-0 flex items-center gap-1.5 whitespace-nowrap border px-1.5 py-0.5",
          "bg-ink/85 text-[0.6rem] uppercase tracking-[0.12em] mono backdrop-blur-sm",
          isSelf ? "border-amber/50 text-amber" : "border-signal/50 text-signal",
          chipBelow ? "top-full mt-1" : "bottom-full mb-1",
        )}
      >
        <StatusDot tone={tone} pulse={!isSelf} />
        <span className="font-semibold">{meta.labelId}</span>
        <span className="text-fg/80">{pct}%</span>
      </div>

      {/* subject tag */}
      <div
        className={cn(
          "absolute right-0 border px-1 py-0.5 text-[0.55rem] uppercase tracking-[0.14em] mono backdrop-blur-sm bg-ink/85",
          chipBelow ? "top-full mt-1" : "bottom-full mb-1",
          isSelf ? "border-amber/50 text-amber" : "border-signal/50 text-signal",
        )}
      >
        {isSelf ? "DIRI SENDIRI" : "TARGET"}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Evidence-frame chrome (top / bottom strips)                                */
/* -------------------------------------------------------------------------- */

function TopStrip({ event }: { event: ViolationEvent }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-2 py-1.5 text-[0.6rem] mono">
      <span className="flex items-center gap-1.5 text-signal">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-signal blink" aria-hidden="true" />
        <span className="font-semibold tracking-[0.16em]">REC</span>
      </span>
      <span className="text-fg/85 tracking-[0.08em]" suppressHydrationWarning>
        {fmtTime(event.capturedAt)}
      </span>
    </div>
  );
}

function BottomStrip({ event }: { event: ViolationEvent }) {
  const plate = event.plateText;
  const speed =
    event.subject === "self" ? event.egoSpeedKmh : event.otherSpeedKmh;
  const limit = event.speedLimitKmh;
  const over = speed != null && limit != null && speed > limit;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-2 py-1.5 text-[0.6rem] mono">
      <span className="flex items-center gap-1.5">
        <span className="label !text-[0.5rem] text-dim">PLAT</span>
        {plate ? (
          // plate intentionally blurred to indicate privacy / pending review
          <span className="select-none text-fg/90 blur-sm" aria-hidden="true">
            {plate}
          </span>
        ) : (
          <span className="text-signal">— TIDAK TERBACA</span>
        )}
      </span>
      {speed != null && (
        <span className="flex items-center gap-1">
          <span className={cn(over ? "text-signal" : "text-fg/90")}>{speed}</span>
          <span className="text-dim">
            {limit != null ? `/${limit}` : ""} KM/J
          </span>
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public components                                                          */
/* -------------------------------------------------------------------------- */

export function SceneFrame({
  event,
  className,
  showOverlay = true,
}: {
  event: ViolationEvent;
  className?: string;
  showOverlay?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={describe(event)}
      className={cn(
        "relative aspect-video w-full overflow-hidden border border-line bg-ink",
        className,
      )}
    >
      {/* synthetic scene */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <SceneBackdrop event={event} />
      </svg>

      {/* atmosphere overlays */}
      <div className="pointer-events-none absolute inset-0 scanlines opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 noise opacity-[0.07] mix-blend-overlay" aria-hidden="true" />
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {showOverlay && (
        <>
          {/* sweeping scan line */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="scan-line h-px w-full bg-amber/40 shadow-[0_0_8px_rgba(255,176,32,0.5)]" />
          </div>

          <TopStrip event={event} />
          <DetectionBox event={event} />
          <BottomStrip event={event} />

          {/* outer HUD reticle */}
          <CornerBrackets tone="neutral" />
        </>
      )}
    </div>
  );
}

/** Compact, chrome-free variant for lists/grids — scene backdrop + bbox only. */
export function SceneThumb({
  event,
  className,
}: {
  event: ViolationEvent;
  className?: string;
}) {
  const isSelf = event.subject === "self";
  return (
    <div
      role="img"
      aria-label={describe(event)}
      className={cn(
        "relative aspect-video w-full overflow-hidden border border-line bg-ink",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <SceneBackdrop event={event} />
      </svg>
      <div className="pointer-events-none absolute inset-0 scanlines opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 noise opacity-[0.06] mix-blend-overlay" aria-hidden="true" />

      {/* minimal bbox marker */}
      {event.bbox && (
        <div
          className={cn(
            "pointer-events-none absolute border",
            isSelf ? "border-amber/70 bg-amber/5" : "border-signal/70 bg-signal/5",
          )}
          style={{
            left: `${event.bbox.x * 100}%`,
            top: `${event.bbox.y * 100}%`,
            width: `${event.bbox.w * 100}%`,
            height: `${event.bbox.h * 100}%`,
          }}
        />
      )}

      {/* tiny REC dot */}
      <span
        className="pointer-events-none absolute left-1.5 top-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-signal blink"
        aria-hidden="true"
      />
    </div>
  );
}
