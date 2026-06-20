---
title: "Spesifikasi Kebutuhan Perangkat Lunak (SRS)"
subtitle: "dashAI — Saksi Mata Digital yang Netral & Tertandatangani · ISO/IEC/IEEE 29148:2018"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Pendahuluan

## Tujuan (Purpose)

Dokumen ini adalah Spesifikasi Kebutuhan Perangkat Lunak (Software Requirements Specification, SRS) untuk **dashAI**, sebuah *AI dashcam* berbasis web. Dokumen disusun mengikuti struktur ISO/IEC/IEEE 29148:2018 dan menjadi rujukan tunggal yang otoritatif atas kebutuhan fungsional, non-fungsional, antarmuka eksternal, serta atribut kualitas perangkat lunak dari sistem.

Pembaca yang dituju:

- **Insinyur perangkat lunak** yang mengembangkan dan memelihara dashAI;
- **Penguji (QA)** yang menyusun rencana verifikasi dan validasi;
- **Pemangku kepentingan hukum/kebijakan** yang menilai keselarasan dengan UU No. 22 Tahun 2009 (LLAJ) dan UU No. 27 Tahun 2022 (PDP);
- **Calon investor dan mitra** yang mengevaluasi cakupan dan batasan teknologi;
- **Auditor keamanan** yang meninjau model integritas bukti.

Lingkup versi yang dijelaskan adalah implementasi saat ini (kode sumber pada repositori `Finerium/dashAI`, lisensi Apache-2.0), yang merupakan **demonstrasi teknologi melalui kamera ponsel** — bukan dokumen resmi kepolisian. Batasan demo dinyatakan secara eksplisit pada setiap bagian yang relevan.

## Ruang Lingkup (Scope)

dashAI mengubah ponsel atau dashcam menjadi **saksi mata digital yang netral**. Sistem:

1. **Mendeteksi pelanggaran lalu lintas secara real-time di dalam peramban** (in-browser) menggunakan TensorFlow.js coco-ssd (object detection), *IoU tracker*, MediaPipe (face detection & pose landmarker), dan Tesseract.js (OCR pelat) — tanpa mengunggah video mentah.
2. **Mengaitkan setiap pelanggaran ke basis pengetahuan hukum yang terverifikasi**, yaitu pasal-pasal UU No. 22 Tahun 2009 (LLAJ). Katalog memuat 12 entri pelanggaran; setiap sitasi telah melalui verifikasi adversarial 3-*voter* terhadap sumber resmi/terpercaya.
3. **Menyegel bukti secara kriptografis** dengan tanda tangan **Ed25519** di sisi server (menggunakan satu rahasia tunggal, variabel lingkungan `DASHAI_SIGNING_KEY`), menghasilkan bukti yang **tamper-evident** (dapat-dibuktikan-bila-diubah) — bukan tamper-proof. Keaslian dapat diverifikasi oleh siapa pun melalui kunci publik di `/api/public-key`.
4. **Menghasilkan laporan PDF tertandatangani** (jenis *tilang*, *kecelakaan*, atau *coaching*) dengan QR menuju halaman verifikasi mandiri `/verify`.

dashAI bersifat **dwi-subjek**: menindak pihak lain (laporan ke kepolisian) **dan** melindungi pemiliknya (bukti meringankan/eksкulpatori serta *self-coaching*). Sistem dirancang **privacy-by-design**: deteksi wajah (bukan pengenalan identitas), blur secara default, penyimpanan *local-first* di IndexedDB; server hanya menerima *payload* yang secara eksplisit disegel pengguna.

**Di luar lingkup (out of scope)** pada versi ini: registrasi ETLE resmi/integrasi kanal kepolisian; *device attestation* (Play Integrity/App Attest); model khusus helm/pelat/kabin; kalibrasi presisi estimasi kecepatan kendaraan lain; serta perangkat keras dashcam khusus. Item-item ini tercantum pada peta jalan (Roadmap).

## Definisi, Akronim, dan Singkatan

| Istilah | Definisi |
|---|---|
| LLAJ | Lalu Lintas dan Angkutan Jalan — UU No. 22 Tahun 2009. |
| PDP | Pelindungan Data Pribadi — UU No. 27 Tahun 2022. |
| ETLE | *Electronic Traffic Law Enforcement* (tilang elektronik). |
| coco-ssd | Model *object detection* TensorFlow.js (basis `lite_mobilenet_v2`) dengan kelas COCO. |
| MediaPipe Tasks | Pustaka CV Google: di sini BlazeFace (face detector) dan Pose Landmarker. |
| Tesseract.js | Mesin OCR berbasis WebAssembly untuk membaca teks pelat. |
| IoU | *Intersection over Union* — metrik tumpang-tindih bounding-box; basis *tracker*. |
| OSM | OpenStreetMap; di sini diakses via Overpass API (tag `oneway`, `maxspeed`). |
| Ed25519 | Skema tanda tangan digital berbasis kurva Edwards (EdDSA), via `@noble/ed25519`. |
| SHA-256 | Fungsi hash kriptografis untuk *digest* payload kanonik. |
| Tamper-evident | Setiap perubahan pada isi yang disegel **terdeteksi** secara kriptografis (≠ tamper-proof: bukan mencegah pemalsuan dunia nyata). |
| Payload kanonik | Serialisasi JSON deterministik dengan kunci objek diurutkan rekursif (lihat `lib/crypto/canonical.ts`). |
| SealedEvidence | Amplop tertandatangani: `payload` + `algorithm` + `publicKeyId` + `payloadHash` + `signature` + `sealedAt`. |
| Subjek (`self` / `other`) | Pihak yang melakukan pelanggaran relatif terhadap pemilik dashAI. |
| Ego-vehicle | Kendaraan tempat dashAI dipasang (subjek `self`). |
| APILL | Alat Pemberi Isyarat Lalu Lintas (mis. lampu merah). |
| TNKB | Tanda Nomor Kendaraan Bermotor (pelat). |
| HUD | *Heads-Up Display* — overlay viewer (box merah, garis, panel pasal). |

## Referensi (References)

1. ISO/IEC/IEEE 29148:2018 — *Systems and software engineering — Life cycle processes — Requirements engineering*.
2. Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ).
3. Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
4. Basis pengetahuan hukum dashAI: `lib/legal/citations.ts` dan `lib/legal/catalog.ts` (digenerate dari `docs/research/phase0-research.json`, verifikasi adversarial 3-*voter*).
5. Tipe domain inti & batas kriptografis: `lib/evidence/types.ts`.
6. Lapisan kripto: `lib/crypto/{canonical,keys,sign,verify}.ts`.
7. Pipeline CV: `lib/cv/{pipeline,detector,tracker,face,pose,plate,types}.ts`.
8. Mesin aturan pelanggaran: `lib/violations/engine.ts`.
9. Endpoint API: `app/api/{seal,verify,public-key,report}/route.ts`.
10. README proyek (`README.md`) dan `.env.example`.
11. RFC 8032 — *Edwards-Curve Digital Signature Algorithm (EdDSA)*.

> Catatan konsistensi: seluruh sitasi pasal dalam dokumen ini diambil **persis** dari `lib/legal/citations.ts`. Jika terdapat perbedaan, berkas sumber tersebut yang berlaku.

# Deskripsi Keseluruhan (Overall Description)

## Perspektif Produk (Product Perspective)

dashAI adalah aplikasi web *self-contained* berbasis **Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4**, dideploy di Vercel pada `https://dashai-mu.vercel.app`. Arsitektur memisahkan dua bidang eksekusi secara tegas:

- **Klien (peramban/ponsel)** menjalankan seluruh CV, *tracking*, mesin aturan, *viewer* HUD, dan penyimpanan lokal IndexedDB. Tidak ada video mentah yang dikirim.
- **Server (Next.js *Node runtime* di Vercel)** hanya menjalankan empat *route* tanpa basis data persisten: `/api/seal`, `/api/verify`, `/api/public-key`, `/api/report`. Server menyimpan satu rahasia: kunci privat penandatangan.

Layanan eksternal bersifat **publik tanpa API key**: OpenStreetMap Overpass (konteks jalan) dan CDN model (TF.js Hub, MediaPipe Google Storage, paket WASM Tesseract). Diagram kontainer berikut merangkum batas-batas tersebut.

![Diagram C4 Kontainer dashAI](docs/diagrams/c4-container.png)

Aliran data lintas-batas dirangkum oleh DFD berikut; perhatikan bahwa satu-satunya data yang menyeberang dari klien ke server adalah *payload* bukti yang secara eksplisit disegel pengguna.

![Data Flow Diagram dashAI](docs/diagrams/dfd.png)

## Fungsi Produk (Product Functions)

Ringkasan fungsi tingkat tinggi:

- **F-CAPTURE** — Akuisisi kamera (`getUserMedia`), GPS (Geolocation), dan sensor gerak (DeviceMotion).
- **F-CV** — Analisis per-frame: object detection (coco-ssd) → *IoU tracking* → face detection + pose (opsional, degradasi anggun); estimasi *dominant flow*.
- **F-ENGINE** — Mesin aturan menilai kandidat pelanggaran dengan *minimum track age* dan *debounce* per-(pelanggaran, track).
- **F-CONTEXT** — Resolusi konteks jalan dari OSM Overpass (`oneway`, `bearing`, `maxspeed`), dengan caching per ~11 m dan koordinat dibulatkan.
- **F-LEGAL** — Pemetaan setiap pelanggaran ke sitasi pasal terverifikasi.
- **F-SEAL** — Penyegelan kriptografis Ed25519 di server (stempel waktu otoritatif + SHA-256 kanonik).
- **F-VERIFY** — Verifikasi tanda tangan + hash, berjalan identik di klien dan server.
- **F-REPORT** — Render PDF tertandatangani (tilang/kecelakaan/coaching) dengan QR ke `/verify`.
- **F-STORE** — Penyimpanan bukti *local-first* di IndexedDB; blur wajah/pelat default di UI.

## Kelas Pengguna dan Karakteristik (User Classes and Characteristics)

| Kelas Pengguna | Karakteristik | Fungsi utama yang diakses |
|---|---|---|
| Pemilik kendaraan (pengemudi) | Pengguna awam; memasang ponsel di kendaraan; ingin perlindungan & pelaporan. | F-CAPTURE, F-CV live, F-STORE, F-SEAL, F-REPORT (coaching/tilang). |
| Korban fitnah / pihak terlindungi | Pemilik yang butuh bukti meringankan saat dituduh. | F-SEAL bukti ekskulpatori, F-REPORT (kecelakaan). |
| Verifikator publik / petugas | Siapa pun yang menerima laporan PDF/QR dan ingin memverifikasi keaslian. | F-VERIFY (via `/verify` dan `/api/public-key`); tidak perlu memercayai UI dashAI. |
| Pengembang / operator | Mengonfigurasi `DASHAI_SIGNING_KEY`, deploy, memelihara katalog & sitasi. | Konfigurasi env, regenerasi KB hukum. |
| Auditor keamanan/hukum | Meninjau model integritas, privasi, dan keselarasan UU. | F-VERIFY, dokumen ini, artefak riset. |

## Lingkungan Operasi (Operating Environment)

- **Klien**: peramban modern di ponsel/desktop dengan WebGL (akselerasi TF.js, *fallback* CPU/WASM), akses kamera (`getUserMedia`, butuh konteks aman HTTPS), Geolocation, dan DeviceMotion (di iOS 13+ memerlukan izin eksplisit via gestur pengguna). Penyimpanan IndexedDB.
- **Server**: Next.js 16 *Node runtime* di Vercel (`export const runtime = "nodejs"` pada keempat *route*). Web Crypto tersedia untuk SHA-512 yang dibutuhkan `@noble/ed25519`.
- **Jaringan eksternal**: OSM Overpass (`overpass-api.de`, fallback `overpass.kumi.systems`); CDN model TF Hub; MediaPipe (`storage.googleapis.com`) + WASM (`cdn.jsdelivr.net`); paket Tesseract.js. Semua tanpa API key.

## Batasan Desain dan Implementasi (Constraints)

- **C-1 Local-first**: video mentah tidak pernah meninggalkan perangkat; hanya *payload* bukti tersegel yang dikirim ke server.
- **C-2 Satu rahasia**: hanya `DASHAI_SIGNING_KEY` (seed Ed25519 32-byte hex). Tidak ada API key pihak ketiga.
- **C-3 Tanpa basis data server**: verifikasi bersifat *stateless*; data verifikasi melekat di dalam laporan (QR + URL meng-*encode* amplop `SealedEvidence` penuh, base64url).
- **C-4 Tamper-evident, bukan tamper-proof**: tanda tangan membuktikan isi tidak berubah sejak disegel, **tidak** membuktikan kamera menyaksikan realitas fisik.
- **C-5 Privasi**: deteksi wajah saja (tanpa pengenalan); blur default; selaras UU PDP.
- **C-6 Cakupan deteksi live terbatas** (lihat §3.4): hanya aturan dengan sinyal sahih dari *detector* + GPS yang aktif live; sisanya dikatalogkan + ditampilkan via dataset demo.
- **C-7 TypeScript strict** dan kontrak tipe pada `lib/evidence/types.ts` sebagai batas kriptografis tunggal (`EvidencePayload`).
- **C-8 Bahasa hukum**: sitasi harus identik dengan `lib/legal/citations.ts`.

## Asumsi dan Ketergantungan (Assumptions and Dependencies)

- **A-1** Perangkat klien memiliki kamera berfungsi dan (untuk subjek `self`) GPS yang melaporkan `speed`/`heading`; bila tidak, aturan terkait tidak berjalan (degradasi anggun).
- **A-2** Konektivitas internet tersedia untuk memuat model dari CDN dan mengkueri OSM; bila gagal, pipeline tetap berjalan dengan model yang berhasil dimuat, dan resolusi jalan mengembalikan `null`.
- **A-3** OSM memiliki tag `oneway`/`maxspeed` untuk ruas terkait; akurasi deteksi melawan-arah-diri dan ngebut-diri bergantung pada kelengkapan tag.
- **A-4** Pengguna memberikan izin kamera/lokasi/gerak.
- **A-5** Untuk produksi, operator menetapkan `DASHAI_SIGNING_KEY`; bila tidak, kunci DEV dipakai dan laporan ditandai `dev-…` (tidak otoritatif).

# Kebutuhan Spesifik (Specific Requirements)

## Antarmuka Eksternal (External Interfaces)

### Antarmuka Perangkat Keras / Sensor (Klien)

| ID | Antarmuka | Sumber | Data | Catatan implementasi |
|---|---|---|---|---|
| EI-CAM | Kamera | `navigator.mediaDevices.getUserMedia` | `HTMLVideoElement` stream | Frame dianalisis lokal; tidak diunggah. Butuh HTTPS. |
| EI-GPS | Lokasi/kecepatan/heading | Geolocation API (`watchPosition`, `enableHighAccuracy`) | `lat`, `lng`, `accuracy`, `speedMps`, `headingDeg`, `timestamp` | `speed`/`heading` langsung dari chip — **akurat** (subjek `self`). `null` bila perangkat tidak melaporkan. Lihat `lib/geo/location.ts`. |
| EI-MOTION | Akselerometer | DeviceMotion API | Magnitudo akselerasi (g) | Deteksi *hard-brake* (≥ 0,75 g) & *impact* (≥ 2,5 g), *debounce* 3000 ms; auto-trigger penangkapan bukti kecelakaan. iOS 13+ butuh `requestPermission()`. Lihat `lib/sensors/motion.ts`. |

### Antarmuka Layanan Eksternal

| ID | Layanan | Endpoint | Permintaan | Respons / pemakaian |
|---|---|---|---|---|
| EI-OSM | OpenStreetMap Overpass | `overpass-api.de` (fallback `overpass.kumi.systems`) | POST query `way(around:25, lat, lng)` untuk kelas `highway` tertentu; koordinat dibulatkan 4 desimal (~11 m) | `RoadContext`: `name`, `oneway`, `bearingDeg`, `maxspeedKmh`. Cache per sel ~11 m; `null` pada kegagalan apa pun (non-blocking). Lihat `lib/geo/osm.ts`. |
| EI-CDN-TF | TF Hub CDN | runtime | muat bobot coco-ssd (`lite_mobilenet_v2`) | Tidak ada bobot di-*bundle*. Lihat `lib/cv/detector.ts`. |
| EI-CDN-MP | MediaPipe | `storage.googleapis.com/mediapipe-models/...` + WASM `cdn.jsdelivr.net/.../tasks-vision@0.10.35` | muat BlazeFace short-range & Pose Landmarker Lite (float16) | Delegasi GPU; `runningMode: VIDEO`. Lihat `lib/cv/{face,pose}.ts`. |
| EI-CDN-OCR | Tesseract.js | paket WASM | worker OCR bahasa `eng`, whitelist `A-Z0-9` | Hanya pada crop pelat dari frame pelanggaran. Lihat `lib/cv/plate.ts`. |

### Antarmuka Perangkat Lunak Internal (HTTP API)

Keempat *route* berjalan pada `runtime = "nodejs"`.

| ID | Metode + Path | Body permintaan | Respons sukses | Galat |
|---|---|---|---|---|
| API-SEAL | `POST /api/seal` | `{ event: ViolationEvent, mediaHashes?, device? }` | `200` `SealedEvidence` | `400` body/JSON tidak valid, event tidak lengkap (`id`,`violation`,`subject`,`capturedAt`), violation tak dikenal, subject bukan `self`/`other`. |
| API-VERIFY | `POST /api/verify` | `{ sealed: SealedEvidence }` | `200` `VerificationResult` | `400` JSON tidak valid / envelope tidak lengkap. |
| API-PUBKEY | `GET /api/public-key` | — | `200` `{ publicKeyHex, keyId, algorithm: "Ed25519", isDev }`, `Cache-Control: public, max-age=3600` | — |
| API-REPORT | `POST /api/report` | `{ sealed: SealedEvidence, kind?: ReportKind }` | `200` PDF (`application/pdf`, `Content-Disposition: attachment`) | `400` envelope tidak lengkap / violation tak dikenal; `422` envelope gagal verifikasi; `500` gagal render PDF. |

### Antarmuka Pengguna (UI Routes)

| Route | Fungsi |
|---|---|
| `/` | Landing. |
| `/live` | Tampilan langsung: kamera, HUD (box merah, garis pose, panel pasal), status pipeline, FPS, hitungan deteksi. |
| `/review` | Peninjauan & penyimpanan bukti; *breakdown* pasal; aksi seal/laporan. |
| `/verify` | Halaman verifikasi mandiri; menerima amplop via parameter `?d=` (base64url) dan memverifikasi di sisi klien dengan `/api/public-key`. |

## Kebutuhan Fungsional — Pipeline CV & Konteks {#cv}

| ID | Kebutuhan |
|---|---|
| FR-CV-01 | Sistem **harus** menjalankan coco-ssd (TF.js, basis `lite_mobilenet_v2`) untuk mendeteksi maksimum 20 objek per frame dengan ambang skor ≥ 0,45, lalu memfilter ke kelas lalu lintas (`car`, `motorcycle`, `bus`, `truck`, `bicycle`, `person`, `traffic light`) dan menormalkan bbox ke rentang 0..1. |
| FR-CV-02 | Sistem **harus** melacak objek antar-frame dengan *greedy IoU tracker* (ambang IoU 0,3; `maxMissed` 8 frame), memberi `id` track stabil, serta menurunkan velositas per-track (`vx`,`vy`, unit ternormalisasi/detik) dan `age`. |
| FR-CV-03 | Sistem **harus** menghitung *dominant flow* sebagai rata-rata velositas semua track yang bergerak (|v| > 0,01); `null` bila tidak ada. |
| FR-CV-04 | Sistem **harus** menjalankan face detection (MediaPipe BlazeFace) dan pose landmarker (MediaPipe, hingga 4 pose) secara opsional; kegagalan muat/inferensi salah satu model **harus** terdegradasi anggun tanpa menghentikan analisis frame. |
| FR-CV-05 | Face detection **harus** terbatas pada lokasi wajah untuk keperluan crop & blur. Sistem **dilarang** melakukan pengenalan identitas wajah. |
| FR-CV-06 | OCR pelat (Tesseract.js) **harus** dijalankan hanya pada crop region pelat dari frame pelanggaran (bukan pada stream live), memvalidasi format pelat Indonesia (`[A-Z]{1,2} \d{1,4} [A-Z]{1,3}`), dan mengembalikan `null` pada kegagalan. |
| FR-CTX-01 | Sistem **harus** meresolusi `RoadContext` (`oneway`, `bearingDeg`, `maxspeedKmh`, `name`) dari OSM Overpass untuk koordinat GPS, membulatkan koordinat ke 4 desimal sebelum dikirim ke server pihak ketiga, dan men-*cache* per sel ~11 m. |
| FR-CTX-02 | Resolusi konteks jalan **harus** non-blocking: kegagalan jaringan/parse mengembalikan `null` dan pipeline live tetap berjalan. |

## Kebutuhan Fungsional — Aturan Pelanggaran (per-rule) {#rules}

Mesin aturan (`lib/violations/engine.ts`) bersifat *stateful* lintas-frame. Setiap kandidat di-*debounce* per kunci `${violation}:${trackId|subject}` dengan **DEBOUNCE_MS = 6000**, dan aturan berbasis track memerlukan **MIN_TRACK_AGE = 4** frame. Margin kecepatan **SPEED_MARGIN_KMH = 5**.

### Aturan yang aktif live (implementasi mesin saat ini)

| ID | Pelanggaran (key) | Subjek | Pemicu (sesuai kode) | Confidence | Sitasi (lib/legal/citations.ts) |
|---|---|---|---|---|---|
| FR-RULE-01 | `lawan-arus` (melawan arah) | other | ≥ 3 kendaraan bergerak mendefinisikan *dominant flow* (|flow| ≥ 0,02); track kendaraan ber-`age` ≥ 4 dengan cosine-similarity vs flow < −0,6. | `min(0.92, 0.5 + (−cos − 0.6) + min(mag, 0.2))` | UU 22/2009, **Pasal 287 ayat (1)**; kurungan maks 2 bulan atau denda maks Rp500.000. |
| FR-RULE-02 | `lawan-arus` (melawan arah) | self | Ruas `oneway`; `bearingDeg` & `egoHeadingDeg` diketahui; `egoSpeedKmh` ≥ 8; |Δsudut| > 120°. | 0,90 | UU 22/2009, **Pasal 287 ayat (1)** (idem). |
| FR-RULE-03 | `melebihi-kecepatan` (speeding) | self | `maxspeedKmh` & `egoSpeedKmh` diketahui; `egoSpeedKmh` > limit + 5. | 0,95 | UU 22/2009, **Pasal 287 ayat (5)**; kurungan maks 2 bulan atau denda maks Rp500.000. |
| FR-RULE-04 | `boncengan-lebih` (boncengan >1) | other | Track `motorcycle` ber-`age` ≥ 4; jumlah `person` yang pusatnya berada di dalam bbox motor ≥ 3. | `min(0.85, 0.55 + (n−3)×0.1)` | UU 22/2009, **Pasal 292**; kurungan maks 1 bulan atau denda maks Rp250.000. |
| FR-RULE-05 | `terobos-lampu-merah` (terobos lampu merah) | self | `trafficLightState` = `red` dan `egoSpeedKmh` ≥ 10. | 0,80 | UU 22/2009, **Pasal 287 ayat (2)**; kurungan maks 2 bulan atau denda maks Rp500.000. |

> **Estimasi vs akurat.** Subjek `self` untuk kecepatan (FR-RULE-03) memakai GPS vs OSM `maxspeed` dan bersifat **akurat**. Estimasi kecepatan **kendaraan lain** (perubahan skala bbox + optical flow) bersifat **perkiraan** dan saat ini tidak memicu penyegelan otomatis. Deteksi melawan-arah memadukan OSM `oneway` + arah arus visual.

### Aturan terkatalog (ditampilkan via dataset demo; butuh model/kamera khusus)

Entri berikut ada di katalog (`lib/legal/catalog.ts`) dan basis sitasi, tetapi **belum** dideteksi live; ditandai tier dan kebutuhan kamera kabin sesuai katalog. ID kebutuhan: **FR-CAT-xx**.

| ID | Pelanggaran (key) | Tier | Kamera kabin? | Sitasi (lib/legal/citations.ts) |
|---|---|---|---|---|
| FR-CAT-01 | `tanpa-helm` (pengendara tanpa helm) | core | tidak | UU 22/2009, **Pasal 291 ayat (1)**; kurungan maks 1 bulan / denda maks Rp250.000. |
| FR-CAT-02 | `penumpang-tanpa-helm` | secondary | tidak | UU 22/2009, **Pasal 291 ayat (2)**; kurungan maks 1 bulan / denda maks Rp250.000. |
| FR-CAT-03 | `langgar-marka` (melanggar marka/rambu) | secondary | tidak | UU 22/2009, **Pasal 287 ayat (1)**; kurungan maks 2 bulan / denda maks Rp500.000. |
| FR-CAT-04 | `tanpa-sabuk` (tanpa sabuk keselamatan) | cabin | **ya** | UU 22/2009, **Pasal 289**; kurungan maks 1 bulan / denda maks Rp250.000. |
| FR-CAT-05 | `main-hp` (bermain ponsel) | cabin | **ya** | UU 22/2009, **Pasal 283**; kurungan maks 3 bulan / denda maks Rp750.000. |
| FR-CAT-06 | `tanpa-plat` (tanpa pelat sah) | secondary | tidak | UU 22/2009, **Pasal 280**; kurungan maks 2 bulan / denda maks Rp500.000. |
| FR-CAT-07 | `tanpa-lampu-malam` (tanpa lampu malam) | secondary | tidak | UU 22/2009, **Pasal 293 ayat (1)**; kurungan maks 1 bulan / denda maks Rp250.000. |
| FR-CAT-08 | `motor-lampu-siang` (motor tanpa lampu siang) | secondary | tidak | UU 22/2009, **Pasal 293 ayat (2)**; kurungan maks 15 hari / denda maks Rp100.000. |

> Total taksonomi 12 entri: 4 *core* yang aktif live (`lawan-arus`, `melebihi-kecepatan`, `boncengan-lebih`, `terobos-lampu-merah`) + 8 entri terkatalog di atas. Setiap entri terikat ke sitasi terverifikasi (12/12, *confidence* `high`, `verified: true`, 3 *confirm votes*).

## Kebutuhan Fungsional — Seal, Verify, Report

| ID | Kebutuhan |
|---|---|
| FR-SEAL-01 | `POST /api/seal` **harus** memvalidasi kelengkapan event (`id`, `violation`, `subject`, `capturedAt`), menolak `violation` di luar `CITATIONS`, dan menolak `subject` selain `self`/`other` (HTTP 400). |
| FR-SEAL-02 | Server **harus** men-*clamp* `confidence` ke rentang 0..1 dan menstempel `sealedAt` dengan waktu **server** (otoritatif) — tidak pernah memercayai waktu dari klien. |
| FR-SEAL-03 | Server **harus** menyusun `EvidencePayload` (`schema: "dashai.evidence.v1"`) dengan snapshot legal (`uu`, `pasal`, `ayat`, `sanksi`) yang diresolusi dari KB sitasi pada saat seal. |
| FR-SEAL-04 | Penyegelan **harus**: kanonikalisasi payload (kunci terurut rekursif, `undefined` dibuang) → SHA-256 hex → tanda tangan Ed25519 dengan kunci privat server, menghasilkan `SealedEvidence` berisi `payload`, `algorithm: "Ed25519"`, `publicKeyId`, `payloadHash`, `signature`, `sealedAt`. |
| FR-SEAL-05 | Media (frame/faceCrop/plateCrop) **harus** direpresentasikan dalam payload sebagai hash SHA-256 (`mediaHashes`) — payload berkomitmen pada citra tanpa menyertakan megabytes base64. |
| FR-VER-01 | Verifikasi **harus** menjalankan dua pemeriksaan independen: (1) hash kanonik yang dihitung ulang cocok dengan `payloadHash`; (2) tanda tangan Ed25519 valid untuk payload terhadap kunci publik. Hasil `valid` = keduanya benar. |
| FR-VER-02 | Verifikasi **harus** berjalan identik di klien (`/verify`) dan server (`/api/verify`); halaman `/verify` mengambil kunci publik dari `/api/public-key` sehingga kepercayaan tidak bergantung pada UI/route server dashAI. |
| FR-VER-03 | `VerificationResult` **harus** memuat alasan ber-bahasa Indonesia yang membedakan kasus hash tidak cocok ("isi laporan telah diubah") vs tanda tangan tidak valid. |
| FR-PUB-01 | `GET /api/public-key` **harus** mempublikasikan `publicKeyHex`, `keyId`, `algorithm`, dan flag `isDev`, dengan `Cache-Control` 1 jam. |
| FR-REP-01 | `POST /api/report` **harus** memverifikasi ulang amplop sebelum membuat laporan; bila tidak valid, mengembalikan **422** dan tidak membuat dokumen resmi. |
| FR-REP-02 | Jenis laporan **harus** ditentukan dari `kind` atau diturunkan dari subjek (`self` → `coaching`, `other` → `tilang`); jenis `kecelakaan` juga didukung (`ReportKind = "tilang" \| "kecelakaan" \| "coaching"`). |
| FR-REP-03 | PDF **harus** menyematkan QR dan URL `/verify?d=<base64url(SealedEvidence)>` sehingga verifikasi bersifat mandiri tanpa basis data; QR bersifat *best-effort* (URL juga dicetak). |
| FR-REP-04 | Bila kunci DEV dipakai (`isDev`), laporan **harus** menandainya secara jelas (mis. `keyId` ber-prefiks `dev-`). |
| FR-STORE-01 | Bukti **harus** disimpan *local-first* di IndexedDB (store `events`, indeks `by-time`), terurut terbaru-dulu; server hanya melihat payload saat pengguna eksplisit menyegel/melaporkan. |

## Kebutuhan Kinerja (Performance Requirements)

| ID | Kebutuhan |
|---|---|
| PERF-01 | Pipeline live **harus** beroperasi secara *frame-by-frame* pada peramban ponsel; *backend* TF.js memilih WebGL bila tersedia dan *fallback* CPU/WASM secara otomatis tanpa kegagalan keras. |
| PERF-02 | *Detector* **harus** membatasi inferensi pada maksimum 20 objek/frame dengan ambang 0,45 untuk menjaga *throughput* pada perangkat seluler. |
| PERF-03 | Model dimuat lazim (*lazy*, `import()` dinamis) dari CDN; UI **harus** menampilkan status pemuatan per-model (object/face/pose) dan tetap interaktif selama pemuatan. |
| PERF-04 | Resolusi OSM **harus** di-*cache* per sel ~11 m dan tidak boleh memblokir loop frame (PERF-budget jaringan terisolasi dari render). |
| PERF-05 | OCR pelat (mahal) **harus** dijalankan hanya pada crop frame pelanggaran, bukan pada setiap frame live. |
| PERF-06 | `/api/public-key` **harus** dapat di-*cache* publik 1 jam guna mengurangi beban verifikasi berulang. |
| PERF-07 | Penyegelan **harus** berkomitmen pada media via hash, menjaga ukuran payload tanda tangan tetap kecil terlepas dari ukuran citra. |
| PERF-08 | Deteksi gerak **harus** men-*debounce* event 3000 ms agar satu kejadian impact/hard-brake tidak dilaporkan berulang. |

## Kebutuhan Keamanan (Security Requirements)

| ID | Kebutuhan |
|---|---|
| SEC-01 | Sistem **harus** menandatangani `EvidencePayload` dengan **Ed25519** (`@noble/ed25519`) atas byte payload **kanonik**, menyertakan SHA-256 hex (`@noble/hashes`) sebagai `payloadHash`. |
| SEC-02 | Kunci privat (`DASHAI_SIGNING_KEY`, seed 32-byte hex tervalidasi regex `^[0-9a-fA-F]{64}$`) **harus** menjadi satu-satunya rahasia, dibaca hanya di server, di-*cache* dalam memori, dan **tidak pernah** dikirim ke klien. Modul `sign` ditandai `server-only`. |
| SEC-03 | Sistem **harus** mempublikasikan hanya kunci publik via `/api/public-key`, sehingga verifikasi tidak memerlukan kepercayaan pada UI dashAI. |
| SEC-04 | Bila env key tidak ada/invalid, sistem **harus** memakai kunci **DEV** yang ditandai jelas, dan `keyId`/laporan **harus** ber-prefiks `dev-`; bukti DEV **dilarang** diperlakukan sebagai otoritatif. |
| SEC-05 | Kanonikalisasi **harus** deterministik (urut kunci rekursif, buang `undefined`) agar payload yang sama menghasilkan byte identik di klien dan server — mencegah ambiguitas hash/tanda tangan. |
| SEC-06 | Verifikasi **harus** menolak amplop yang isinya diubah (hash tidak cocok) maupun tanda tangan yang tidak valid, dengan dua pemeriksaan terpisah (lihat FR-VER-01). |
| SEC-07 | `/api/report` **harus** menolak (HTTP 422) menghasilkan laporan untuk amplop yang gagal verifikasi. |
| SEC-08 | **Tamper-evident, bukan tamper-proof.** Sistem **harus** menyatakan secara jujur bahwa tanda tangan membuktikan keutuhan isi sejak `sealedAt`, **bukan** bahwa kamera menyaksikan realitas fisik (frame berasal dari klien). Jalan mitigasi (device attestation, kontinuitas GPS, perangkat keras khusus) tercatat di Roadmap; penilaian akhir tetap pada pihak berwenang. |
| SEC-09 | Validasi input **harus** dilakukan pada semua *route* (JSON valid, kelengkapan event/envelope, kelas pelanggaran dikenal, subjek valid) dengan kode galat HTTP yang sesuai. |

## Kebutuhan Privasi (UU PDP)

| ID | Kebutuhan |
|---|---|
| PRIV-01 | Sistem **harus** menerapkan *privacy-by-design*: penyimpanan *local-first* di IndexedDB; server hanya menerima payload yang **secara eksplisit** disegel/dilaporkan pengguna. |
| PRIV-02 | Sistem **harus** melakukan **deteksi** wajah saja (lokalisasi untuk crop+blur), **bukan** pengenalan identitas — batas privasi inti yang selaras dengan semangat UU No. 27 Tahun 2022. |
| PRIV-03 | Antarmuka **harus** mem-blur wajah dan pelat secara default pada tampilan bukti. |
| PRIV-04 | Koordinat yang dikirim ke layanan pihak ketiga (OSM Overpass) **harus** dibulatkan ke 4 desimal (~11 m) sebelum dikirim, untuk mengurangi presisi lokasi yang terekspos. |
| PRIV-05 | Video mentah **dilarang** diunggah; hanya hash media dan metadata payload yang menyeberang ke server saat seal. |
| PRIV-06 | Pengguna **harus** mengendalikan siklus hidup bukti lokal (simpan/hapus/bersihkan) melalui store IndexedDB (`saveEvent`/`deleteEvent`/`clearEvents`). |
| PRIV-07 | Pemrosesan data pribadi (citra wajah/pelat) **harus** berbasis kebutuhan dan minim: hanya pada crop frame pelanggaran, bukan pada stream berkelanjutan (mendukung prinsip minimalisasi data). |

## Atribut Kualitas Perangkat Lunak (Software Quality Attributes)

| Atribut | ID | Kebutuhan |
|---|---|---|
| Keandalan (Reliability) | QA-REL-01 | Model sekunder (face/pose) **harus** terbungkus penanganan galat sehingga kegagalan satu model tidak menjatuhkan live view. |
| Ketahanan (Robustness) | QA-ROB-01 | Resolusi OSM, OCR, dan QR **harus** *fail-soft* (mengembalikan `null`/best-effort) tanpa menghentikan alur utama. |
| Portabilitas (Portability) | QA-POR-01 | Verifikasi **harus** berjalan tanpa modifikasi di klien dan server (memanfaatkan Web Crypto SHA-512 yang tersedia di keduanya). |
| Keterujian (Testability) | QA-TST-01 | Batas kriptografis tunggal (`EvidencePayload`) + kanonikalisasi deterministik membuat seal/verify dapat diuji secara byte-exact. |
| Kemudahan pemeliharaan (Maintainability) | QA-MNT-01 | Mesin aturan bersifat *pluggable* (tambah pelanggaran = tambah entri katalog + sitasi + aturan *detector*); *detector* mematuhi antarmuka `ObjectDetector` agar coco-ssd dapat diganti ke YOLOv8/ONNX. |
| Akurasi/Kejujuran (Accuracy/Honesty) | QA-ACC-01 | Sitasi hukum **dilarang** halusinasi: berasal dari KB terverifikasi (12/12, 3-voter). Klaim integritas **dilarang** menyatakan tamper-proof. Estimasi kecepatan kendaraan lain **harus** dilabeli sebagai perkiraan. |
| Keterpasangan (Deployability) | QA-DEP-01 | Tidak ada bobot model di-*bundle* dan tidak ada API key pihak ketiga; satu-satunya konfigurasi rahasia adalah `DASHAI_SIGNING_KEY`. |
| Aksesibilitas internasionalisasi | QA-I18N-01 | Antarmuka & pesan galat utama berbahasa Indonesia, konsisten dengan konteks hukum LLAJ. |

# Verifikasi (Verification)

Bagian ini memetakan metode verifikasi per kelompok kebutuhan. Metode: **T** = Test (uji eksekusi), **I** = Inspection (telaah kode/dokumen), **D** = Demonstration (demonstrasi), **A** = Analysis (analisis).

| Kelompok kebutuhan | Metode | Pendekatan verifikasi |
|---|---|---|
| FR-CV-01..06 | T, D | Umpankan video uji; verifikasi kelas terfilter, normalisasi bbox 0..1, `id`/`age`/velositas track, degradasi anggun saat memutus model face/pose, dan OCR hanya pada crop. |
| FR-CTX-01..02 | T, A | Uji koordinat dengan/ tanpa tag OSM; konfirmasi pembulatan 4 desimal pada query, caching per sel, dan `null` non-blocking pada kegagalan jaringan. |
| FR-RULE-01..05 | T, A | Uji unit mesin aturan dengan `FrameAnalysis`/`EngineContext` sintetis: ambang cosine < −0,6 & ≥3 kendaraan; Δsudut > 120° & speed ≥ 8; speed > limit+5; ≥3 person dalam bbox motor; lampu merah & speed ≥ 10. Verifikasi *debounce* 6000 ms dan `MIN_TRACK_AGE` 4. |
| FR-CAT-01..08 | I, D | Inspeksi katalog & sitasi; demonstrasi via dataset demo (ditandai `demo: true`, tidak diperlakukan sebagai bukti nyata). |
| FR-SEAL-01..05 | T | Uji endpoint seal: penolakan event tak lengkap/violation tak dikenal/subject invalid; clamp confidence; stempel `sealedAt` server; struktur `SealedEvidence`; komitmen media via hash. |
| FR-VER-01..03 | T | Uji round-trip seal→verify (valid); mutasi 1 byte payload → hash mismatch; tanda tangan rusak → invalid; konsistensi hasil klien vs server. |
| FR-PUB-01 | T | Uji `/api/public-key` mengembalikan `publicKeyHex`/`keyId`/`algorithm`/`isDev` + header cache. |
| FR-REP-01..04 | T, D | Uji penolakan 422 pada amplop invalid; pemilihan `kind` dari subjek; QR/URL `/verify?d=`; penanda DEV. |
| FR-STORE-01 | T, D | Uji persistensi IndexedDB, urutan terbaru-dulu, hapus/bersihkan. |
| PERF-01..08 | T, A | Ukur FPS pada perangkat acuan; konfirmasi fallback backend; budget jaringan terisolasi; OCR tidak per-frame; debounce gerak. |
| SEC-01..09 | T, I, A | Uji tanda tangan/hash; inspeksi `server-only` & non-eksposur kunci; validasi env key; uji deteksi perubahan; tinjau pernyataan tamper-evident. |
| PRIV-01..07 | I, A, D | Telaah local-first, tidak ada pengenalan wajah, blur default, pembulatan koordinat, dan tidak ada unggahan video. |
| QA-* | I, A | Telaah penanganan galat, portabilitas verifikasi, pluggability mesin/`ObjectDetector`, dan kejujuran klaim. |

Verifikasi diterima jika seluruh kebutuhan **harus** (wajib) lulus metode yang dipetakan dan tidak ada klaim integritas/akurasi yang melampaui yang dibuktikan kode.

# Lampiran (Appendix): Catatan Keterlacakan (Traceability)

## Pelanggaran → Sitasi → Artefak kode

Tabel berikut menelusuri tiap pelanggaran ke pasal (persis dari `lib/legal/citations.ts`), tier (dari `lib/legal/catalog.ts`), dan status deteksi (dari `lib/violations/engine.ts`).

| Key | Pasal · Ayat (UU 22/2009) | Denda maks | Kurungan maks | Tier | Status deteksi |
|---|---|---|---|---|---|
| `lawan-arus` | Pasal 287 · ayat (1) | Rp500.000 | 2 bulan | core | Live (other: flow; self: OSM oneway+heading) |
| `melebihi-kecepatan` | Pasal 287 · ayat (5) | Rp500.000 | 2 bulan | core | Live (self: GPS vs OSM maxspeed, akurat) |
| `boncengan-lebih` | Pasal 292 | Rp250.000 | 1 bulan | core | Live (≥3 person pada bbox motor) |
| `terobos-lampu-merah` | Pasal 287 · ayat (2) | Rp500.000 | 2 bulan | core | Live (self: lampu merah + melaju) |
| `tanpa-helm` | Pasal 291 · ayat (1) | Rp250.000 | 1 bulan | core | Katalog/demo (butuh model helm) |
| `penumpang-tanpa-helm` | Pasal 291 · ayat (2) | Rp250.000 | 1 bulan | secondary | Katalog/demo |
| `langgar-marka` | Pasal 287 · ayat (1) | Rp500.000 | 2 bulan | secondary | Katalog/demo |
| `tanpa-plat` | Pasal 280 | Rp500.000 | 2 bulan | secondary | Katalog/demo |
| `tanpa-lampu-malam` | Pasal 293 · ayat (1) | Rp250.000 | 1 bulan | secondary | Katalog/demo |
| `motor-lampu-siang` | Pasal 293 · ayat (2) | Rp100.000 | 15 hari | secondary | Katalog/demo |
| `tanpa-sabuk` | Pasal 289 | Rp250.000 | 1 bulan | cabin | Katalog/demo (butuh kamera kabin) |
| `main-hp` | Pasal 283 | Rp750.000 | 3 bulan | cabin | Katalog/demo (butuh kamera kabin) |

## Kebutuhan → Modul kode

| Kebutuhan | Modul/berkas utama |
|---|---|
| FR-CV-01..03 | `lib/cv/detector.ts`, `lib/cv/tracker.ts`, `lib/cv/pipeline.ts`, `lib/cv/types.ts` |
| FR-CV-04..05 | `lib/cv/face.ts`, `lib/cv/pose.ts`, `lib/cv/pipeline.ts` |
| FR-CV-06 | `lib/cv/plate.ts` |
| FR-CTX-01..02 | `lib/geo/osm.ts`, `lib/geo/location.ts` |
| FR-RULE-01..05 | `lib/violations/engine.ts` |
| FR-CAT-01..08 | `lib/legal/catalog.ts`, `lib/legal/citations.ts` |
| FR-SEAL-01..05 | `app/api/seal/route.ts`, `lib/evidence/payload.ts`, `lib/crypto/{canonical,keys,sign}.ts` |
| FR-VER-01..03 | `app/api/verify/route.ts`, `app/verify/page.tsx`, `lib/crypto/verify.ts` |
| FR-PUB-01 | `app/api/public-key/route.ts`, `lib/crypto/keys.ts` |
| FR-REP-01..04 | `app/api/report/route.ts`, `lib/report/ReportDocument.tsx` |
| FR-STORE-01 | `lib/evidence/store.ts` |
| EI-CAM/GPS/MOTION | `app/live/page.tsx`, `lib/geo/location.ts`, `lib/sensors/motion.ts` |
| SEC-01..09 | `lib/crypto/{canonical,keys,sign,verify}.ts`, semua `app/api/*` |
| PRIV-01..07 | `lib/evidence/store.ts`, `lib/cv/face.ts`, `lib/geo/osm.ts` |

## Definisi konstanta acuan (sumber kode)

| Konstanta | Nilai | Berkas |
|---|---|---|
| `DEBOUNCE_MS` (mesin aturan) | 6000 ms | `lib/violations/engine.ts` |
| `MIN_TRACK_AGE` | 4 frame | `lib/violations/engine.ts` |
| `SPEED_MARGIN_KMH` | 5 km/jam | `lib/violations/engine.ts` |
| Ambang IoU tracker | 0,3 | `lib/cv/tracker.ts` |
| `maxMissed` tracker | 8 frame | `lib/cv/tracker.ts` |
| Maks objek / ambang skor detektor | 20 / 0,45 | `lib/cv/detector.ts` |
| `HARD_BRAKE_G` / `IMPACT_G` | 0,75 g / 2,5 g | `lib/sensors/motion.ts` |
| Debounce gerak | 3000 ms | `lib/sensors/motion.ts` |
| Granularitas cache/koordinat OSM | 4 desimal (~11 m) | `lib/geo/osm.ts` |
| Skema payload | `dashai.evidence.v1` | `lib/evidence/types.ts` |
| Algoritma tanda tangan | Ed25519 | `lib/crypto/sign.ts` |

> Seluruh nilai, pasal, denda, dan ambang dalam dokumen ini bersumber langsung dari kode dan basis pengetahuan hukum yang disebut; tidak ada angka yang direka. dashAI adalah demonstrasi teknologi — laporan yang dihasilkan bukan dokumen resmi kepolisian; sitasi bersifat indikatif; estimasi kecepatan kendaraan lain bersifat perkiraan; dan integritas bukti bersifat **tamper-evident**, bukan tamper-proof.
