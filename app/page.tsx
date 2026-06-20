import Link from "next/link";
import {
  ScanEye,
  ShieldCheck,
  BadgeCheck,
  Flame,
  EyeOff,
  Gavel,
  Lock,
} from "lucide-react";
import {
  CornerBrackets,
  StatusDot,
  Tag,
  SectionLabel,
  buttonClass,
} from "@/components/ui";
import { SceneFrame } from "@/components/scene-frame";
import { DEMO_EVENTS } from "@/lib/demo/samples";
import { ALL_VIOLATIONS } from "@/lib/legal/catalog";
import { citationFor } from "@/lib/legal/citations";
import type { DetectionTier, ViolationMeta } from "@/lib/legal/catalog";

// Server component. No browser APIs, so this renders fully on the server.

const HERO_STATS = [
  { label: "12 Pasal Terverifikasi", tone: "verified" as const },
  { label: "Ed25519 Signed", tone: "amber" as const },
  { label: "0 API Key", tone: "neutral" as const },
];

const PROBLEM_CARDS = [
  {
    icon: Flame,
    title: "Yang salah malah berani",
    body: "Pelanggar kerap berbalik menuduh, berteriak, dan memutarbalikkan fakta di tempat. Tanpa rekaman, suara paling keras yang menang.",
    tone: "signal" as const,
  },
  {
    icon: EyeOff,
    title: "Amuk massa instan",
    body: "Selisih kecil di jalan bisa memicu pengeroyokan sebelum sempat menjelaskan. Korban sebenarnya bisa berakhir babak belur.",
    tone: "signal" as const,
  },
  {
    icon: Gavel,
    title: "Bukti kalah oleh emosi",
    body: "Kesaksian lisan mudah dibantah dan dimanipulasi. Yang dibutuhkan adalah bukti objektif, bertanggal, dan tidak bisa diutak-atik.",
    tone: "amber" as const,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Deteksi",
    body: "Model visi komputer di perangkat menandai pelanggaran dari frame kamera secara real-time — tanpa mengirim video ke server.",
  },
  {
    n: "02",
    title: "Sitasi UU",
    body: "Setiap pelanggaran dipetakan ke pasal UU 22/2009 LLAJ yang relevan, lengkap dengan bunyi pasal dan ancaman sanksi.",
  },
  {
    n: "03",
    title: "Segel (Ed25519)",
    body: "Bukti dikemas dan ditandatangani secara kriptografis di server memakai Ed25519, mengikat isi, waktu, dan lokasi.",
  },
  {
    n: "04",
    title: "Verifikasi publik",
    body: "Siapa pun dapat memverifikasi keaslian segel dengan kunci publik — keabsahan tidak bergantung pada kepercayaan pada satu pihak.",
  },
];

const TIER_LABEL: Record<DetectionTier, string> = {
  core: "Inti — kamera depan",
  secondary: "Sekunder — kamera depan",
  cabin: "Kabin — driver monitoring",
};

const TIER_ORDER: DetectionTier[] = ["core", "secondary", "cabin"];

const TECH = [
  "Next.js 16",
  "TensorFlow.js",
  "MediaPipe",
  "OpenStreetMap",
  "Ed25519",
  "Vercel",
];

function ViolationCell({ meta }: { meta: ViolationMeta }) {
  const cite = citationFor(meta.key);
  return (
    <li className="relative border border-line bg-surface/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-fg">{meta.labelId}</span>
        {cite.verified ? (
          <Tag tone="verified" className="shrink-0">
            <BadgeCheck className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            Verified
          </Tag>
        ) : (
          <Tag tone="amber" className="shrink-0">
            Pending
          </Tag>
        )}
      </div>
      <p className="mono mt-2 text-xs text-amber/90">{cite.pasal}</p>
      <p className="mt-1 text-xs leading-relaxed text-dim">{meta.blurb}</p>
    </li>
  );
}

export default function Home() {
  const heroEvent = DEMO_EVENTS[0];

  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    items: ALL_VIOLATIONS.filter((v) => v.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="noise relative">
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          {/* Copy */}
          <div>
            <div
              className="fade-up mb-6 inline-flex items-center gap-2 border border-line bg-surface/50 px-3 py-1"
              style={{ animationDelay: "0ms" }}
            >
              <StatusDot tone="signal" pulse />
              <span className="label">Forensic Evidence Terminal</span>
            </div>

            <h1
              className="fade-up text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "60ms" }}
            >
              Saksi mata yang
              <br />
              <span className="text-amber">tidak bisa dibantah.</span>
            </h1>

            <p
              className="fade-up mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              dashAI adalah dashcam ber-AI yang mendeteksi pelanggaran lalu
              lintas secara real-time, mengutip pasal UU yang berlaku, lalu
              menyegel buktinya secara kriptografis — melindungi pengendara dari
              fitnah, amuk massa, dan tilang palsu.
            </p>

            <div
              className="fade-up mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <Link href="/live" className={buttonClass("primary")}>
                <ScanEye className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Buka Kamera Live
              </Link>
              <Link href="/review" className={buttonClass("secondary")}>
                Lihat Bukti Demo
              </Link>
            </div>

            <ul
              className="fade-up mt-8 flex flex-wrap gap-2"
              style={{ animationDelay: "240ms" }}
              aria-label="Ringkasan kapabilitas"
            >
              {HERO_STATS.map((s) => (
                <li key={s.label}>
                  <Tag tone={s.tone}>{s.label}</Tag>
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence frame */}
          <div
            className="fade-up relative"
            style={{ animationDelay: "200ms" }}
          >
            <div className="hud-frame scanlines relative overflow-hidden bg-ink-2 p-2">
              <CornerBrackets tone="signal" />
              {/* REC strip */}
              <div className="absolute left-3 top-3 z-20 flex items-center gap-2 border border-signal/40 bg-ink/70 px-2 py-1 backdrop-blur-sm">
                <StatusDot tone="signal" pulse />
                <span className="mono text-[0.65rem] uppercase tracking-[0.2em] text-signal">
                  REC
                </span>
              </div>
              <div className="relative">
                <SceneFrame event={heroEvent} showOverlay />
                <span
                  className="scan-line pointer-events-none absolute inset-x-0 top-0"
                  aria-hidden
                />
              </div>
            </div>
            <p className="mono mt-3 text-center text-[0.65rem] uppercase tracking-[0.18em] text-dim">
              Frame demo · {heroEvent.road?.name ?? "Jakarta"} · disegel & dapat
              diverifikasi
            </p>
          </div>
        </div>
      </section>

      {/* ============================ PROBLEM ============================ */}
      <section id="masalah" className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionLabel index="01">Realita di jalan Indonesia</SectionLabel>
          <h2 className="max-w-3xl text-balance text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
            Yang melanggar sering kali yang paling berani memfitnah.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Tanpa bukti objektif, kebenaran kalah oleh siapa yang berteriak
            paling keras — dan terkadang oleh massa yang main hakim sendiri.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PROBLEM_CARDS.map((c, i) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.title}
                  className="fade-up relative border border-line bg-surface/40 p-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <CornerBrackets tone={c.tone} />
                  <Icon
                    className={
                      c.tone === "signal"
                        ? "h-6 w-6 text-signal"
                        : "h-6 w-6 text-amber"
                    }
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <h3 className="mt-4 text-lg font-semibold text-fg">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {c.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================= HOW IT WORKS ========================= */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionLabel index="02">Cara kerja</SectionLabel>
          <h2 className="max-w-3xl text-balance text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
            Dari frame menjadi bukti yang berdiri sendiri.
          </h2>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className="fade-up relative border border-line bg-surface/40 p-6"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="mono text-3xl font-semibold text-amber/30">
                  {s.n}
                </span>
                <h3 className="mt-3 text-base font-semibold text-fg">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================== DUAL SUBJECT ======================== */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionLabel index="03">Dua arah perlindungan</SectionLabel>
          <h2 className="max-w-3xl text-balance text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
            Melindungi Anda dari orang lain — dan dari diri sendiri.
          </h2>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <article className="relative border border-line bg-surface/40 p-8">
              <CornerBrackets tone="signal" />
              <Tag tone="signal">Subjek: pengendara lain</Tag>
              <h3 className="mt-4 text-xl font-semibold text-fg">
                Lindungi dari pelanggar lain
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Saat kendaraan lain melawan arus, menerobos lampu merah, atau
                berkendara tanpa helm, dashAI menangkapnya dengan pelat, lokasi,
                dan pasal — siap dijadikan laporan tilang atau bukti kecelakaan.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-dim">
                <li className="flex items-center gap-2">
                  <StatusDot tone="signal" /> Lapor pelanggaran dengan bukti
                  bertanda tangan
                </li>
                <li className="flex items-center gap-2">
                  <StatusDot tone="signal" /> Pelat, lokasi GPS, & konteks jalan
                  OSM
                </li>
              </ul>
            </article>

            <article className="relative border border-line bg-surface/40 p-8">
              <CornerBrackets tone="verified" />
              <Tag tone="verified">Subjek: diri sendiri</Tag>
              <h3 className="mt-4 text-xl font-semibold text-fg">
                Lindungi diri sendiri
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Saat Anda dituduh tanpa dasar, rekaman tersegel menjadi bukti
                meringankan yang sulit dibantah. Sekaligus, self-coaching
                menandai kebiasaan berisiko Anda sendiri secara privat.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-dim">
                <li className="flex items-center gap-2">
                  <StatusDot tone="verified" /> Bukti meringankan saat difitnah
                </li>
                <li className="flex items-center gap-2">
                  <StatusDot tone="verified" /> Self-coaching: kecepatan, sabuk,
                  ponsel
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ========================== TAXONOMY ========================== */}
      <section id="hukum" className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionLabel index="04">Taksonomi pelanggaran</SectionLabel>
          <h2 className="max-w-3xl text-balance text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
            Satu mesin, semua pelanggaran.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Engine adalah kumpulan aturan yang dapat dipasang — setiap entri
            terikat ke pasal UU 22/2009 yang telah diverifikasi.
          </p>

          <div className="mt-12 space-y-10">
            {byTier.map((group, gi) => (
              <div
                key={group.tier}
                className="fade-up"
                style={{ animationDelay: `${gi * 80}ms` }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="label text-amber">
                    {TIER_LABEL[group.tier]}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="mono text-xs text-dim">
                    {String(group.items.length).padStart(2, "0")}
                  </span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((meta) => (
                    <ViolationCell key={meta.key} meta={meta} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PRIVACY / TAMPER ===================== */}
      <section id="privasi" className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionLabel index="05">Privasi & integritas bukti</SectionLabel>
          <h2 className="max-w-3xl text-balance text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
            Jujur soal apa yang bisa — dan tidak bisa — dijanjikan.
          </h2>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <article className="relative border border-line bg-surface/40 p-8">
              <CornerBrackets tone="amber" />
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="h-5 w-5 text-amber"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <h3 className="text-lg font-semibold text-fg">
                  Tamper-evident, bukan tamper-proof
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Tanda tangan Ed25519 membuat setiap perubahan pada isi bukti{" "}
                <span className="text-fg">terdeteksi</span> — verifikasi akan
                gagal. Itu berbeda dengan klaim &ldquo;tidak mungkin
                diubah&rdquo;. Kami tidak menjanjikan bukti mustahil dipalsukan;
                kami menjamin pemalsuan ketahuan.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-dim">
                <li className="flex items-center gap-2">
                  <StatusDot tone="amber" /> Hash isi + waktu + lokasi terikat
                  dalam segel
                </li>
                <li className="flex items-center gap-2">
                  <StatusDot tone="amber" /> Verifikasi terbuka memakai kunci
                  publik
                </li>
              </ul>
            </article>

            <article className="relative border border-line bg-surface/40 p-8">
              <CornerBrackets tone="verified" />
              <div className="flex items-center gap-2">
                <Lock
                  className="h-5 w-5 text-verified"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <h3 className="text-lg font-semibold text-fg">
                  Privacy-by-design
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Analisis berjalan di perangkat Anda. Video mentah tidak
                diunggah; hanya bukti yang sengaja Anda segel yang dikirim untuk
                ditandatangani. Tanpa API key, tanpa pelacakan pihak ketiga.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-dim">
                <li className="flex items-center gap-2">
                  <StatusDot tone="verified" /> Inferensi visi di browser (on
                  device)
                </li>
                <li className="flex items-center gap-2">
                  <StatusDot tone="verified" /> Anda yang memutuskan apa yang
                  disegel
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ============================ TECH ============================ */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="flex flex-col items-center gap-6">
            <span className="label">Dibangun di atas</span>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {TECH.map((t) => (
                <li
                  key={t}
                  className="mono text-sm uppercase tracking-[0.14em] text-dim transition-colors hover:text-fg"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ========================= FINAL CTA ========================= */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
          <div className="hud-frame scanlines relative overflow-hidden bg-ink-2 px-6 py-16 text-center sm:px-12">
            <CornerBrackets tone="amber" />
            <span className="label">Mulai sekarang</span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
              Biarkan kameramu yang bersaksi.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Tidak perlu memasang apa pun. Buka kamera dan lihat dashAI bekerja,
              atau telusuri bukti demo yang sudah tersegel.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/live" className={buttonClass("primary")}>
                <ScanEye className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Buka Kamera Live
              </Link>
              <Link href="/review" className={buttonClass("secondary")}>
                Lihat Bukti Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
