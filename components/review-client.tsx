"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Database,
  Lock,
  FileDown,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { SceneFrame } from "@/components/scene-frame";
import { CitationBreakdown } from "@/components/citation-breakdown";
import { SealBadge } from "@/components/seal-badge";
import {
  CornerBrackets,
  StatusDot,
  Tag,
  DataRow,
  SectionLabel,
  buttonClass,
} from "@/components/ui";
import { DEMO_EVENTS } from "@/lib/demo/samples";
import { getAllEvents, saveEvent } from "@/lib/evidence/store";
import { VIOLATION_CATALOG } from "@/lib/legal/catalog";
import type {
  ViolationEvent,
  Subject,
  SealedEvidence,
} from "@/lib/evidence/types";
import { cn, fmtTime } from "@/lib/utils";

type SubjectFilter = "all" | Subject;

const SUBJECT_TABS: { key: SubjectFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "other", label: "Pihak lain" },
  { key: "self", label: "Diri sendiri" },
];

/** base64url of an arbitrary UTF-8 string (safe for use in a URL query). */
function toBase64Url(input: string): string {
  // encodeURIComponent → percent-escape → raw bytes → btoa, then url-safe.
  const bytes = encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Merge demo + stored events, dedupe by id (stored wins), newest first. */
function mergeEvents(stored: ViolationEvent[]): ViolationEvent[] {
  const byId = new Map<string, ViolationEvent>();
  for (const e of DEMO_EVENTS) byId.set(e.id, e);
  for (const e of stored) byId.set(e.id, e); // stored overrides demo
  return [...byId.values()].sort((a, b) => b.capturedAt - a.capturedAt);
}

export function ReviewClient() {
  const [events, setEvents] = useState<ViolationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SubjectFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "seal" | "report">(null);
  const [error, setError] = useState<string | null>(null);

  // ---- load on mount ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = await getAllEvents();
        if (!alive) return;
        const merged = mergeEvents(stored);
        setEvents(merged);
        setActiveId((prev) => prev ?? merged[0]?.id ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.subject === filter)),
    [events, filter],
  );

  const active = useMemo(
    () => filtered.find((e) => e.id === activeId) ?? filtered[0] ?? null,
    [filtered, activeId],
  );

  // Keep selection valid when the filter changes.
  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.some((e) => e.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  /** Persist an updated event into state + IndexedDB. */
  async function persist(updated: ViolationEvent) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    try {
      await saveEvent(updated);
    } catch {
      /* IndexedDB is best-effort; in-memory state is the source of truth here */
    }
  }

  /** Seal an event via /api/seal, returning the sealed envelope. */
  async function sealEvent(event: ViolationEvent): Promise<SealedEvidence> {
    const res = await fetch("/api/seal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => null);
      throw new Error(msg?.error ?? "Gagal menyegel bukti.");
    }
    const seal = (await res.json()) as SealedEvidence;
    const updated: ViolationEvent = { ...event, sealed: true, seal };
    await persist(updated);
    return seal;
  }

  async function handleSeal(event: ViolationEvent) {
    setError(null);
    setBusy("seal");
    try {
      await sealEvent(event);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyegel bukti.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReport(event: ViolationEvent) {
    setError(null);
    setBusy("report");
    try {
      // Seal first if needed, so the report always embeds a valid envelope.
      const seal = event.seal ?? (await sealEvent(event));
      const kind = event.subject === "self" ? "coaching" : "tilang";
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sealed: seal, kind }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.error ?? "Gagal membuat laporan PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashAI-${kind}-${event.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat laporan PDF.");
    } finally {
      setBusy(null);
    }
  }

  // ---------- render ----------
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <header className="fade-up">
        <SectionLabel index="04">Arsip forensik</SectionLabel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database
              size={22}
              strokeWidth={1.5}
              className="text-amber"
              aria-hidden
            />
            <h1 className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Penyimpanan Bukti
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot tone="verified" />
            <span className="mono text-xs text-dim">
              {events.length} bukti tersimpan
            </span>
          </div>
        </div>

        {/* Subject filter */}
        <div
          aria-label="Saring berdasarkan subjek"
          className="mt-6 flex flex-wrap gap-2"
        >
          {SUBJECT_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? events.length
                : events.filter((e) => e.subject === tab.key).length;
            const selected = filter === tab.key;
            return (
              <button
                key={tab.key}
                aria-pressed={selected}
                aria-label={`Saring: ${tab.label}`}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "mono inline-flex items-center gap-2 border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors",
                  selected
                    ? "border-amber/60 bg-amber/10 text-amber"
                    : "border-line text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {tab.label}
                <span className={selected ? "text-amber/70" : "text-dim"}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Body */}
      {loading ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* List / grid of events */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {filtered.map((event, i) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  active={active?.id === event.id}
                  onSelect={() => setActiveId(event.id)}
                  index={i}
                />
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="hud-frame bg-ink-2/40 p-6 text-center text-sm text-dim">
                Tidak ada bukti untuk filter ini.
              </li>
            )}
          </ul>

          {/* Detail panel */}
          {active ? (
            <DetailPanel
              event={active}
              busy={busy}
              error={error}
              onSeal={() => handleSeal(active)}
              onReport={() => handleReport(active)}
            />
          ) : (
            <div className="hud-frame bg-ink-2/40 p-8 text-center text-sm text-dim">
              Pilih bukti untuk melihat rincian.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function EventCard({
  event,
  active,
  onSelect,
  index,
}: {
  event: ViolationEvent;
  active: boolean;
  onSelect: () => void;
  index: number;
}) {
  const meta = VIOLATION_CATALOG[event.violation];
  const subjectTone = event.subject === "self" ? "amber" : "signal";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className={cn(
        "fade-up group relative block w-full overflow-hidden border bg-ink-2/40 p-4 text-left transition-colors",
        active
          ? "border-amber/60 bg-amber/[0.04]"
          : "border-line hover:border-line-strong",
      )}
    >
      {active && <CornerBrackets tone="amber" />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">
            {meta.labelId}
          </p>
          <p className="mono mt-1 text-[0.7rem] text-dim">
            {fmtTime(event.capturedAt)}
          </p>
        </div>
        <SealBadge state={event.sealed ? "sealed" : "unsealed"} size="sm" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Tag tone={subjectTone}>
          {event.subject === "self" ? "Diri sendiri" : "Pihak lain"}
        </Tag>
        <span className="mono text-[0.7rem] text-muted">
          {Math.round(event.confidence * 100)}% yakin
        </span>
        {event.demo && (
          <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-dim">
            demo
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------

function DetailPanel({
  event,
  busy,
  error,
  onSeal,
  onReport,
}: {
  event: ViolationEvent;
  busy: null | "seal" | "report";
  error: string | null;
  onSeal: () => void;
  onReport: () => void;
}) {
  const road = event.road;
  const loc = event.location;
  const verifyHref = event.seal
    ? `/verify?d=${toBase64Url(JSON.stringify(event.seal))}`
    : null;

  return (
    <section className="fade-up space-y-6" aria-label="Rincian bukti">
      {/* Big scene frame */}
      <div className="relative">
        <SceneFrame event={event} showOverlay />
      </div>

      {/* Data rows */}
      <div className="hud-frame relative bg-ink-2/60 p-5">
        <CornerBrackets tone={event.sealed ? "verified" : "neutral"} />
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="label">Berkas pengukuran</p>
          <SealBadge
            state={event.sealed ? "sealed" : "unsealed"}
            size="md"
          />
        </div>
        <DataRow
          label="Subjek"
          value={event.subject === "self" ? "Diri sendiri" : "Pihak lain"}
          tone={event.subject === "self" ? "amber" : "signal"}
        />
        <DataRow label="Waktu kejadian" value={fmtTime(event.capturedAt)} />
        <DataRow
          label="Kepercayaan"
          value={`${Math.round(event.confidence * 100)}%`}
        />
        <DataRow
          label="Kecepatan pemilik"
          value={event.egoSpeedKmh != null ? `${event.egoSpeedKmh} km/j` : "—"}
        />
        <DataRow
          label="Kecepatan pihak lain"
          value={
            event.otherSpeedKmh != null
              ? `${event.otherSpeedKmh} km/j ± est`
              : "—"
          }
        />
        <DataRow
          label="Batas kecepatan"
          value={
            event.speedLimitKmh != null ? `${event.speedLimitKmh} km/j` : "—"
          }
          tone={
            event.speedLimitKmh != null &&
            event.otherSpeedKmh != null &&
            event.otherSpeedKmh > event.speedLimitKmh
              ? "signal"
              : undefined
          }
        />
        <DataRow label="Ruas" value={road?.name ?? "—"} />
        <DataRow
          label="Koordinat"
          value={
            loc
              ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
              : "—"
          }
        />
      </div>

      {/* Legal citation */}
      <CitationBreakdown violation={event.violation} confidence={event.confidence} />

      {/* Actions */}
      <div className="hud-frame relative bg-ink-2/60 p-5">
        <CornerBrackets tone="amber" />
        <p className="label mb-4">Tindakan</p>

        {error && (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 border border-signal/40 bg-signal/10 px-3 py-2 text-xs text-signal"
          >
            <AlertTriangle size={14} strokeWidth={1.5} className="mt-px shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!event.sealed && (
            <button
              type="button"
              onClick={onSeal}
              disabled={busy !== null}
              className={buttonClass("primary", "disabled:opacity-50")}
            >
              {busy === "seal" ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
              ) : (
                <Lock size={16} strokeWidth={1.5} aria-hidden />
              )}
              Segel bukti
            </button>
          )}

          <button
            type="button"
            onClick={onReport}
            disabled={busy !== null}
            className={buttonClass(
              event.sealed ? "secondary" : "primary",
              "disabled:opacity-50",
            )}
            title={
              event.sealed
                ? undefined
                : "Bukti akan disegel terlebih dahulu, lalu laporan dibuat."
            }
          >
            {busy === "report" ? (
              <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
            ) : (
              <FileDown size={16} strokeWidth={1.5} aria-hidden />
            )}
            Unduh Laporan PDF
          </button>

          {event.sealed && verifyHref && (
            <Link
              href={verifyHref}
              className={buttonClass("secondary")}
            >
              <ShieldCheck size={16} strokeWidth={1.5} aria-hidden />
              Halaman verifikasi
            </Link>
          )}
        </div>

        {event.sealed && (
          <p className="mono mt-4 text-[0.7rem] text-dim">
            Disegel kriptografis (Ed25519) — payload tidak dapat diubah tanpa
            terdeteksi.
          </p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 text-dim">
      <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-amber" aria-hidden />
      <p className="mono text-xs uppercase tracking-[0.14em]">Memuat arsip bukti…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 hud-frame relative bg-ink-2/40 p-10 text-center">
      <CornerBrackets tone="neutral" />
      <Database
        size={28}
        strokeWidth={1.5}
        className="mx-auto mb-4 text-dim"
        aria-hidden
      />
      <h2 className="text-lg font-semibold text-fg">Belum ada bukti</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Bukti pelanggaran yang terdeteksi akan muncul di sini. Mulai pemantauan
        untuk merekam dan menyegel bukti.
      </p>
      <Link href="/live" className={buttonClass("primary", "mt-6")}>
        Mulai pemantauan
      </Link>
    </div>
  );
}
