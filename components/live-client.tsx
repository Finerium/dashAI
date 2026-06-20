"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Square } from "lucide-react";

import { CVPipeline } from "@/lib/cv/pipeline";
import type { FrameAnalysis } from "@/lib/cv/types";
import { ViolationEngine, type EngineContext } from "@/lib/violations/engine";
import { watchLocation, isGeolocationAvailable } from "@/lib/geo/location";
import { resolveRoadContext } from "@/lib/geo/osm";
import {
  isMotionAvailable,
  requestMotionPermission,
  startMotionDetection,
} from "@/lib/sensors/motion";
import { saveEvent } from "@/lib/evidence/store";
import { useSession } from "@/lib/state/session";
import type {
  GeoPoint,
  RoadContext,
  SealedEvidence,
  ViolationEvent,
} from "@/lib/evidence/types";
import { VIOLATION_CATALOG } from "@/lib/legal/catalog";
import { citationFor } from "@/lib/legal/citations";

import { DetectionOverlay } from "@/components/detection-overlay";
import { CitationBreakdown } from "@/components/citation-breakdown";
import {
  CornerBrackets,
  StatusDot,
  Tag,
  buttonClass,
} from "@/components/ui";
import { cn, mpsToKmh, uid } from "@/lib/utils";

// Analysis loop is throttled — running heavy CV every animation frame melts
// mobile devices and starves the UI thread. ~13 fps is plenty for enforcement.
const ANALYZE_INTERVAL_MS = 75; // ~13 fps
// Road context lookups hit the network (OSM Overpass); debounce hard.
const ROAD_LOOKUP_MS = 8000;

type GuMErrorKind = "denied" | "insecure" | "unavailable" | "generic";

function classifyGetUserMediaError(err: unknown): GuMErrorKind {
  if (typeof window !== "undefined" && !window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "unavailable";
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "NotReadableError") return "unavailable";
  return "generic";
}

const ERROR_COPY: Record<GuMErrorKind, { title: string; body: string }> = {
  denied: {
    title: "Akses kamera ditolak",
    body: "Izinkan akses kamera di pengaturan peramban, lalu mulai ulang pemindaian.",
  },
  insecure: {
    title: "Butuh koneksi aman (HTTPS)",
    body: "Kamera hanya dapat diakses melalui HTTPS atau localhost. Buka situs lewat koneksi aman.",
  },
  unavailable: {
    title: "Kamera tidak tersedia",
    body: "Tidak ada kamera yang dapat digunakan, atau sedang dipakai aplikasi lain.",
  },
  generic: {
    title: "Gagal memulai kamera",
    body: "Terjadi kesalahan saat mengakses kamera. Periksa perangkat lalu coba lagi.",
  },
};

export function LiveClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<CVPipeline | null>(null);
  const engineRef = useRef<ViolationEngine | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopGeoRef = useRef<(() => void) | null>(null);
  const stopMotionRef = useRef<(() => void) | null>(null);
  const lastAnalyzeRef = useRef(0);
  const lastRoadLookupRef = useRef(0);
  const roadAbortRef = useRef<AbortController | null>(null);
  const fpsStampsRef = useRef<number[]>([]);

  // Latest geo/road context, kept in a ref so the rAF loop reads fresh values
  // without re-subscribing each frame.
  const geoCtxRef = useRef<{
    road: RoadContext | null;
    egoSpeedKmh: number | null;
    headingDeg: number | null;
  }>({ road: null, egoSpeedKmh: null, headingDeg: null });

  const status = useSession((s) => s.status);
  const statusMessage = useSession((s) => s.statusMessage);
  const pipeline = useSession((s) => s.pipeline);
  const fps = useSession((s) => s.fps);
  const detectionCount = useSession((s) => s.detectionCount);
  const events = useSession((s) => s.events);
  const road = useSession((s) => s.road);
  const egoSpeedKmh = useSession((s) => s.egoSpeedKmh);

  const setStatus = useSession((s) => s.setStatus);
  const setPipeline = useSession((s) => s.setPipeline);
  const setFps = useSession((s) => s.setFps);
  const setDetectionCount = useSession((s) => s.setDetectionCount);
  const setGeo = useSession((s) => s.setGeo);
  const addEvent = useSession((s) => s.addEvent);
  const updateEvent = useSession((s) => s.updateEvent);
  const reset = useSession((s) => s.reset);

  const [errorKind, setErrorKind] = useState<GuMErrorKind | null>(null);
  const [frame, setFrame] = useState<FrameAnalysis | null>(null);

  // ---- frame capture: snapshot the current video frame to a data URL ----
  const captureFrame = useCallback((): string | undefined => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return undefined;
    // Cap the longest edge so the sealed evidence stays light.
    const maxEdge = 960;
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.6);
    } catch {
      return undefined;
    }
  }, []);

  // ---- seal an event server-side, then mark it sealed locally ----
  const sealEvent = useCallback(
    async (event: ViolationEvent) => {
      try {
        const res = await fetch("/api/seal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            device: {
              userAgent:
                typeof navigator !== "undefined" ? navigator.userAgent : undefined,
              platform:
                typeof navigator !== "undefined" ? navigator.platform : undefined,
            },
          }),
        });
        if (!res.ok) return;
        const seal = (await res.json()) as SealedEvidence;
        const patch = { sealed: true as const, seal };
        updateEvent(event.id, patch);
        // Persist the sealed version too (best-effort, no-op on server).
        void saveEvent({ ...event, ...patch });
      } catch {
        /* sealing is best-effort; the event is still stored locally */
      }
    },
    [updateEvent],
  );

  // ---- main analysis loop ----
  const startLoop = useCallback(() => {
    const tick = async () => {
      rafRef.current = requestAnimationFrame(tick);
      const video = videoRef.current;
      const pipe = pipelineRef.current;
      const engine = engineRef.current;
      if (!video || !pipe || !engine || video.readyState < 2) return;

      const now = performance.now();
      if (now - lastAnalyzeRef.current < ANALYZE_INTERVAL_MS) return;
      lastAnalyzeRef.current = now;

      let analysis: FrameAnalysis;
      try {
        analysis = await pipe.analyze(video, now);
      } catch {
        return; // a single bad frame must never kill the loop
      }
      setFrame(analysis);
      setDetectionCount(analysis.detections.length);

      // rolling FPS over the last ~1s of analyzed frames
      const stamps = fpsStampsRef.current;
      stamps.push(now);
      while (stamps.length && now - stamps[0] > 1000) stamps.shift();
      setFps(stamps.length);

      const hour = new Date().getHours();
      const ctx: EngineContext = {
        road: geoCtxRef.current.road,
        egoSpeedKmh: geoCtxRef.current.egoSpeedKmh,
        egoHeadingDeg: geoCtxRef.current.headingDeg,
        isNight: hour < 6 || hour >= 18,
        trafficLightState: null,
      };

      const candidates = engine.update(analysis, ctx, Date.now());
      if (candidates.length) {
        const frameImg = captureFrame();
        for (const c of candidates) {
          const event: ViolationEvent = {
            id: uid(),
            violation: c.violation,
            subject: c.subject,
            confidence: c.confidence,
            capturedAt: Date.now(),
            frame: frameImg,
            vehicleClass: c.vehicleClass,
            egoSpeedKmh: c.egoSpeedKmh ?? null,
            otherSpeedKmh: c.otherSpeedKmh ?? null,
            speedLimitKmh: c.speedLimitKmh ?? null,
            road: geoCtxRef.current.road,
            bbox: c.bbox,
            notes: c.notes,
            sealed: false,
          };
          addEvent(event);
          void saveEvent(event);
          void sealEvent(event);
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [addEvent, captureFrame, sealEvent, setDetectionCount, setFps]);

  // ---- geolocation + road context wiring ----
  const startGeo = useCallback(() => {
    if (!isGeolocationAvailable()) return;
    stopGeoRef.current = watchLocation(
      (geo: GeoPoint) => {
        const ego = mpsToKmh(geo.speedMps);
        geoCtxRef.current.egoSpeedKmh = ego;
        geoCtxRef.current.headingDeg = geo.headingDeg ?? null;
        setGeo(geo, geoCtxRef.current.road, ego);

        // Debounced, cancellable road-context lookup.
        const now = performance.now();
        if (now - lastRoadLookupRef.current < ROAD_LOOKUP_MS) return;
        lastRoadLookupRef.current = now;
        roadAbortRef.current?.abort();
        const ac = new AbortController();
        roadAbortRef.current = ac;
        void resolveRoadContext(geo.lat, geo.lng, ac.signal)
          .then((rc) => {
            if (ac.signal.aborted || !rc) return;
            geoCtxRef.current.road = rc;
            setGeo(geo, rc, geoCtxRef.current.egoSpeedKmh);
          })
          .catch(() => {});
      },
      () => {
        /* geo errors are non-fatal — speed/road features simply degrade */
      },
    );
  }, [setGeo]);

  // ---- collision / hard-brake auto-capture ----
  const startMotion = useCallback(async () => {
    if (!isMotionAvailable()) return;
    const granted = await requestMotionPermission();
    if (!granted) return;
    stopMotionRef.current = startMotionDetection((m) => {
      const frameImg = captureFrame();
      const event: ViolationEvent = {
        id: uid(),
        violation: "melebihi-kecepatan", // placeholder key; flagged via notes
        subject: "self",
        confidence: 0.6,
        capturedAt: m.at,
        frame: frameImg,
        egoSpeedKmh: geoCtxRef.current.egoSpeedKmh ?? null,
        road: geoCtxRef.current.road,
        notes:
          m.kind === "impact"
            ? `Dugaan benturan terdeteksi (${m.peakG} g). Rekaman diamankan otomatis.`
            : `Pengereman keras terdeteksi (${m.peakG} g).`,
        sealed: false,
      };
      addEvent(event);
      void saveEvent(event);
      void sealEvent(event);
    });
  }, [addEvent, captureFrame, sealEvent]);

  // ---- teardown ----
  const teardown = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    stopGeoRef.current?.();
    stopGeoRef.current = null;
    stopMotionRef.current?.();
    stopMotionRef.current = null;
    roadAbortRef.current?.abort();
    roadAbortRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    pipelineRef.current?.dispose();
    pipelineRef.current = null;
    engineRef.current = null;
    fpsStampsRef.current = [];
    setFrame(null);
  }, []);

  // ---- start the full live session ----
  const handleStart = useCallback(async () => {
    setErrorKind(null);
    setStatus("starting", "Meminta akses kamera…");

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setErrorKind("insecure");
      setStatus("error", "Butuh koneksi aman");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
    } catch (err) {
      const kind = classifyGetUserMediaError(err);
      setErrorKind(kind);
      setStatus("error", ERROR_COPY[kind].title);
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay may resolve late; muted+playsInline normally allows it */
    }

    setStatus("running", "Memuat model deteksi…");
    engineRef.current = new ViolationEngine();
    const pipe = new CVPipeline();
    pipelineRef.current = pipe;
    try {
      await pipe.load((s) => setPipeline(s));
    } catch {
      // Object detector is mandatory; if it fails, abort cleanly.
      setErrorKind("generic");
      setStatus("error", "Gagal memuat model deteksi");
      teardown();
      return;
    }

    setStatus("running", "Pemindaian aktif");
    startGeo();
    void startMotion();
    startLoop();
  }, [setPipeline, setStatus, startGeo, startLoop, startMotion, teardown]);

  // ---- stop ----
  const handleStop = useCallback(() => {
    teardown();
    reset();
  }, [reset, teardown]);

  // Clean up everything on unmount.
  useEffect(() => {
    return () => {
      teardown();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRunning = status === "running";
  const isStarting = status === "starting";
  const overLimit =
    egoSpeedKmh != null &&
    road?.maxspeedKmh != null &&
    egoSpeedKmh > road.maxspeedKmh;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Mode operasi</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            Pemindaian <span className="text-amber">Live</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting}
              className={buttonClass("primary", isStarting ? "opacity-70" : "")}
              aria-label="Mulai pemindaian live"
            >
              <Camera className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              {isStarting ? "Memulai…" : "Mulai"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className={buttonClass("secondary")}
              aria-label="Hentikan pemindaian"
            >
              <Square className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Stop
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---- stage ---- */}
        <section
          className="relative overflow-hidden border border-line-strong bg-ink-2"
          aria-label="Tampilan kamera live"
        >
          <CornerBrackets tone={isRunning ? "amber" : "neutral"} />
          <div className="scanlines pointer-events-none absolute inset-0 z-20 opacity-40" />

          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* CV overlay (boxes / faces / poses) drawn over the video */}
            {frame && (
              <div className="absolute inset-0 z-10">
                <DetectionOverlay frame={frame} />
              </div>
            )}
            {/* idle / error states */}
            {!isRunning && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-ink/85 p-6 text-center">
                {errorKind ? (
                  <ErrorPanel kind={errorKind} />
                ) : (
                  <div className="max-w-sm">
                    <p className="label">Kamera siaga</p>
                    <p className="mt-2 text-sm text-muted text-balance">
                      Tekan{" "}
                      <span className="text-amber">Mulai</span> untuk mengaktifkan
                      kamera dan analisis pelanggaran di perangkat.
                    </p>
                    {statusMessage && status !== "error" && (
                      <p className="label mt-3 text-amber">{statusMessage}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* top HUD bar */}
          <HudBar
            running={isRunning}
            fps={fps}
            detectionCount={detectionCount}
            egoSpeedKmh={egoSpeedKmh}
            maxspeedKmh={road?.maxspeedKmh ?? null}
            overLimit={overLimit}
            roadName={road?.name ?? null}
            oneway={road?.oneway ?? false}
            pipeline={pipeline}
          />
        </section>

        {/* ---- violation feed ---- */}
        <aside aria-label="Umpan pelanggaran" className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <span className="label">Pelanggaran terdeteksi</span>
            <span className="mono text-xs text-dim">{events.length}</span>
          </div>
          <div className="flex flex-col gap-3 lg:max-h-[70dvh] lg:overflow-y-auto lg:pr-1">
            {events.length === 0 ? (
              <p className="border border-dashed border-line px-4 py-8 text-center text-sm text-dim">
                Belum ada pelanggaran terdeteksi.
              </p>
            ) : (
              events.map((e) => <EventCard key={e.id} event={e} />)
            )}
          </div>
        </aside>
      </div>

      {/* hidden canvas used for frame capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HUD status bar                                                       */
/* ------------------------------------------------------------------ */

function HudBar({
  running,
  fps,
  detectionCount,
  egoSpeedKmh,
  maxspeedKmh,
  overLimit,
  roadName,
  oneway,
  pipeline,
}: {
  running: boolean;
  fps: number;
  detectionCount: number;
  egoSpeedKmh: number | null;
  maxspeedKmh: number | null;
  overLimit: boolean;
  roadName: string | null;
  oneway: boolean;
  pipeline: { object: boolean; face: boolean; pose: boolean };
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-gradient-to-b from-ink/90 to-transparent px-3 py-2 text-xs">
      <span className="mono flex items-center gap-1.5 font-semibold text-signal">
        <span className={cn("inline-block h-2 w-2 rounded-full bg-signal", running && "blink")} />
        REC
      </span>
      <span className="mono text-muted">
        <span className="text-dim">FPS</span> {running ? fps : 0}
      </span>
      <span className="mono text-muted">
        <span className="text-dim">DET</span> {detectionCount}
      </span>
      <span className={cn("mono", overLimit ? "text-signal" : "text-muted")}>
        <span className="text-dim">SPD</span>{" "}
        {egoSpeedKmh != null ? `${egoSpeedKmh}` : "—"}
        {maxspeedKmh != null && <span className="text-dim">/{maxspeedKmh}</span>}
        <span className="text-dim"> km/j</span>
      </span>
      {roadName && (
        <span className="mono flex items-center gap-1.5 truncate text-muted">
          <span className="text-dim">JLN</span>
          <span className="max-w-[10rem] truncate">{roadName}</span>
          {oneway && (
            <span className="border border-amber/40 px-1 text-[0.6rem] uppercase text-amber">
              1-arah
            </span>
          )}
        </span>
      )}
      <span className="ml-auto flex items-center gap-2">
        <ModelDot label="OBJ" on={pipeline.object} />
        <ModelDot label="FACE" on={pipeline.face} />
        <ModelDot label="POSE" on={pipeline.pose} />
      </span>
    </div>
  );
}

function ModelDot({ label, on }: { label: string; on: boolean }) {
  return (
    <span className="mono flex items-center gap-1 text-[0.6rem] text-dim">
      <StatusDot tone={on ? "verified" : "neutral"} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Violation feed card                                                 */
/* ------------------------------------------------------------------ */

function EventCard({ event }: { event: ViolationEvent }) {
  const [open, setOpen] = useState(false);
  const meta = VIOLATION_CATALOG[event.violation];
  const citation = citationFor(event.violation);
  const subjectTone = event.subject === "self" ? "amber" : "signal";

  return (
    <article className="relative border border-line bg-surface/40 p-3">
      <CornerBrackets tone={event.sealed ? "verified" : "signal"} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">
            {meta?.labelId ?? event.violation}
          </h3>
          <p className="mono mt-0.5 text-[0.65rem] text-dim">
            {new Date(event.capturedAt).toLocaleTimeString("id-ID")}
          </p>
        </div>
        <Tag tone={subjectTone}>
          {event.subject === "self" ? "Diri" : "Lain"}
        </Tag>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="mono text-xs text-muted">
          <span className="text-dim">Keyakinan</span>{" "}
          {Math.round(event.confidence * 100)}%
        </span>
        {event.sealed ? (
          <Tag tone="verified">Tersegel</Tag>
        ) : (
          <Tag tone="amber" className="shimmer">
            Menyegel…
          </Tag>
        )}
      </div>

      {event.notes && (
        <p className="mt-2 text-xs text-muted text-balance">{event.notes}</p>
      )}

      {citation && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mono mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-amber hover:underline"
          aria-expanded={open}
        >
          {open ? "Tutup dasar hukum" : "Lihat dasar hukum"}
        </button>
      )}

      {open && (
        <div className="mt-2 border-t border-line pt-2">
          <CitationBreakdown violation={event.violation} compact />
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Error panel                                                         */
/* ------------------------------------------------------------------ */

function ErrorPanel({ kind }: { kind: GuMErrorKind }) {
  const copy = ERROR_COPY[kind];
  return (
    <div className="relative max-w-sm border border-signal/40 bg-signal/5 p-5 text-left">
      <CornerBrackets tone="signal" />
      <div className="flex items-center gap-2 text-signal">
        <AlertTriangle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        <span className="label text-signal">{copy.title}</span>
      </div>
      <p className="mt-2 text-sm text-muted text-balance">{copy.body}</p>
      <Link href="/review" className={buttonClass("secondary", "mt-4")}>
        Lihat mode demo
      </Link>
    </div>
  );
}
