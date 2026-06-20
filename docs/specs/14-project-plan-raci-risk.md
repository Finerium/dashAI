---
title: "Rencana Proyek, SDLC, RACI & Risk Register"
subtitle: "dashAI — Saksi Mata Digital yang Netral & Tertandatangani"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Pendahuluan dan Konteks Dokumen

Dokumen ini adalah **Rencana Proyek, Pendekatan SDLC, Matriks RACI, dan Risk Register** untuk **dashAI**, sebuah aplikasi web *AI dashcam* yang mendeteksi pelanggaran lalu lintas secara *real-time* langsung di dalam peramban, memetakan setiap pelanggaran ke pasal **Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)** dari basis pengetahuan hukum yang terverifikasi, lalu menyegel bukti secara kriptografis menggunakan tanda tangan **Ed25519** di sisi server.

Aplikasi dibangun di atas **Next.js 16 (App Router)**, **React 19**, **TypeScript** (mode `strict`), dan **Tailwind CSS v4**; dideploy di **Vercel** pada `https://dashai-mu.vercel.app` (sumber: `https://github.com/Finerium/dashAI`, lisensi **Apache-2.0**). Pustaka inti yang dipakai antara lain `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` (deteksi objek), `@mediapipe/tasks-vision` (deteksi wajah/pose), `tesseract.js` (OCR pelat), `@noble/ed25519` + `@noble/hashes` (kriptografi), `@react-pdf/renderer` + `qrcode` (laporan PDF), `idb` (IndexedDB), dan `zustand` (state).

Seluruh pernyataan dalam dokumen ini di-*ground* pada kode sumber nyata di repositori — khususnya `lib/crypto/` (`canonical.ts`, `keys.ts`, `sign.ts`, `verify.ts`), `lib/cv/` (`pipeline.ts`, `detector.ts`, `tracker.ts`, `face.ts`, `pose.ts`, `plate.ts`, `types.ts`), `lib/violations/engine.ts`, `lib/evidence/types.ts`, `lib/legal/catalog.ts`, `lib/legal/citations.ts`, `app/api/{seal,verify,public-key,report}/route.ts` — serta pada artefak riset `docs/research/phase0-research.json`. Sitasi hukum dijaga **persis konsisten** dengan `lib/legal/citations.ts`.

> **Batasan demo (kejujuran rekayasa).** dashAI saat ini adalah **demo melalui kamera ponsel**, bukan dokumen resmi kepolisian. Bukti yang dihasilkan bersifat **tamper-evident, bukan tamper-proof**: tanda tangan membuktikan isi laporan tidak berubah satu byte pun sejak disegel server pada waktu tertera, tetapi **tidak** membuktikan bahwa kamera benar-benar menyaksikan peristiwa dunia nyata (frame berasal dari klien). Estimasi kecepatan kendaraan lain bersifat **perkiraan**; estimasi kecepatan diri sendiri (GPS vs OSM `maxspeed`) bersifat akurat. Disclaimer ini mendasari banyak keputusan rencana, kualitas, dan risiko di bawah.

## Tujuan Dokumen

1. Mendokumentasikan **pendekatan SDLC** yang benar-benar dipakai membangun dashAI: alur multi-agent *research → contracts → build → audit → fix → deploy → docs*.
2. Memecah pekerjaan menjadi **workstream** dan **milestone** yang dapat dilacak.
3. Menetapkan **matriks RACI** (Responsible, Accountable, Consulted, Informed) lintas fase.
4. Mendirikan **Risk Register** yang hidup (teknis, hukum, privasi, adopsi) dengan likelihood, impact, dan mitigasi.
5. Menetapkan **quality gate** yang harus dilewati sebelum sebuah perubahan dianggap selesai.
6. Menggariskan **roadmap menuju produksi** (perangkat keras, *device attestation*, model).
7. Menetapkan **metrik keberhasilan** (success metrics) yang terukur.

## Cakupan dan Batasan

Dokumen ini mencakup tata kelola rekayasa untuk artefak yang ada di repositori. Yang **di luar cakupan**: integrasi resmi ETLE/kanal kepolisian, perangkat keras dashcam khusus, dan backend pelatihan model — ketiganya berada di **roadmap pasca-investor** (lihat Bab Roadmap). Semua angka dan klaim yang tidak dapat di-*ground* pada kode/artefak repositori ditandai sebagai **target** atau **rencana**, bukan capaian.

---

# Pendekatan SDLC

## Filosofi: Contract-First, Adversarially-Verified, Honesty-by-Design

dashAI tidak dibangun dengan SDLC waterfall klasik maupun Scrum berbasis sprint berdurasi tetap. Ia memakai **pipeline multi-agent yang berorientasi artefak**, di mana setiap fase menghasilkan artefak yang menjadi *kontrak* yang mengikat fase berikutnya. Tiga prinsip menyetir seluruh siklus:

1. **Contract-first.** Batas kriptografis ditetapkan lebih dulu sebagai tipe (`EvidencePayload` di `lib/evidence/types.ts`) sebelum implementasi apa pun menyentuhnya. Komentar pada tipe ini menegaskan: "THE cryptographic boundary. These exact fields, serialised canonically … are what the server signs." Semua yang di luar payload adalah presentasi tanpa bobot pembuktian.
2. **Adversarially-verified.** Basis pengetahuan hukum **bukan halusinasi model**: ia digenerate dari workflow riset dengan **verifikasi adversarial 3-voter** terhadap sumber resmi/terpercaya, dan setiap entri ditandai `verified: true` dengan `confirm_votes: 3` pada `docs/research/phase0-research.json`. Hasilnya dikodifikasi ke `lib/legal/citations.ts` yang **tidak boleh diedit tangan** ("Do not hand-edit — re-run the research workflow and regenerate").
3. **Honesty-by-design.** Sistem secara eksplisit **menolak** klaim yang tidak dapat dibuktikan. Kode menulis "tamper-EVIDENT, not tamper-proof" di `lib/crypto/sign.ts`; engine hanya menyalakan aturan yang punya sinyal sahih (`lib/violations/engine.ts`); dan kunci DEV diberi label `dev-…` agar tidak pernah dianggap otoritatif (`lib/crypto/keys.ts`).

## Fase Pipeline Multi-Agent

Alur kerja end-to-end adalah: **research → contracts → build → audit → fix → deploy → docs**. Tabel berikut memetakan setiap fase ke input, aktivitas, output (artefak repositori), dan kriteria keluar (*exit gate*).

| # | Fase | Input | Aktivitas inti | Artefak / bukti di repo | Exit gate |
|---|------|-------|----------------|--------------------------|-----------|
| 1 | **Research** | Permasalahan domain (pelanggaran LLAJ, dasar deteksi CV) | Riset multi-agent + verifikasi adversarial 3-voter per sitasi terhadap sumber resmi | `docs/research/phase0-research.json` (12 entri, `verified: true`, `confirm_votes: 3`) | Setiap sitasi `verified` dengan ≥3 confirm-votes |
| 2 | **Contracts** | Hasil riset terverifikasi | Definisi tipe domain & batas kripto; skema payload `dashai.evidence.v1`; katalog & sitasi sebagai data | `lib/evidence/types.ts`, `lib/legal/catalog.ts`, `lib/legal/citations.ts`, `lib/cv/types.ts` | Tipe kompilasi `strict`; sitasi konsisten dengan riset |
| 3 | **Build** | Kontrak/tipe | Implementasi CV pipeline, tracker, violation engine, crypto, route `/api/*`, viewer/report UI | `lib/cv/`, `lib/violations/engine.ts`, `lib/crypto/`, `app/api/`, `components/` | `pnpm build` sukses; fitur live berjalan |
| 4 | **Audit** | Build | Telaah keamanan/privasi/hukum; uji negatif (klaim yang tak boleh dibuat); telaah ambang & false-positive | Threat model & spec (`docs/specs/`, `docs/diagrams/threat-model.*`) | Tidak ada klaim *tamper-proof*; gate kualitas terpenuhi |
| 5 | **Fix** | Temuan audit | Perbaikan: penegasan label DEV, *graceful degradation* model, pengetatan ambang engine | Diff pada `lib/`, mis. degradasi opsional di `lib/cv/pipeline.ts` | Temuan audit prioritas tinggi tertutup |
| 6 | **Deploy** | Build tervalidasi | Deploy ke Vercel (Node runtime untuk `/api/*`), set `DASHAI_SIGNING_KEY` | `https://dashai-mu.vercel.app`, `export const runtime = "nodejs"` | Produksi memakai kunci `prod-…`, bukan `dev-…` |
| 7 | **Docs** | Sistem terdeploy | Dokumentasi rekayasa kelas produksi (vision, PRD, SRS, arsitektur, ADR, test plan, dll.) | `docs/specs/` (01–08+), `docs/diagrams/`, `README.md` | Setiap klaim ter-*ground* pada kode/artefak |

## Catatan: Sifat Iteratif, Bukan Linear Murni

Walau tabel di atas disajikan berurutan, pipeline bersifat **iteratif dengan umpan-balik**. Temuan pada fase *audit* dapat mengembalikan pekerjaan ke *contracts* (mis. menambah field payload) atau *research* (mis. menelaah ulang penafsiran pasal). Aturan tata kelola yang berlaku:

- Perubahan pada **basis hukum** wajib melewati ulang fase *research* (regenerasi `citations.ts`), bukan edit manual.
- Perubahan pada **batas kripto** (`EvidencePayload`) wajib disertai pembaruan kanonikalisasi (`lib/crypto/canonical.ts`) dan verifikasi (`lib/crypto/verify.ts`), karena verifikasi berjalan identik di klien dan server.
- Setiap fitur deteksi baru = (a) entri `ViolationMeta` di `catalog.ts`, (b) `Citation` terverifikasi di `citations.ts`, (c) aturan detektor di `engine.ts` — sesuai komentar di `catalog.ts`: "adding a new violation is: add a meta entry, a citation, and a detector rule".

---

# Workstream dan Milestone

## Workstream

Pekerjaan dipecah ke dalam tujuh *workstream* paralel yang masing-masing memiliki *owner* dan area kode yang jelas.

| ID | Workstream | Lingkup utama | Area kode |
|----|------------|---------------|-----------|
| WS-1 | **Legal Knowledge Base** | Riset & verifikasi adversarial pasal UU LLAJ; katalog pelanggaran | `docs/research/phase0-research.json`, `lib/legal/` |
| WS-2 | **Computer Vision** | Deteksi objek (coco-ssd), tracker IoU, face/pose (MediaPipe), OCR pelat (Tesseract) | `lib/cv/` |
| WS-3 | **Violation Engine** | Aturan deteksi, debounce, *track gating*, fusi GPS/OSM | `lib/violations/engine.ts`, `lib/geo/` |
| WS-4 | **Cryptography & Evidence** | Kanonikalisasi, hashing SHA-256, sign/verify Ed25519, manajemen kunci | `lib/crypto/`, `lib/evidence/` |
| WS-5 | **API & Reporting** | Route `/api/{seal,verify,public-key,report}`, PDF + QR, halaman `/verify` | `app/api/`, `lib/report/`, `app/verify/` |
| WS-6 | **Client UX & State** | Live viewer, HUD, overlay deteksi, breakdown pasal, IndexedDB lokal | `components/`, `lib/state/`, `lib/demo/` |
| WS-7 | **Docs & Governance** | Spec rekayasa, ADR, diagram, rencana proyek/risiko | `docs/specs/`, `docs/diagrams/` |

## Milestone

Milestone berikut menandai capaian yang dapat diverifikasi. Status di-*ground* pada keberadaan artefak di repositori per tanggal dokumen.

| Milestone | Deskripsi | Kriteria selesai (terverifikasi) | Status |
|-----------|-----------|----------------------------------|--------|
| **M0 — Riset hukum terverifikasi** | Basis pengetahuan 12 pelanggaran tervalidasi 3-voter | `phase0-research.json` lengkap; 12 entri `verified: true` | Selesai |
| **M1 — Kontrak domain** | Tipe & skema payload, katalog, sitasi | `evidence/types.ts`, `catalog.ts`, `citations.ts` kompilasi `strict` | Selesai |
| **M2 — Pipeline CV live** | coco-ssd + IoU tracker + face/pose dengan degradasi anggun | `lib/cv/pipeline.ts` berjalan; model gagal tidak menghentikan live view | Selesai |
| **M3 — Engine deteksi live** | Aturan live: lawan arah, ngebut diri, boncengan, terobos merah | `engine.ts` menjalankan 5 aturan (`ruleWrongWayOther/Self`, `ruleSpeedingSelf`, `ruleOvercapacity`, `ruleRedLightSelf`) | Selesai |
| **M4 — Penyegelan bukti** | Seal Ed25519 + verifikasi klien/server + public key | `/api/seal`, `/api/verify`, `/api/public-key`; `verifySealed` identik klien/server | Selesai |
| **M5 — Laporan PDF + QR** | PDF tilang/kecelakaan/coaching dengan QR self-contained | `/api/report` me-*render* PDF; QR meng-*encode* envelope penuh | Selesai |
| **M6 — Deploy demo publik** | Demo daring di Vercel | `https://dashai-mu.vercel.app` aktif | Selesai |
| **M7 — Dokumentasi rekayasa** | Spec kelas produksi | `docs/specs/01–08`, diagram di `docs/diagrams/` | Berlangsung |
| **M8 — Hardening produksi** | Attestation, model khusus, kalibrasi kecepatan | Lihat Roadmap; pasca-investor | Direncanakan |

> Catatan kejujuran: per tanggal dokumen, repositori **belum memuat berkas uji otomatis** (`*.test.ts`/`*.spec.ts`). Skrip yang tersedia di `package.json` adalah `dev`, `build`, `start`, `lint` (ESLint), dan `typecheck` (`tsc --noEmit`). Karena itu *quality gate* di bawah memuat gate yang sudah aktif (lint, typecheck, build) dan gate yang masih **direncanakan** (suite uji unit kripto/engine).

---

# Matriks RACI

## Definisi Peran

Karena dashAI dikembangkan via pipeline multi-agent, "peran" di sini adalah **fungsi tanggung jawab**, bukan jabatan organisasi. Satu individu/agent dapat memegang banyak peran.

| Kode | Peran | Tanggung jawab utama |
|------|-------|----------------------|
| **LEAD** | Engineering Lead / Maintainer | Keputusan arsitektur, *accountable* atas rilis, pemegang akses `DASHAI_SIGNING_KEY` |
| **RES** | Research Agent | Riset hukum + verifikasi adversarial 3-voter; regenerasi `citations.ts` |
| **CV** | CV/ML Engineer | Pipeline deteksi, tracker, model face/pose/OCR |
| **ENG** | Detection/Rules Engineer | Violation engine, fusi GPS/OSM, ambang & debounce |
| **SEC** | Security/Crypto Engineer | Kripto, manajemen kunci, threat model |
| **API** | Backend/API Engineer | Route `/api/*`, PDF/QR, runtime Node |
| **UX** | Frontend/UX Engineer | Viewer, HUD, privasi UI (blur), state lokal |
| **LEGAL** | Legal Reviewer | Telaah konsistensi pasal & disclaimer hukum |
| **PRIV** | Privacy/DPO | Kepatuhan privacy-by-design & semangat UU 27/2022 (PDP) |
| **QA** | Quality/Audit | Quality gate, uji negatif, audit klaim |
| **DOC** | Technical Writer | Dokumentasi rekayasa |

Legenda: **R** = Responsible (mengerjakan), **A** = Accountable (penanggung jawab akhir, tepat satu per baris), **C** = Consulted (dimintai masukan), **I** = Informed (diberi tahu).

## RACI Lintas Fase SDLC

| Fase | LEAD | RES | CV | ENG | SEC | API | UX | LEGAL | PRIV | QA | DOC |
|------|------|-----|----|-----|-----|-----|----|-------|------|----|----|
| Research | A | R | C | C | I | I | I | C | C | C | I |
| Contracts | A | C | R | R | R | C | C | C | C | C | I |
| Build (CV) | A | I | R | C | I | I | C | I | C | C | I |
| Build (Engine) | A | C | C | R | I | I | I | C | I | C | I |
| Build (Crypto/Evidence) | A | I | I | I | R | C | I | I | C | C | I |
| Build (API/Report) | A | I | I | I | C | R | C | C | C | C | I |
| Build (UX/State) | A | I | C | C | I | C | R | I | C | C | I |
| Audit | A | C | C | C | R | C | C | R | R | R | I |
| Fix | A | C | R | R | R | R | R | C | C | C | I |
| Deploy | A | I | I | I | C | R | I | I | C | C | I |
| Docs | A | C | C | C | C | C | C | C | C | C | R |

## RACI Lintas Komponen Kunci (Detail)

| Komponen / Artefak | LEAD | RES | CV | ENG | SEC | API | UX | LEGAL | PRIV | QA | DOC |
|--------------------|------|-----|----|-----|-----|-----|----|-------|------|----|----|
| `lib/legal/citations.ts` (generated) | A | R | I | C | I | I | I | R | I | C | I |
| `lib/legal/catalog.ts` | A | C | C | R | I | I | C | C | I | C | I |
| `lib/cv/pipeline.ts` & detektor | A | I | R | C | I | I | C | I | C | C | I |
| `lib/violations/engine.ts` | A | C | C | R | I | I | I | C | I | C | I |
| `lib/crypto/*` & `DASHAI_SIGNING_KEY` | A | I | I | I | R | C | I | I | C | C | I |
| `lib/evidence/types.ts` (boundary payload) | A | I | C | C | R | C | C | C | C | C | I |
| `app/api/*` route | A | I | I | C | C | R | C | C | C | C | I |
| `lib/report/*` (PDF + QR) | A | I | I | I | C | R | C | C | C | C | I |
| Halaman `/verify` (verifikasi klien) | A | I | I | I | R | C | R | C | C | C | I |
| Privasi UI (blur wajah/pelat) | A | I | C | I | I | I | R | I | R | C | I |

---

# Risk Register

## Skala dan Legenda

**Likelihood (L):** 1 = Rare, 2 = Unlikely, 3 = Possible, 4 = Likely, 5 = Almost certain.
**Impact (I):** 1 = Negligible, 2 = Minor, 3 = Moderate, 4 = Major, 5 = Severe.
**Risk score = L × I.** Rating RAG: **1–6 Rendah (hijau)**, **8–12 Sedang (kuning)**, **15–25 Tinggi (merah)**.
**Strategi respons:** Avoid / Mitigate / Transfer / Accept.

Risk Register bersifat **hidup**: ditinjau pada setiap fase *Audit* dan sebelum setiap *Deploy*. Pemilik default seluruh register adalah **LEAD**, dengan *action owner* per baris.

## Risiko Teknis

| ID | Risiko (sebab → peristiwa → akibat) | L | I | Skor / RAG | Owner | Strategi | Mitigasi / kontingensi | Residual |
|----|-------------------------------------|---|---|-----------|-------|----------|------------------------|----------|
| RR-01 | Ambang deteksi longgar → **false positive** (mis. lawan arah/boncengan) → tuduhan keliru | 3 | 5 | 15 / Tinggi | ENG | Mitigate | `MIN_TRACK_AGE=4` & `DEBOUNCE_MS=6000`; flow butuh ≥3 kendaraan bergerak (`movingVehicles.length < 3`); cosine `< -0.6`; verifikasi manusia wajib; disclaimer di laporan | 6 (Sedang→Rendah) |
| RR-02 | Performa coco-ssd `lite_mobilenet_v2` rendah di ponsel kelas bawah → deteksi meleset | 4 | 3 | 12 / Sedang | CV | Mitigate | Backend WebGL dengan fallback cpu/wasm (`detector.ts`); model sekunder *graceful-degrade* (`pipeline.ts` try/catch); antarmuka `ObjectDetector` siap di-swap ke YOLOv8/ONNX | 6 (Rendah) |
| RR-03 | Estimasi kecepatan kendaraan lain hanya **perkiraan** → angka dianggap fakta | 4 | 4 | 16 / Tinggi | ENG | Mitigate | `otherSpeedKmh` dipisah dari `egoSpeedKmh` di tipe; UI/README menandai sebagai estimasi; kalibrasi *error bars* di roadmap | 8 (Sedang) |
| RR-04 | Layanan publik **OSM Overpass** padam → konteks `oneway`/`maxspeed` hilang → aturan lawan-arah-diri & ngebut-diri tidak menyala | 3 | 3 | 9 / Sedang | ENG | Mitigate | Aturan men-*guard* null (`if (limit == null ...) return []`); degradasi anggun tanpa crash; cache konteks jalan; tidak ada false positive saat data hilang | 4 (Rendah) |
| RR-05 | Inferensi sekunder (face/pose/OCR) gagal di peramban tertentu | 4 | 2 | 8 / Sedang | CV | Accept/Mitigate | Pembungkus try/catch per model (`pipeline.ts`); live view tetap jalan dengan model yang berhasil | 4 (Rendah) |
| RR-06 | Perubahan `EvidencePayload` tak diikuti pembaruan kanonikalisasi → hash/sig tidak stabil klien-server | 2 | 5 | 10 / Sedang | SEC | Avoid | Kanonikalisasi deterministik (sort key rekursif, drop `undefined`) dipakai sama di sign & verify; tata kelola: ubah payload = ubah `canonical.ts`+`verify.ts` | 5 (Rendah) |

## Risiko Hukum

| ID | Risiko | L | I | Skor / RAG | Owner | Strategi | Mitigasi / kontingensi | Residual |
|----|--------|---|---|-----------|-------|----------|------------------------|----------|
| RR-07 | **Inakurasi sitasi pasal** → laporan menyebut dasar hukum keliru | 2 | 5 | 10 / Sedang | LEGAL | Avoid | Basis pengetahuan diverifikasi adversarial 3-voter; `citations.ts` *generated*, dilarang edit tangan; konsistensi dijaga dengan `phase0-research.json` | 4 (Rendah) |
| RR-08 | Laporan disalahartikan sebagai **dokumen resmi kepolisian** | 3 | 4 | 12 / Sedang | LEGAL | Mitigate | Disclaimer eksplisit di README & PDF; label kunci `dev-…`; sitasi dinyatakan **indikatif** | 6 (Rendah) |
| RR-09 | **Tantangan admisibilitas** bukti di proses hukum | 3 | 4 | 12 / Sedang | LEGAL | Mitigate/Transfer | Posisi *tamper-evident* (bukan tamper-proof) dinyatakan jujur; verifikasi publik via `/api/public-key`; penilaian akhir diserahkan ke pihak berwenang; roadmap attestation | 8 (Sedang) |
| RR-10 | Klaim sistem berlebihan (mis. "tamper-proof") → risiko reputasi/hukum | 2 | 4 | 8 / Sedang | QA | Avoid | Honesty-by-design tertanam di kode (`sign.ts`); uji negatif atas klaim yang tak boleh dibuat; telaah teks pemasaran | 2 (Rendah) |

## Risiko Privasi

| ID | Risiko | L | I | Skor / RAG | Owner | Strategi | Mitigasi / kontingensi | Residual |
|----|--------|---|---|-----------|-------|----------|------------------------|----------|
| RR-11 | **Kebocoran PII** (frame/crop wajah/pelat) ke server di luar yang disegel pengguna | 2 | 5 | 10 / Sedang | PRIV | Avoid | Server hanya menerima payload yang **secara eksplisit** disegel; media diacu lewat **hash** (`MediaHashes`), bukan byte; local-first IndexedDB | 4 (Rendah) |
| RR-12 | Deteksi wajah disalahpahami sebagai **pengenalan identitas** | 3 | 3 | 9 / Sedang | PRIV | Mitigate | Deteksi **bukan** rekognisi; blur-by-default di UI; selaras semangat UU 27/2022 (PDP) | 3 (Rendah) |
| RR-13 | Berbagi laporan membawa data lokasi/plat orang lain tanpa kendali | 3 | 3 | 9 / Sedang | UX | Mitigate | Default blur; pengguna mengontrol kapan menyegel & membagikan; minimisasi data di payload | 4 (Rendah) |

## Risiko Keamanan/Operasional

| ID | Risiko | L | I | Skor / RAG | Owner | Strategi | Mitigasi / kontingensi | Residual |
|----|--------|---|---|-----------|-------|----------|------------------------|----------|
| RR-14 | **Eksposur `DASHAI_SIGNING_KEY`** (private key bocor) → pemalsuan seal | 2 | 5 | 10 / Sedang | SEC | Mitigate | Satu-satunya rahasia; tidak pernah meninggalkan server (`server-only`); rotasi kunci via `keyId`; verifikasi tetap publik | 5 (Rendah) |
| RR-15 | **Kunci DEV lolos ke produksi** → bukti ditandai otoritatif padahal bukan | 3 | 4 | 12 / Sedang | SEC | Avoid | Validasi regex seed 64-hex (`keys.ts`); fallback bertanda `dev-…` & `isDev:true`; gate deploy memeriksa `prod-…` | 4 (Rendah) |
| RR-16 | **Spoofing kamera** (mengarahkan ke layar) → seal sah atas peristiwa palsu | 4 | 4 | 16 / Tinggi | SEC | Mitigate (residual diterima untuk demo) | Diakui jujur sebagai batas *tamper-evident*; roadmap: Play Integrity/App Attest, kontinuitas GPS, stempel waktu server, hardware khusus | 12 (Sedang; residual demo) |

## Risiko Adopsi/Strategis

| ID | Risiko | L | I | Skor / RAG | Owner | Strategi | Mitigasi / kontingensi | Residual |
|----|--------|---|---|-----------|-------|----------|------------------------|----------|
| RR-17 | Kepercayaan publik rendah pada bukti yang dihasilkan AI | 3 | 4 | 12 / Sedang | LEAD | Mitigate | Verifikasi dapat dilakukan siapa pun (`/api/public-key`, `/verify` self-contained); transparansi sumber hukum; open-source Apache-2.0 | 6 (Rendah) |
| RR-18 | Ketergantungan demo pada kamera ponsel membatasi keandalan lapangan | 4 | 3 | 12 / Sedang | LEAD | Mitigate | Roadmap hardware dashcam khusus pasca-investor; arsitektur detektor *swappable* | 6 (Rendah) |
| RR-19 | Tanpa jalur integrasi ETLE resmi → nilai penegakan terbatas | 3 | 3 | 9 / Sedang | LEAD | Mitigate | Roadmap integrasi ETLE/kanal pelaporan; fokus awal pada nilai eksulpatori (melindungi pemilik) | 6 (Rendah) |
| RR-20 | Tidak adanya suite uji otomatis → regresi tak terdeteksi | 4 | 3 | 12 / Sedang | QA | Mitigate | Gate lint + typecheck + build aktif; suite uji unit kripto/engine direncanakan (lihat Quality Gate) | 6 (Rendah) |

## Ringkasan Risiko Tertinggi

Risiko dengan skor inheren ≥15 yang menuntut perhatian berkelanjutan: **RR-01** (false positive → tuduhan keliru), **RR-03** (estimasi kecepatan kendaraan lain), **RR-16** (spoofing kamera). Ketiganya bersinggungan dengan inti misi dashAI sebagai *saksi mata netral* dan menjadi pendorong utama roadmap *device attestation* dan kalibrasi kecepatan.

---

# Quality Gates

Sebuah perubahan baru dianggap **Done** bila melewati seluruh gate yang berlaku. Gate dibagi menjadi yang **aktif** (otomatis/manual tersedia kini) dan yang **direncanakan**.

## Gate Aktif

| Gate | Perintah / mekanisme | Kriteria lulus | Sumber |
|------|----------------------|----------------|--------|
| **G1 — Type safety** | `pnpm typecheck` (`tsc --noEmit`) | Nol error TypeScript pada mode `strict` | `package.json` |
| **G2 — Lint** | `pnpm lint` (ESLint, `eslint-config-next`) | Nol error lint | `package.json` |
| **G3 — Build** | `pnpm build` (`next build`) | Build produksi sukses | `package.json` |
| **G4 — Konsistensi hukum** | Telaah manual: `citations.ts` ↔ `phase0-research.json` | Sitasi identik; tak ada edit tangan pada file generated | `lib/legal/`, `docs/research/` |
| **G5 — Stabilitas batas kripto** | Telaah manual: perubahan `EvidencePayload` diiringi `canonical.ts`/`verify.ts` | Seal di server tervalidasi oleh `verifySealed` di klien | `lib/crypto/`, `lib/evidence/types.ts` |
| **G6 — Honesty/no-overclaim** | Audit manual klaim | Tidak ada klaim "tamper-proof"; estimasi ditandai sebagai estimasi | `README.md`, `lib/crypto/sign.ts` |
| **G7 — Gate deploy kunci** | Verifikasi env sebelum rilis | Produksi memakai `keyId` berawalan `prod-…`, bukan `dev-…` | `lib/crypto/keys.ts` |
| **G8 — Privasi default** | Telaah UI | Wajah/pelat di-blur default; server hanya menerima payload tersegel | `components/`, `app/api/seal/route.ts` |

## Gate Direncanakan

| Gate | Tujuan | Cakupan uji yang diusulkan |
|------|--------|----------------------------|
| **G9 — Unit test kripto** | Membuktikan invarian seal/verify | Round-trip `sealPayload`→`verifySealed` valid; deteksi *tamper* (ubah 1 byte → `hashMatches:false`); kanonikalisasi stabil terhadap urutan key |
| **G10 — Unit test engine** | Mencegah regresi false positive/negative | Debounce per `(violation, track)`; gating `MIN_TRACK_AGE`; ambang flow `<3` kendaraan; cosine `<-0.6`; `SPEED_MARGIN_KMH` |
| **G11 — Test route API** | Validasi kontrak `/api/*` | Validasi body seal (400 untuk event tak lengkap/violation tak dikenal); `/api/report` menolak envelope tak valid (422) |
| **G12 — Uji negatif klaim** | Menjaga honesty-by-design | Memastikan sistem tidak mengeklaim atestasi fisik; label DEV muncul saat kunci DEV |

> Penambahan suite uji otomatis (G9–G12) adalah prasyarat menutup risiko **RR-20** dan menaikkan kepercayaan rilis.

---

# Roadmap Menuju Produksi

Roadmap berikut mengonsolidasikan butir di `README.md` dan komentar arsitektur (mis. detektor *swappable* di `detector.ts`). Item bertanda **pasca-investor** memerlukan pendanaan/perangkat keras.

## Fase R1 — Tamper-Resistance (menaikkan biaya pemalsuan)

- **Device attestation**: integrasi **Play Integrity (Android)** / **App Attest (iOS)** untuk menaikkan keyakinan bahwa frame berasal dari perangkat asli — menyerang langsung risiko **RR-16** (spoofing kamera).
- **Kontinuitas GPS + stempel waktu server**: memanfaatkan `sealedAt` yang sudah di-*stamp* otoritatif oleh server di `/api/seal` dan rangkaian `GeoPoint` untuk konsistensi temporal/spasial.
- Tetap dengan posisi jujur: target adalah **tamper-resistant lebih kuat**, bukan tamper-proof; penilaian akhir tetap pada pihak berwenang.

## Fase R2 — Model & Deteksi (memperluas cakupan tier)

- **Backend YOLOv8/ONNX**: mengganti coco-ssd melalui antarmuka `ObjectDetector` yang sudah disiapkan ("can later be swapped for a YOLOv8 ONNX backend without touching the pipeline").
- **Model khusus helm/pelat**: mengaktifkan deteksi penuh tier *secondary* (mis. `tanpa-helm`, `tanpa-plat`) yang kini dikatalogkan dan ditampilkan via dataset demo.
- **Kamera kabin (driver monitoring)**: mengaktifkan tier *cabin* (`tanpa-sabuk`, `main-hp`) yang di `catalog.ts` ditandai `requiresCabinCam: true`.
- **Kalibrasi estimasi kecepatan kendaraan lain** dengan *error bars* — menutup **RR-03**.

## Fase R3 — Perangkat Keras & Integrasi (pasca-investor)

- **Dashcam perangkat keras khusus**: meningkatkan keandalan lapangan dari demo kamera ponsel (menutup **RR-18**).
- **Integrasi resmi ETLE / kanal pelaporan kepolisian** (menutup **RR-19**).

## Ketergantungan Roadmap (ringkas)

| Item | Bergantung pada | Menutup risiko |
|------|------------------|----------------|
| Device attestation | Aplikasi native (Android/iOS) | RR-16, RR-09 |
| YOLOv8/ONNX | Antarmuka `ObjectDetector` (sudah ada) | RR-02 |
| Model helm/pelat & kamera kabin | Dataset + pelatihan model | Cakupan tier secondary/cabin |
| Kalibrasi kecepatan | Data ground-truth + dashcam | RR-03 |
| Hardware khusus & ETLE | Pendanaan investor | RR-18, RR-19 |

---

# Success Metrics

Metrik dikelompokkan menjadi **metrik yang sudah dapat diverifikasi** (di-*ground* pada artefak repositori) dan **metrik target** (KPI ke depan). Target dinyatakan eksplisit sebagai target, bukan capaian.

## Metrik Terverifikasi (status saat ini)

| Metrik | Nilai | Sumber |
|--------|-------|--------|
| Sitasi hukum terverifikasi | **12/12** entri `verified: true` | `lib/legal/citations.ts`, `phase0-research.json` |
| Confirm-votes per sitasi | **3** (adversarial 3-voter) | `confirm_votes: 3` di `phase0-research.json` |
| Pelanggaran dalam katalog | **12** `ViolationKey` | `lib/evidence/types.ts`, `lib/legal/catalog.ts` |
| Aturan deteksi live aktif | **5** rule (4 jenis pelanggaran: lawan arah other/self, ngebut-self, boncengan, terobos-merah-self) | `lib/violations/engine.ts` |
| Rahasia eksternal dibutuhkan | **1** (`DASHAI_SIGNING_KEY`); **0** API key pihak ketiga | `lib/crypto/keys.ts`, `README.md` |
| Algoritma tanda tangan | **Ed25519** + SHA-256 kanonik | `lib/crypto/sign.ts`, `canonical.ts` |
| Verifikasi independen | Publik via `/api/public-key`; `/verify` self-contained (QR meng-encode envelope penuh) | `app/api/public-key`, `app/api/report` |
| Gate kualitas aktif | typecheck, lint, build | `package.json` |

## KPI Target (forward-looking)

| Kategori | KPI | Target | Catatan |
|----------|-----|--------|---------|
| Akurasi deteksi (self) | Precision aturan **ngebut-diri** (GPS vs OSM) | Tinggi (akurat per desain) | Sudah akurat; dipantau via lapangan |
| Akurasi deteksi (other) | False-positive rate **lawan-arah** & **boncengan** | Minimkan; target rendah | Dikontrol via `MIN_TRACK_AGE`, `DEBOUNCE_MS`, ambang flow/cosine |
| Kalibrasi kecepatan other | Cakupan *error bar* terdokumentasi | 100% laporan menampilkan rentang error | Bergantung Fase R2 |
| Integritas bukti | Tingkat deteksi *tamper* pada uji | 100% (perubahan 1 byte → invalid) | Diverifikasi oleh G9 saat suite uji ada |
| Privasi | Insiden kebocoran PII tak-tersegel | 0 | Server hanya menerima payload tersegel |
| Keandalan klien | Live view tetap jalan saat ≥1 model sekunder gagal | 100% (degradasi anggun) | Dijamin desain `pipeline.ts` |
| Kualitas rilis | Cakupan uji otomatis pada `lib/crypto` & `lib/violations` | Tinggi (target awal modul kritikal) | Prasyarat menutup RR-20 |
| Kepercayaan | Proporsi laporan terverifikasi independen sukses | 100% verifikasi self-contained | Via `/verify` + public key |

---

# Tata Kelola, Tinjauan, dan Persetujuan

- **Kepemilikan register:** seluruh Risk Register dimiliki **LEAD**; setiap risiko memiliki *action owner* sebagaimana tertera.
- **Irama tinjauan:** Risk Register dan Quality Gate ditinjau pada **setiap fase Audit** dan **sebelum setiap Deploy**.
- **Manajemen perubahan:** perubahan basis hukum lewat regenerasi (bukan edit manual); perubahan batas kripto lewat pembaruan kanonikalisasi+verifikasi; setiap pelanggaran baru lewat trio meta+citation+rule.
- **Persetujuan rilis:** *accountable* akhir adalah **LEAD**, dengan G1–G8 sebagai prasyarat dan verifikasi `keyId` `prod-…` sebagai gate deploy.

> **Penutup kejujuran rekayasa.** dashAI adalah demonstrasi teknologi yang dirancang untuk **netral dan dapat diverifikasi siapa pun**. Ia bersifat **tamper-evident, bukan tamper-proof**; laporannya **indikatif, bukan dokumen resmi kepolisian**; dan estimasi kecepatan kendaraan lain bersifat **perkiraan**. Rencana, kualitas, dan risiko dalam dokumen ini disusun untuk menaikkan kepercayaan secara jujur — bukan untuk menjanjikan yang tidak dapat dibuktikan.
