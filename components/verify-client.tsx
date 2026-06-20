"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  ClipboardPaste,
  Loader2,
  FileSearch,
  Info,
} from "lucide-react";
import {
  CornerBrackets,
  StatusDot,
  Tag,
  DataRow,
  SectionLabel,
  buttonClass,
} from "@/components/ui";
import { SealBadge } from "@/components/seal-badge";
import { verifySealed } from "@/lib/crypto/verify";
import { VIOLATION_CATALOG } from "@/lib/legal/catalog";
import type { SealedEvidence, VerificationResult } from "@/lib/evidence/types";
import { useSearchParams } from "next/navigation";
import { cn, fmtTime } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* base64url helpers (inline, no deps)                                  */
/* ------------------------------------------------------------------ */

/** Decode a base64url string to UTF-8 text. Throws on malformed input. */
function base64urlDecode(input: string): string {
  // base64url -> base64, restore padding.
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Narrow unknown JSON into a SealedEvidence (structural sanity check). */
function asSealed(value: unknown): SealedEvidence {
  if (
    !value ||
    typeof value !== "object" ||
    !("payload" in value) ||
    !("signature" in value) ||
    !("payloadHash" in value)
  ) {
    throw new Error("Struktur bukti tidak dikenali (bukan SealedEvidence).");
  }
  return value as SealedEvidence;
}

/** Truncate a long hash/signature, keeping head & tail for eyeballing. */
function truncMid(s: string, head = 10, tail = 8): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */

type Phase = "idle" | "verifying" | "done" | "error";

interface PubKey {
  publicKeyHex: string;
  keyId: string;
  isDev: boolean;
}

export function VerifyClient() {
  const params = useSearchParams();
  const queryD = params.get("d");

  const [raw, setRaw] = useState("");
  const [sealed, setSealed] = useState<SealedEvidence | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [pubKey, setPubKey] = useState<PubKey | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Verify a parsed envelope: fetch the published key, run client-side crypto. */
  const runVerification = useCallback(async (env: SealedEvidence) => {
    setPhase("verifying");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/public-key", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil kunci publik server.");
      const pk = (await res.json()) as PubKey;
      setPubKey(pk);
      // Zero trust: we verify locally with the published key, not the server.
      const verdict = await verifySealed(env, pk.publicKeyHex);
      setResult(verdict);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verifikasi gagal.");
      setPhase("error");
    }
  }, []);

  /** Parse arbitrary JSON text into a SealedEvidence and verify it. */
  const verifyFromText = useCallback(
    (text: string) => {
      try {
        const env = asSealed(JSON.parse(text));
        setSealed(env);
        void runVerification(env);
      } catch (e) {
        setSealed(null);
        setResult(null);
        setError(
          e instanceof Error
            ? `Tidak dapat membaca bukti: ${e.message}`
            : "JSON tidak valid.",
        );
        setPhase("error");
      }
    },
    [runVerification],
  );

  // Auto-load & verify from ?d= (base64url-encoded SealedEvidence JSON).
  useEffect(() => {
    if (!queryD) return;
    try {
      const json = base64urlDecode(queryD);
      setRaw(json);
      const env = asSealed(JSON.parse(json));
      setSealed(env);
      void runVerification(env);
    } catch {
      setError("Parameter tautan rusak — tidak dapat membaca data segel (?d=).");
      setPhase("error");
    }
  }, [queryD, runVerification]);

  const onUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        setRaw(text);
        verifyFromText(text);
      };
      reader.onerror = () => {
        setError("Gagal membaca berkas.");
        setPhase("error");
      };
      reader.readAsText(file);
    },
    [verifyFromText],
  );

  const hasResult = phase === "done" && result;
  const valid = !!result?.valid;

  return (
    <div className="space-y-10">
      {/* ---- Header ---- */}
      <header className="fade-up">
        <div className="mb-3 flex items-center gap-2.5">
          <StatusDot tone={valid ? "verified" : "amber"} pulse={phase === "verifying"} />
          <span className="label">Verifikator Bukti · dashai.evidence.v1</span>
        </div>
        <h1 className="text-balance text-3xl font-semibold leading-tight text-fg sm:text-4xl">
          Verifikasi Segel Kriptografis
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Pemeriksaan dijalankan sepenuhnya di peramban Anda. Kami mengambil
          kunci publik server, lalu mencocokkan hash dan tanda tangan Ed25519
          secara lokal — server tidak dipercaya untuk menyatakan keabsahannya
          sendiri.
        </p>
      </header>

      {/* ---- Verdict hero ---- */}
      {hasResult && result && (
        <VerdictHero
          result={result}
          isDev={!!pubKey?.isDev}
          key={result.checkedAt}
        />
      )}

      {/* ---- Verifying state ---- */}
      {phase === "verifying" && (
        <div className="hud-frame relative flex items-center gap-3 bg-ink-2/50 p-6" aria-live="polite">
          <CornerBrackets tone="amber" />
          <Loader2 size={18} strokeWidth={1.5} className="animate-spin text-amber" aria-hidden />
          <span className="mono text-sm text-amber/90">Mencocokkan hash &amp; tanda tangan…</span>
        </div>
      )}

      {/* ---- Error state ---- */}
      {phase === "error" && error && (
        <div
          className="hud-frame relative bg-signal/[0.06] p-5"
          role="alert"
        >
          <CornerBrackets tone="signal" />
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-signal" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-signal">Gagal memverifikasi</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Payload breakdown ---- */}
      {hasResult && sealed && (
        <PayloadBreakdown sealed={sealed} isDev={!!pubKey?.isDev} />
      )}

      {/* ---- No-data instructions ---- */}
      {phase === "idle" && !sealed && <NoDataState />}

      {/* ---- Manual input (always available) ---- */}
      <section className="fade-up" style={{ animationDelay: "60ms" }}>
        <SectionLabel index="02">Verifikasi manual</SectionLabel>
        <div className="hud-frame relative bg-ink-2/50 p-5">
          <CornerBrackets tone="neutral" />
          <label htmlFor="sealed-json" className="label mb-2 block">
            Tempel JSON bukti tersegel
          </label>
          <textarea
            id="sealed-json"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            rows={6}
            placeholder='{ "payload": { … }, "signature": "…", "payloadHash": "…" }'
            className={cn(
              "mono w-full resize-y rounded-none border border-line bg-ink/60 p-3 text-xs leading-relaxed text-fg",
              "placeholder:text-dim focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40",
            )}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => raw.trim() && verifyFromText(raw.trim())}
              disabled={!raw.trim() || phase === "verifying"}
              className={buttonClass(
                "primary",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              <ClipboardPaste size={16} strokeWidth={1.5} aria-hidden />
              Verifikasi
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={buttonClass("secondary")}
            >
              <Upload size={16} strokeWidth={1.5} aria-hidden />
              Unggah .json
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Unggah berkas bukti JSON"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </section>

      {/* ---- Honest explainer ---- */}
      <Explainer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* verdict hero                                                         */
/* ------------------------------------------------------------------ */

function VerdictHero({
  result,
  isDev,
}: {
  result: VerificationResult;
  isDev: boolean;
}) {
  const valid = result.valid;
  const tone = valid ? "verified" : "signal";
  const tampered = !result.hashMatches; // hash mismatch == content altered

  return (
    <section
      className={cn(
        "fade-up hud-frame relative overflow-hidden p-7 sm:p-9",
        valid ? "bg-verified/[0.05]" : "bg-signal/[0.06]",
      )}
      aria-live="assertive"
    >
      <CornerBrackets tone={tone} />
      <div className="scan-line" aria-hidden />

      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="label mb-2">Putusan verifikasi</p>
          <h2
            className={cn(
              "font-[family-name:var(--font-jb)] text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl",
              valid ? "text-verified" : "text-signal",
            )}
          >
            {valid ? "VALID" : tampered ? "DIUBAH" : "TIDAK SAH"}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            {result.reason}
          </p>
        </div>
        <div className="shrink-0 self-center">
          <SealBadge state={valid ? "valid" : "tampered"} size="md" />
        </div>
      </div>

      {/* Sub-checks */}
      <div className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2">
        <SubCheck
          ok={result.hashMatches}
          label="Hash payload cocok"
          hint="Isi laporan tidak berubah sejak disegel."
        />
        <SubCheck
          ok={result.signatureValid}
          label="Tanda tangan Ed25519 valid"
          hint="Disegel oleh kunci dashAI yang dipublikasikan."
        />
      </div>

      {isDev && (
        <div className="mt-5 flex items-start gap-2.5 border border-amber/40 bg-amber/[0.06] p-3">
          <ShieldAlert size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-amber" aria-hidden />
          <p className="text-xs leading-relaxed text-amber/90">
            Diverifikasi terhadap{" "}
            <span className="font-semibold">kunci pengembangan</span> — tidak sah
            untuk produksi atau pembuktian resmi.
          </p>
        </div>
      )}
    </section>
  );
}

function SubCheck({
  ok,
  label,
  hint,
}: {
  ok: boolean;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-ink-2 p-4">
      <span className="mt-1">
        <StatusDot tone={ok ? "verified" : "signal"} />
      </span>
      <div>
        <p className={cn("text-sm font-medium", ok ? "text-verified" : "text-signal")}>
          {ok ? label : `${label} — gagal`}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-dim">{hint}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* payload breakdown                                                   */
/* ------------------------------------------------------------------ */

function PayloadBreakdown({
  sealed,
  isDev,
}: {
  sealed: SealedEvidence;
  isDev: boolean;
}) {
  const p = sealed.payload;
  const meta = VIOLATION_CATALOG[p.violation];
  const subjekLabel = p.subject === "self" ? "Diri sendiri (ego)" : "Pihak lain";
  const pasalValue = p.legal.ayat
    ? `${p.legal.pasal} ${p.legal.ayat}`
    : p.legal.pasal;

  return (
    <section className="fade-up" style={{ animationDelay: "40ms" }}>
      <SectionLabel index="01">Isi yang ditandatangani</SectionLabel>
      <div className="hud-frame relative bg-ink-2/50 p-5">
        <CornerBrackets tone="verified" />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-dim">
            Inilah payload kanonik persis yang ditandatangani server. Mengubah
            satu byte pun akan membatalkan tanda tangan.
          </p>
          {isDev && <Tag tone="amber">DEV KEY</Tag>}
        </div>

        <div className="mt-4">
          <DataRow
            label="Jenis pelanggaran"
            value={meta ? meta.labelId : p.violation}
            tone="signal"
          />
          <DataRow label="Subjek" value={subjekLabel} />
          <DataRow label="Waktu kejadian" value={fmtTime(p.capturedAt)} />
          <DataRow label="Waktu segel" value={fmtTime(p.sealedAt)} tone="verified" />
          <DataRow label="Undang-undang" value={p.legal.uu} />
          <DataRow label="Pasal" value={pasalValue} />
          <DataRow label="Ancaman / sanksi" value={p.legal.sanksi} />
          <DataRow label="Keyakinan mesin" value={`${Math.round(p.confidence * 100)}%`} />
          <DataRow label="ID kejadian" value={<span className="mono">{p.eventId}</span>} />
          <DataRow label="ID kunci" value={<span className="mono">{sealed.publicKeyId}</span>} />
          <DataRow label="Algoritma" value={sealed.algorithm} tone="verified" />
        </div>

        {/* Crypto material */}
        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <CryptoLine label="Hash payload (SHA-256)" value={sealed.payloadHash} />
          <CryptoLine label="Tanda tangan (base64url)" value={sealed.signature} />
        </div>
      </div>
    </section>
  );
}

function CryptoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p
        className="mono break-all text-xs leading-relaxed text-dim"
        title={value}
      >
        {truncMid(value, 18, 14)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* no-data + explainer                                                 */
/* ------------------------------------------------------------------ */

function NoDataState() {
  return (
    <section className="fade-up hud-frame relative bg-ink-2/40 p-6 sm:p-8">
      <CornerBrackets tone="amber" />
      <div className="flex items-start gap-4">
        <FileSearch size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-amber" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-fg">Belum ada bukti untuk diverifikasi</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            Buka tautan verifikasi yang berisi parameter{" "}
            <span className="mono text-dim">?d=</span>, tempel JSON bukti
            tersegel pada kolom di bawah, atau unggah berkas{" "}
            <span className="mono text-dim">.json</span> yang Anda terima.
          </p>
          <div className="mt-5">
            <Link href="/review" className={buttonClass("secondary")}>
              <ShieldCheck size={16} strokeWidth={1.5} aria-hidden />
              Buat &amp; segel bukti di Tinjauan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Explainer() {
  return (
    <section className="fade-up" style={{ animationDelay: "80ms" }}>
      <SectionLabel index="03">Apa arti hasil ini</SectionLabel>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
        <div className="bg-ink-2 p-5">
          <div className="mb-2 flex items-center gap-2 text-verified">
            <ShieldCheck size={15} strokeWidth={1.5} aria-hidden />
            <p className="label text-verified">Yang dibuktikan</p>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Integritas sejak disegel: isi laporan ini{" "}
            <span className="text-fg">tidak berubah satu byte pun</span> sejak
            ditandatangani dashAI, dan benar berasal dari kunci yang
            dipublikasikan. Stempel waktu segel bersifat otoritatif.
          </p>
        </div>
        <div className="bg-ink-2 p-5">
          <div className="mb-2 flex items-center gap-2 text-amber">
            <Info size={15} strokeWidth={1.5} aria-hidden />
            <p className="label text-amber">Yang TIDAK dibuktikan</p>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Tanda tangan{" "}
            <span className="text-fg">tidak menjamin kamera melihat realita</span>
            . Ia tidak membuktikan kejadian benar-benar terjadi, lokasi akurat,
            atau interpretasi mesin tepat — hanya bahwa data ini utuh sejak
            disegel. Penilaian fakta tetap di tangan manusia.
          </p>
        </div>
      </div>
    </section>
  );
}
