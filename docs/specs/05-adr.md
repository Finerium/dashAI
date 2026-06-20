---
title: "Architecture Decision Records (ADR)"
subtitle: "dashAI — Saksi mata digital yang netral & tertandatangani"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Pendahuluan

Dokumen ini memuat **Architecture Decision Records (ADR)** untuk dashAI: sebuah
AI dashcam berbasis web (Next.js 16 App Router, React 19, TypeScript *strict*,
Tailwind v4) yang dideploy di Vercel pada
[https://dashai-mu.vercel.app](https://dashai-mu.vercel.app)
(sumber: [github.com/Finerium/dashAI](https://github.com/Finerium/dashAI),
lisensi Apache-2.0). dashAI mendeteksi pelanggaran lalu lintas secara *real-time*
di dalam browser, mengaitkan tiap pelanggaran ke pasal **UU No. 22 Tahun 2009
(LLAJ)** dari knowledge base terverifikasi, lalu menyegel bukti secara
kriptografis dengan **Ed25519** agar **tamper-evident** (bukan tamper-proof) dan
dapat diverifikasi siapa pun.

Setiap ADR mengikuti format baku: **Context** (konteks dan gaya tekanan/forces),
**Decision** (keputusan), **Status**, **Consequences** (konsekuensi positif,
negatif, dan netral), serta **Alternatives** (alternatif yang dipertimbangkan dan
alasan ditolak). Semua pernyataan teknis di dokumen ini di-*ground* langsung ke
kode sumber dalam repositori; rujukan berkas disertakan agar dapat ditelusuri.

## Konvensi status

| Status     | Arti                                                              |
|------------|-------------------------------------------------------------------|
| Accepted   | Keputusan berlaku dan tercermin di kode `main` saat ini.          |
| Proposed   | Diusulkan, belum sepenuhnya diimplementasikan.                    |
| Superseded | Digantikan oleh ADR lain (disertai rujukan).                      |

Seluruh ADR di bawah berstatus **Accepted** kecuali dinyatakan lain, karena
masing-masing telah terimplementasi pada kode yang berjalan di produksi demo.

## Ringkasan keputusan

| ADR | Judul | Status | Komponen kunci |
|-----|-------|--------|----------------|
| 001 | CV *real-time* in-browser vs server/upload | Accepted | `lib/cv/` |
| 002 | Tamper-evident via Ed25519 atas canonical payload | Accepted | `lib/crypto/` |
| 003 | Local-first IndexedDB + sealing eksplisit | Accepted | `lib/evidence/store.ts` |
| 004 | OpenStreetMap Overpass tanpa API key | Accepted | `lib/geo/osm.ts` |
| 005 | Rule engine pluggable + KB hukum tergenerate | Accepted | `lib/violations/engine.ts`, `lib/legal/` |
| 006 | `@react-pdf/renderer` untuk PDF tertandatangani serverless | Accepted | `app/api/report/`, `lib/report/` |
| 007 | Next.js 16 di Vercel + satu signing-key secret | Accepted | `app/api/`, `lib/crypto/keys.ts` |

\newpage

# ADR-001: Computer Vision *real-time* di browser (TF.js + MediaPipe) vs server/upload

## Context

Inti produk dashAI adalah mengubah ponsel/dashcam menjadi **saksi mata digital
yang netral** yang mendeteksi pelanggaran *seketika*, tanpa menunggu unggahan.
Ada dua arsitektur kandidat untuk pipeline computer vision (CV):

1. **In-browser (client-side)** — frame video diproses di perangkat dengan model
   yang dimuat dari CDN.
2. **Server/upload** — frame/klip dikirim ke backend, diinferensi di GPU server,
   hasil dikembalikan.

Forces (gaya yang menekan keputusan):

- **Privasi.** Klaim privacy-by-design dashAI (deteksi wajah, *bukan* pengenalan;
  blur default; local-first; selaras semangat UU 27/2022 tentang PDP) menuntut
  agar frame mentah tidak meninggalkan perangkat tanpa kehendak eksplisit
  pengguna. Mengirim seluruh stream ke server bertabrakan langsung dengan ini.
- **Latensi & biaya.** Deteksi *real-time* atas video butuh inferensi
  per-frame. Mengunggah video langsung berarti bandwidth besar, biaya GPU server,
  dan latensi *round-trip* yang merusak pengalaman "box merah seketika".
- **Demo via ponsel sekarang.** Target jangka pendek adalah demonstrasi lewat
  kamera ponsel (`getUserMedia`); perangkat keras khusus baru menyusul
  pasca-investor.
- **Heterogenitas perangkat.** Browser ponsel tidak dapat diprediksi (WebGL bisa
  gagal, model sekunder bisa gagal dimuat) sehingga pipeline harus
  *degrade gracefully*.

## Decision

dashAI menjalankan **seluruh pipeline CV di dalam browser**. Tidak ada frame yang
diunggah untuk inferensi. Pipeline (`lib/cv/pipeline.ts`, kelas `CVPipeline`)
mengorkestrasi per-frame:

- **Object detection** dengan **TensorFlow.js coco-ssd** (`base: "lite_mobilenet_v2"`,
  `lib/cv/detector.ts`). Bobot dimuat *runtime* dari CDN TF Hub — tidak ada yang
  dibundel, sehingga deployment tetap statis. Backend WebGL dengan *fallback* ke
  cpu/wasm bila WebGL gagal. Deteksi disaring ke kelas COCO relevan lalu-lintas
  (`car`, `motorcycle`, `bus`, `truck`, `bicycle`, `person`, `traffic light`;
  lihat `TRAFFIC_CLASSES` di `lib/cv/types.ts`).
- **Tracking** dengan **greedy IoU multi-object tracker** (`lib/cv/tracker.ts`,
  `iouThresh = 0.3`, `maxMissed = 8`) yang memberi *id* track stabil antar-frame
  dan menurunkan vektor kecepatan ternormalisasi per-track — sinyal inti untuk
  deteksi lawan-arah (arah gerak vs arus dominan).
- **Face & pose** dengan **MediaPipe Tasks Vision** (BlazeFace short-range,
  `lib/cv/face.ts`; Pose Landmarker lite, `lib/cv/pose.ts`), keduanya memuat WASM
  + model dari CDN jsDelivr/Google Storage dengan delegasi GPU.
- **Plate OCR** dengan **Tesseract.js** (`lib/cv/plate.ts`) yang berjalan *hanya*
  pada crop kecil dari frame pelanggaran yang sudah terkonfirmasi — bukan pada
  seluruh live stream — karena OCR mahal.

Model sekunder (face, pose) dibungkus `try/catch` saat *load* dan *inference*
sehingga kegagalan satu model tidak menjatuhkan live view (`CVPipeline.load` dan
`CVPipeline.analyze`).

![Pipeline CV in-browser](docs/diagrams/cv-pipeline.png)

## Status

**Accepted.** Terimplementasi penuh di `lib/cv/`. Deteksi *live* yang aktif:
lawan-arah, ngebut diri sendiri (GPS vs OSM), boncengan, dan terobos lampu merah
(lihat ADR-005).

## Consequences

**Positif**

- **Privasi terjaga secara struktural.** Karena inferensi lokal, frame mentah tidak
  pernah meninggalkan perangkat untuk deteksi; server baru menerima data ketika
  pengguna *menyegel* (ADR-002, ADR-003).
- **Latensi rendah & tanpa biaya GPU server.** Tidak ada infrastruktur inferensi
  yang perlu dibayar atau diskalakan; deployment dapat tetap berupa aplikasi
  Next.js yang ringan di Vercel (ADR-007).
- **Tahan kegagalan.** Model sekunder opsional; live view tetap berjalan dengan
  model apa pun yang berhasil dimuat.
- **Tanpa API key pihak ketiga** untuk CV — model bersumber dari CDN publik.

**Negatif**

- **Keterbatasan akurasi di perangkat lemah.** coco-ssd `lite_mobilenet_v2` adalah
  model ringan; deteksi khusus (helm, pelat SNI, kabin) belum dapat diandalkan
  dan dikatalogkan saja (lihat ADR-005 dan Roadmap README).
- **Estimasi kecepatan kendaraan lain bersifat perkiraan** (perubahan skala
  bbox + optical flow), berbeda dengan kecepatan diri sendiri (GPS) yang akurat.
- **Ketergantungan pada CDN** untuk bobot model: koneksi pertama kali butuh unduhan
  model.
- **Tamper-evidence, bukan tamper-proof.** Karena frame berasal dari klien, sistem
  tidak dapat membuktikan kamera benar-benar menyaksikan realitas (kamera bisa
  diarahkan ke layar). Ini konsekuensi sadar dari arsitektur in-browser dan
  ditangani secara jujur di ADR-002.

**Netral**

- Antarmuka `ObjectDetector` (`lib/cv/types.ts`) sengaja abstrak sehingga backend
  deteksi dapat ditukar ke YOLOv8/ONNX di masa depan tanpa mengubah pipeline.

## Alternatives

| Alternatif | Alasan ditolak |
|------------|----------------|
| **Unggah video/klip ke server, inferensi GPU** | Melanggar privacy-by-design (frame mentah keluar perangkat), menambah biaya GPU dan latensi, serta bandwidth besar pada jaringan seluler. |
| **WebRTC stream ke worker server** | Tetap mengirim citra mentah keluar perangkat; kompleksitas infrastruktur tinggi untuk demo. |
| **Native app (Core ML / NNAPI) sejak awal** | Lebih cepat di perangkat, tetapi memperlambat iterasi demo berbasis web dan menghambat akses lintas-platform instan via URL. Dipertimbangkan untuk fase perangkat keras khusus pasca-investor. |
| **WASM-only (tanpa WebGL)** | Lebih lambat; WebGL dipakai sebagai backend utama dengan WASM/CPU sebagai *fallback*, bukan default. |

\newpage

# ADR-002: Tamper-evident via Ed25519 atas *canonical payload* (bukan tamper-proof)

## Context

Masalah inti yang dipecahkan dashAI bukan sekadar enkripsi, melainkan **trust**:
di lapangan, "yang melanggar sering kali yang paling berani memfitnah", dan bukti
objektif kalah oleh emosi massa. Bukti yang dihasilkan harus dapat dibuktikan
**tidak berubah** sejak dibuat, dan dapat diverifikasi oleh pihak mana pun (mis.
kepolisian, pengadilan, atau pihak ketiga) **tanpa harus memercayai UI dashAI**.

Forces:

- Bukti harus **portabel & self-contained** — dapat diverifikasi tanpa basis data
  pusat atau panggilan ke server dashAI.
- Verifikasi harus **terbuka**: kunci publik dipublikasikan, verifikasi dapat
  berjalan di sisi klien siapa pun.
- Sistem harus **jujur**: karena frame berasal dari klien (ADR-001), kita tidak
  boleh mengklaim *tamper-proof*. Yang dapat dijanjikan adalah *tamper-evident*.
- Penandatanganan harus berjalan di runtime serverless Vercel (Node) dan
  verifikasi harus berjalan **identik** di server maupun browser.

## Decision

dashAI menyegel bukti dengan **tanda tangan digital Ed25519 atas payload
kanonik**, mengikuti alur **canonicalise → SHA-256 → Ed25519 sign**
(`lib/crypto/sign.ts`, fungsi `sealPayload`).

Detail desain:

- **Batas kriptografis yang eksplisit.** Tipe `EvidencePayload`
  (`lib/evidence/types.ts`, `schema: "dashai.evidence.v1"`) adalah JSON *persis*
  yang ditandatangani server. Apa pun di luar payload (media, presentasi) "tidak
  membawa bobot pembuktian". Payload memuat antara lain `eventId`, `violation`,
  `subject`, `capturedAt`, `sealedAt` (distempel server, otoritatif),
  `confidence`, `plateText`, `egoSpeedKmh`, `otherSpeedKmh`, `speedLimitKmh`,
  `location`, `road`, `mediaHashes`, dan snapshot `legal`.
- **Kanonikalisasi deterministik.** `canonicalize` (`lib/crypto/canonical.ts`)
  meng-*sort* kunci objek secara rekursif dan membuang nilai `undefined`, sehingga
  dua payload yang setara secara semantik menghasilkan byte identik — syarat agar
  hash + signature stabil antara klien dan server.
- **Commit ke media via hash, bukan byte.** `mediaHashes` menyimpan SHA-256 dari
  byte media (frame, faceCrop, plateCrop) sehingga payload yang ditandatangani
  *terikat* pada citra tanpa membengkak oleh megabyte base64
  (`MediaHashes` di `lib/evidence/types.ts`).
- **Library.** Penandatanganan/verifikasi memakai `@noble/ed25519` (v3) dan
  hashing `@noble/hashes` (v2). `verifySealed` (`lib/crypto/verify.ts`) berjalan
  *tak berubah* di browser dan server (mengandalkan Web Crypto SHA-512 yang
  tersedia di keduanya).
- **Dua pemeriksaan independen.** Verifikasi menyatakan VALID hanya bila (1)
  *hash* kanonik yang dihitung ulang cocok dengan `payloadHash` (membuktikan
  payload tak diedit) DAN (2) tanda tangan Ed25519 sah untuk payload itu di bawah
  kunci publik. Pesan hasil dalam Bahasa Indonesia membedakan kedua kegagalan.
- **Jujur soal batasan.** Komentar kode dan README menegaskan sistem
  **tamper-EVIDENT, bukan tamper-proof**: tanda tangan membuktikan "isi laporan
  tidak berubah satu byte pun sejak disegel server", tetapi **tidak** membuktikan
  kamera menyaksikan peristiwa dunia nyata.

![Siklus hidup penyegelan bukti](docs/diagrams/sequence-seal.png)

![Model ancaman](docs/diagrams/threat-model.png)

## Status

**Accepted.** Terimplementasi di `lib/crypto/{canonical,keys,sign,verify}.ts`,
`lib/evidence/{types,payload}.ts`, dan endpoint `app/api/seal`, `app/api/verify`,
`app/api/public-key`.

## Consequences

**Positif**

- **Integritas dapat dibuktikan & ditolak-palsu.** Mengubah pelat/kecepatan/pasal
  membuat hash tidak cocok → terdeteksi.
- **Verifikasi tanpa kepercayaan pada dashAI.** Kunci publik dipublikasikan di
  `/api/public-key`; verifikasi dapat dilakukan sisi klien siapa pun.
- **Self-contained.** Tidak perlu basis data; envelope berisi segala yang
  dibutuhkan untuk verifikasi (lihat ADR-006: QR membawa envelope penuh).
- **Portabel & cepat.** Ed25519 ringkas (signature 64 byte) dan cepat baik untuk
  sign maupun verify.

**Negatif**

- **Bukan tamper-proof.** Tidak ada jaminan kamera menyaksikan realitas;
  *device attestation* (Play Integrity / App Attest), kontinuitas GPS, dan
  perangkat keras khusus ada di Roadmap untuk menaikkan biaya pemalsuan — penilaian
  akhir tetap pada pihak berwenang.
- **Manajemen kunci adalah satu titik kepercayaan.** Keamanan bergantung pada
  kerahasiaan `DASHAI_SIGNING_KEY` (lihat ADR-007). Tidak ada rotasi/pencabutan
  kunci otomatis saat ini; `publicKeyId` menyertakan prefiks `prod-`/`dev-` untuk
  membedakan rezim kunci.
- **Snapshot hukum bersifat statis pada saat seal.** Bila pasal direvisi setelah
  penyegelan, laporan tetap mencerminkan teks saat disegel (ini sengaja, untuk
  integritas historis).

**Netral**

- `sealedAt` selalu distempel server (`Date.now()` di `app/api/seal/route.ts`),
  bukan dipercaya dari klien — menetapkan waktu otoritatif.

## Alternatives

| Alternatif | Alasan ditolak |
|------------|----------------|
| **RSA / ECDSA (P-256)** | Tanda tangan & kunci lebih besar/lambat; Ed25519 lebih ringkas dan deterministik, cocok untuk QR self-contained dan verifikasi lintas-lingkungan. |
| **HMAC (kunci simetris)** | Verifier harus memegang kunci rahasia → mustahil "siapa pun bisa memverifikasi"; tidak memenuhi syarat verifikasi terbuka. |
| **Blockchain / timestamping publik** | Kompleksitas, biaya, dan latensi tinggi untuk demo; tidak menyelesaikan masalah "kamera vs realitas"; dapat menjadi lapis tambahan kelak, bukan fondasi. |
| **Menandatangani byte media penuh** | Membengkakkan payload dan QR; diganti dengan commit via SHA-256 di `mediaHashes`. |
| **JSON Web Signature (JWS) standar** | Membawa kerumitan header/format; kanonikalisasi sendiri + Ed25519 mentah lebih sederhana dan lebih kecil untuk kebutuhan ini. |

\newpage

# ADR-003: Local-first IndexedDB + *sealing* eksplisit (privacy-by-design)

## Context

dashAI bertujuan **melindungi pemiliknya** sekaligus menindak pelanggar lain.
Pemilik menyimpan bukti yang mungkin meringankan (exculpatory) dan self-coaching.
Menyimpan bukti pribadi ini di server pihak ketiga secara default akan
menciptakan risiko privasi dan memperluas permukaan kepatuhan terhadap UU 27/2022
(PDP). Forces:

- Bukti adalah data pribadi/sensitif (lokasi, pelat, wajah dalam frame). Harus
  **di tangan pemilik** secara default.
- Server **tidak boleh** melihat apa pun kecuali yang **secara eksplisit** disegel
  oleh pengguna.
- Penyimpanan harus bertahan antar-sesi di browser ponsel dan mendukung daftar
  bukti yang dapat ditinjau ulang (review).

## Decision

dashAI memakai pendekatan **local-first**: bukti disimpan di **IndexedDB** pada
perangkat pengguna, dan server hanya menerima payload ketika pengguna **secara
eksplisit menyegel/melaporkan** sebuah event.

- **Store lokal.** `lib/evidence/store.ts` membuka database `idb` bernama
  `"dashai"` (versi 1) dengan object store `events` (`keyPath: "id"`) dan index
  `by-time` atas `capturedAt`. API: `saveEvent`, `getAllEvents` (terbaru dulu),
  `getEvent`, `deleteEvent`, `clearEvents`. Semua fungsi *no-op* dengan aman bila
  `indexedDB` tidak tersedia (mis. SSR), sehingga tidak menjatuhkan aplikasi.
- **Sealing eksplisit sebagai satu-satunya jembatan ke server.** Server baru
  menerima data melalui `POST /api/seal` ketika pengguna memilih menyegel
  (`app/api/seal/route.ts`). Komentar `store.ts` menegaskan: "server only ever
  sees a payload when the user explicitly seals/reports an event".
- **Privacy-by-design pada CV.** Deteksi wajah **bukan** pengenalan
  (`lib/cv/face.ts`: "face DETECTION only … never recognition"); wajah/pelat
  di-blur secara default di antarmuka. Koordinat GPS dibulatkan ke 4 desimal
  (~11 m) sebelum dikirim ke layanan peta pihak ketiga (lihat ADR-004), bukan
  presisi penuh.
- **Selaras semangat UU 27/2022 (PDP).** Minimisasi data, penyimpanan lokal,
  dan pelepasan data hanya atas tindakan eksplisit pengguna.

![Aliran data & batas kepercayaan](docs/diagrams/dfd.png)

## Status

**Accepted.** Terimplementasi di `lib/evidence/store.ts`; batas server-eksplisit
ditegakkan oleh desain endpoint `app/api/seal`.

## Consequences

**Positif**

- **Permukaan privasi minimal.** Tidak ada akumulasi bukti pengguna di server;
  data tetap di perangkat sampai pengguna memutuskan menyegel.
- **Bekerja offline untuk penangkapan & peninjauan.** Penyimpanan dan review tidak
  butuh jaringan; hanya penyegelan dan pembuatan PDF yang memanggil server.
- **Sejalan dengan PDP.** Minimisasi & kontrol pengguna mengurangi beban kepatuhan.

**Negatif**

- **Tidak ada sinkronisasi/cadangan lintas-perangkat.** Menghapus data browser =
  kehilangan bukti yang belum diekspor/disegel. (Mitigasi: ekspor PDF
  tertandatangani sebagai artefak portabel — ADR-006.)
- **Kuota & ketahanan IndexedDB bervariasi** antar browser ponsel; data dapat
  dibersihkan oleh OS di bawah tekanan penyimpanan.
- **Tidak ada panel admin pusat** untuk audit lintas-pengguna (sesuai tujuan
  privasi, tetapi membatasi fitur enterprise).

**Netral**

- Skema DB sederhana (satu store) dan dapat di-*migrate* via mekanisme `upgrade`
  bila versi dinaikkan.

## Alternatives

| Alternatif | Alasan ditolak |
|------------|----------------|
| **Penyimpanan server-side default (DB cloud)** | Menciptakan honeypot data pribadi, melanggar privacy-by-design, dan memperberat kepatuhan PDP. |
| **localStorage / cookies** | Kapasitas kecil, sinkron (memblokir), tak cocok untuk blob/objek terstruktur. |
| **OPFS / File System Access API** | Dukungan browser ponsel belum merata; IndexedDB lebih portabel dan punya pustaka `idb` yang matang. |
| **Auto-upload semua event terdeteksi** | Bertabrakan langsung dengan model kepercayaan dan privasi; penyegelan harus tindakan sadar pengguna. |

\newpage

# ADR-004: OpenStreetMap Overpass (tanpa API key) untuk `oneway`/`maxspeed`

## Context

Dua deteksi membutuhkan **konteks jalan yang ter-*ground* ke peta**:

- **Lawan-arah untuk diri sendiri** memerlukan apakah ruas bersifat satu-arah
  (`oneway`) dan arah sah (bearing) ruas tersebut.
- **Melebihi kecepatan untuk diri sendiri** memerlukan batas kecepatan legal ruas
  (`maxspeed`) untuk dibandingkan dengan kecepatan GPS (akurat).

Forces:

- Harus **tanpa API key pihak ketiga** (README menegaskan: "Tidak ada API key
  pihak ketiga yang dibutuhkan").
- Harus **menghormati privasi**: tidak mengirim koordinat presisi penuh ke
  layanan eksternal.
- Harus **degrade gracefully**: kegagalan jaringan tidak boleh memblokir live
  pipeline.
- Harus **murah & cukup akurat** untuk demo.

## Decision

dashAI me-*resolve* konteks jalan via **OpenStreetMap Overpass API** tanpa API key
(`lib/geo/osm.ts`, fungsi `resolveRoadContext`).

- **Endpoint ganda (failover).** Mengkueri `overpass-api.de` lalu
  `overpass.kumi.systems` sebagai cadangan.
- **Kueri terbatas.** Mencari `way(around:25, lat, lng)` pada kelas `highway`
  relevan (`motorway|trunk|primary|secondary|tertiary|residential|unclassified|
  service|living_street`) dengan `[out:json][timeout:8]`, mengambil `tags` +
  `geom`.
- **Privasi melalui pembulatan.** Koordinat dibulatkan ke **4 desimal (~11 m)**
  sebelum dikirim ke server Overpass — komentar kode: "we never send
  full-precision coordinates to the third-party Overpass servers".
- **Caching per-sel ~11 m.** Hasil di-cache per kunci `lat.toFixed(4),lng.toFixed(4)`
  (termasuk hasil `null`) agar tidak membanjiri Overpass.
- **Derivasi data jalan.** `oneway` dianggap benar bila tag bernilai
  `yes|true|1`; `bearingDeg` dihitung dari dua titik pertama geometri ruas
  (fungsi `bearing`); `maxspeedKmh` di-*parse* dari angka pertama pada tag
  `maxspeed` (`parseMaxspeed`). Hasilnya berupa `RoadContext`
  (`lib/evidence/types.ts`).
- **Fusi di engine.** `ruleWrongWaySelf` membandingkan heading GPS dengan
  `road.bearingDeg` (memicu bila selisih sudut > 120°, dan hanya bila laju
  ≥ 8 km/jam); `ruleSpeedingSelf` memicu bila kecepatan GPS melebihi
  `maxspeedKmh + 5 km/jam` (`SPEED_MARGIN_KMH`) — keduanya di
  `lib/violations/engine.ts`.
- **Tahan gagal.** Setiap kegagalan jaringan/parse mengembalikan `null` sehingga
  pipeline live tidak pernah terblokir.

## Status

**Accepted.** Terimplementasi di `lib/geo/osm.ts`, dikonsumsi oleh
`lib/violations/engine.ts`.

## Consequences

**Positif**

- **Nol biaya & tanpa API key.** Sesuai prinsip "tanpa kunci pihak ketiga".
- **Privasi terjaga** melalui pembulatan koordinat ~11 m.
- **Akurat untuk speeding diri sendiri** karena kecepatan dari chip GPS akurat dan
  batas dari peta legal (berbeda dari estimasi kecepatan kendaraan lain).
- **Tahan gangguan** via endpoint ganda + *graceful null* + cache.

**Negatif**

- **Kelengkapan data OSM bervariasi.** Tag `maxspeed`/`oneway` tidak selalu ada
  pada setiap ruas di Indonesia; ketika kosong, deteksi terkait tidak memicu.
- **Bergantung pada layanan publik** dengan kuota komunitas (Overpass) — bisa
  *rate-limited* atau lambat; di-mitigasi dengan failover + cache.
- **Granularitas ~11 m** bisa menempatkan titik di ruas tetangga pada
  persimpangan rapat (trade-off privasi vs presisi).
- **`bearingDeg` dari dua titik pertama** menyederhanakan ruas melengkung;
  memadai untuk demo, perlu penghalusan untuk produksi.

**Netral**

- `RoadContext` ikut tersimpan dalam payload bukti (`road`) sehingga konteks legal
  ruas terekam pada saat seal.

## Alternatives

| Alternatif | Alasan ditolak |
|------------|----------------|
| **Google Maps / Mapbox Roads API** | Butuh API key & biaya; bertentangan dengan prinsip "tanpa API key". |
| **HERE / TomTom speed-limit API** | Berbayar, lisensi membatasi; tidak gratis-untuk-demo. |
| **Tile vektor OSM yang di-self-host** | Kompleksitas operasional tinggi untuk demo; Overpass cukup. |
| **Mengirim koordinat presisi penuh** | Melanggar privacy-by-design; diganti pembulatan ~11 m. |
| **Tanpa konteks peta (hanya CV)** | Speeding-self & wrong-way-self kehilangan dasar legal yang akurat; fusi peta justru yang membuat keduanya andal. |

\newpage

# ADR-005: Rule engine pelanggaran yang *pluggable* + KB hukum tergenerate & terverifikasi

## Context

dashAI harus menalar **banyak jenis pelanggaran** dan mengaitkan tiap pelanggaran
ke **pasal yang benar** dari UU 22/2009. Dua risiko besar:

1. **Pengkodean aturan deteksi yang kaku** akan menyulitkan penambahan pelanggaran
   baru dan pemeliharaan.
2. **Halusinasi hukum** — bila sitasi pasal dikarang model, kredibilitas seluruh
   produk runtuh.

Forces:

- Menambah pelanggaran baru harus murah dan terlokalisasi.
- Hanya aturan dengan **sinyal yang sahih** dari detektor + GPS yang boleh memicu
  *live*; deteksi khusus (helm, pelat, kabin) dikatalogkan tapi belum live.
- Sitasi hukum harus **bukan halusinasi** dan dapat ditelusuri ke sumber resmi.
- Deteksi *real-time* harus stabil: tidak memicu di setiap frame, tahan derau
  satu-frame.

## Decision

dashAI memakai **satu rule engine pluggable** (`lib/violations/engine.ts`, kelas
`ViolationEngine`) yang dipasangkan dengan **knowledge base hukum yang
di-*generate* dari riset terverifikasi** (`lib/legal/citations.ts` +
`lib/legal/catalog.ts`).

**Rule engine**

- *Stateful* antar-frame: setiap aturan adalah metode privat yang mengembalikan
  `ViolationCandidate[]`; `update()` menggabungkan keluaran semua aturan,
  menerapkan **debounce** per `(violation, track/subject)` (`DEBOUNCE_MS = 6000`)
  dan **gerbang umur track minimum** (`MIN_TRACK_AGE = 4` frame) untuk membunuh
  derau satu-frame.
- Aturan *live* yang aktif: `ruleWrongWayOther` (arah gerak vs arus dominan,
  butuh ≥ 3 kendaraan bergerak, cosine < -0.6), `ruleWrongWaySelf` (heading GPS vs
  bearing OSM, selisih > 120°), `ruleSpeedingSelf` (GPS vs `maxspeed` + margin
  5 km/jam), `ruleOvercapacity` (≥ 3 orang pada satu track motor), dan
  `ruleRedLightSelf` (lampu merah + laju ≥ 10 km/jam).
- **Ekstensibilitas.** Komentar `catalog.ts` menyatakan menambah pelanggaran =
  "tambah entri meta, sebuah citation, dan sebuah detector rule". Antarmuka
  detektor (`ObjectDetector`) memungkinkan tukar backend tanpa mengubah aturan.

**Katalog & taksonomi**

- `VIOLATION_CATALOG` (`lib/legal/catalog.ts`) memuat **12 pelanggaran** dengan
  metadata: `tier` (`core|secondary|cabin`), `subjects` (`other|self`),
  `detectionBasis`, `requiresCabinCam`, dan `severity`. `ViolationKey`
  (`lib/evidence/types.ts`) mendefinisikan 12 kunci itu sebagai *type* tunggal,
  sehingga katalog, sitasi, dan engine konsisten secara *type-safe*.

**Knowledge base hukum (terverifikasi)**

- `CITATIONS` (`lib/legal/citations.ts`) di-*generate* dari output terverifikasi
  workflow riset Fase-0 dashAI dengan **verifikasi adversarial 3-voter** per-sitasi
  terhadap sumber resmi/terpercaya (hukumonline, korlantas.polri.go.id, dishub,
  dll). Komentar berkas: "Do not hand-edit — re-run the research workflow and
  regenerate". Artefak riset: `docs/research/phase0-research.json` (tiap entri
  memuat `verified: true`, `confirm_votes: 3`, `confidence: "high"`, dan daftar
  `sources`).
- Pada saat seal, `buildPayload` (`lib/evidence/payload.ts`) menempelkan snapshot
  legal (`uu`, `pasal`, `ayat`, `sanksi`) dari KB ke payload yang ditandatangani,
  dan `app/api/seal` menolak `violation` yang tidak ada di `CITATIONS`.

**Pemetaan pelanggaran → pasal (persis seperti `lib/legal/citations.ts`):**

| Kunci | Pelanggaran | Pasal & ayat | Denda maks | Kurungan maks |
|-------|-------------|--------------|-----------:|---------------|
| `lawan-arus` | Melawan arah | Pasal 287 ayat (1) | Rp500.000 | 2 bulan |
| `tanpa-helm` | Pengendara tanpa helm SNI | Pasal 291 ayat (1) | Rp250.000 | 1 bulan |
| `penumpang-tanpa-helm` | Penumpang tanpa helm | Pasal 291 ayat (2) | Rp250.000 | 1 bulan |
| `terobos-lampu-merah` | Menerobos lampu merah (APILL) | Pasal 287 ayat (2) | Rp500.000 | 2 bulan |
| `langgar-marka` | Melanggar marka/rambu | Pasal 287 ayat (1) | Rp500.000 | 2 bulan |
| `boncengan-lebih` | Boncengan lebih dari satu | Pasal 292 | Rp250.000 | 1 bulan |
| `melebihi-kecepatan` | Melebihi batas kecepatan | Pasal 287 ayat (5) | Rp500.000 | 2 bulan |
| `tanpa-sabuk` | Tanpa sabuk keselamatan | Pasal 289 | Rp250.000 | 1 bulan |
| `main-hp` | Bermain ponsel saat berkendara | Pasal 283 | Rp750.000 | 3 bulan |
| `tanpa-plat` | Tanpa pelat (TNKB) sah | Pasal 280 | Rp500.000 | 2 bulan |
| `tanpa-lampu-malam` | Tanpa lampu pada malam hari | Pasal 293 ayat (1) | Rp250.000 | 1 bulan |
| `motor-lampu-siang` | Motor tanpa lampu di siang hari | Pasal 293 ayat (2) | Rp100.000 | 15 hari |

Seluruh sitasi merujuk **UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan
Jalan (LLAJ)** dengan ancaman pidana bersifat **alternatif** (kurungan ATAU
denda).

![State pelanggaran (deteksi → konfirmasi → seal)](docs/diagrams/violation-state.png)

## Status

**Accepted.** Engine di `lib/violations/engine.ts`; KB & katalog di `lib/legal/`;
12 sitasi terverifikasi (3-voter). Deteksi live: lawan-arah, ngebut diri sendiri,
boncengan, terobos lampu merah. Sisanya dikatalogkan & ditampilkan via dataset
demo (deteksi penuh butuh model khusus / kamera kabin — lihat Roadmap README).

## Consequences

**Positif**

- **Ekstensibilitas terlokalisasi.** Pelanggaran baru = tiga edit terbatas
  (meta + citation + rule).
- **Kredibilitas hukum.** Sitasi bukan halusinasi; tergenerate & terverifikasi
  3-voter dengan sumber tertaut. `ViolationKey` menjaga konsistensi lintas-modul.
- **Deteksi live yang stabil** berkat debounce 6 detik + gerbang umur track 4
  frame + ambang gerak.
- **Snapshot legal terkunci pada seal** menjaga akurasi pembuktian historis.

**Negatif**

- **Cakupan live terbatas** pada aturan dengan sinyal sahih; helm/pelat/kabin
  masih demo, bukan deteksi penuh.
- **KB statis sampai re-generate.** Perubahan undang-undang perlu menjalankan
  ulang workflow riset; KB tidak boleh diedit tangan.
- **Estimasi kecepatan kendaraan lain bersifat perkiraan**; hanya speeding-self
  yang akurat (lihat catalog `detectionBasis`).
- **Ambang yang di-*hardcode*** (mis. cosine -0.6, selisih 120°) di-*tune* untuk
  demo dan dapat memerlukan kalibrasi per-lingkungan.

**Netral**

- Severitas & tier hanya metadata penyajian; tidak memengaruhi sitasi yang
  ditandatangani.

## Alternatives

| Alternatif | Alasan ditolak |
|------------|----------------|
| **Aturan ad-hoc tersebar di komponen UI** | Sulit diuji, dipelihara, dan diperluas; engine terpusat lebih bersih. |
| **Sitasi hukum dari LLM saat runtime** | Risiko halusinasi tinggi & tidak dapat diaudit; KB tergenerate-terverifikasi jauh lebih kredibel. |
| **Single big classifier untuk semua pelanggaran** | Kurang transparan & sulit dipetakan ke pasal; aturan eksplisit mudah dijelaskan ke penegak hukum. |
| **Memicu setiap frame tanpa debounce** | Membanjiri pengguna dengan duplikat & false positive; debounce + track-age memperbaikinya. |

\newpage

# ADR-006: `@react-pdf/renderer` untuk laporan PDF tertandatangani secara serverless

## Context

Keluaran akhir yang dapat dipegang pengguna dan disodorkan ke pihak berwenang
adalah **laporan PDF** (tilang / kecelakaan / coaching) dengan tanda tangan dan
**QR ke halaman verifikasi mandiri**. Forces:

- Harus dirender di **runtime serverless Vercel (Node)** tanpa dependensi biner
  berat (mis. headless Chromium) yang sulit dikemas.
- Verifikasi harus **self-contained**: PDF dapat diverifikasi tanpa basis data.
- Laporan harus **hanya dibuat untuk bukti yang sah** (tidak boleh memproduksi
  laporan "resmi" dari envelope yang gagal verifikasi).
- Jenis laporan mengikuti subjek (self → coaching, other → tilang) dengan opsi
  override.

## Decision

dashAI merender PDF dengan **`@react-pdf/renderer`** (v4) di endpoint Node
`POST /api/report` (`app/api/report/route.ts`, `runtime = "nodejs"`), memakai
komponen `ReportDocument` (`lib/report/ReportDocument.tsx`).

- **Verifikasi sebelum render.** Endpoint memverifikasi envelope (`verifySealed`
  dengan kunci publik server) dan **menolak (HTTP 422)** bila tidak valid:
  "Envelope tidak dapat diverifikasi — laporan resmi tidak dibuat." Ia juga
  menolak `violation` di luar `CITATIONS` (400).
- **QR + URL self-contained.** Envelope `SealedEvidence` di-*encode* `base64url`
  dan ditanam ke URL `\${origin}/verify?d=...`; QR (`qrcode`, lebar 256, ECC "M")
  dan URL keduanya dicetak di PDF. Komentar kode: "verification is self-contained
  and needs no database lookup — tamper-evidence without state". QR bersifat
  *best-effort* (bila gagal, URL tetap tercetak).
- **Pemilihan jenis.** `reportKind = kind ?? (subject === "self" ? "coaching" :
  "tilang")`; tipe `ReportKind = "tilang" | "kecelakaan" | "coaching"`
  (`lib/evidence/types.ts`).
- **Penandaan DEV.** Bila kunci server adalah kunci DEV (`isDev`), status itu
  diteruskan ke dokumen agar laporan non-produksi tertandai jelas.
- **Render ke buffer & unduh.** `renderToBuffer` menghasilkan PDF yang dikirim
  dengan `Content-Type: application/pdf` dan `Content-Disposition: attachment;
  filename="dashAI-\${kind}-\${eventId}.pdf"`; kegagalan render dibungkus 500.

## Status

**Accepted.** Terimplementasi di `app/api/report/route.ts` dan
`lib/report/ReportDocument.tsx`.

## Consequences

**Positif**

- **Tanpa Chromium di serverless.** `@react-pdf/renderer` murni JS → dikemas
  ringan di Vercel Node runtime; tidak ada biner berat.
- **Self-contained verification.** QR/URL membawa envelope penuh; verifikasi tak
  butuh basis data atau state server (selaras ADR-002/003).
- **Aman by-construction.** Laporan resmi hanya terbit untuk envelope yang lolos
  verifikasi; envelope cacat ditolak.
- **Pengalaman familiar (React).** Tata letak dokumen ditulis sebagai komponen
  React, konsisten dengan stack.

**Negatif**

- **Kapasitas QR terbatas.** Envelope besar (mis. banyak field) bisa menekan batas
  data QR; URL tercetak menjadi *fallback*. (Untuk demo, payload commit ke media
  via hash sehingga ringkas — ADR-002.)
- **Fidelitas tata letak** `@react-pdf/renderer` lebih terbatas dibanding mesin
  HTML→PDF penuh (subset CSS); memadai untuk laporan terstruktur.
- **Render PDF memakai CPU function**; untuk volume besar perlu pertimbangan
  *cold start*/durasi.

**Netral**

- Jenis laporan bersifat presentasi; integritas tetap berasal dari tanda tangan
  envelope, bukan dari PDF itu sendiri.

## Alternatives

| Alternatif | Alasan ditolak |
|------------|----------------|
| **Puppeteer/Playwright (headless Chromium) HTML→PDF** | Biner besar, sulit & lambat di serverless Vercel; *cold start* berat. |
| **`pdf-lib` / `pdfkit` manual** | Tata letak imperatif lebih rumit dibanding komponen React deklaratif. |
| **Render PDF di klien** | Menggandakan logika & memerlukan kunci/verifikasi di klien; render server menjaga konsistensi & gating verifikasi. |
| **Menyimpan PDF + lookup via DB untuk verifikasi** | Menambah state & honeypot; bertentangan dengan desain self-contained/local-first. |

\newpage

# ADR-007: Next.js 16 di Vercel + satu *signing-key secret*

## Context

dashAI butuh platform yang memadukan **frontend in-browser** (live CV, viewer,
verify) dengan **beberapa endpoint server** ringan (seal, verify, public-key,
report) yang harus berjalan di **Node runtime** (untuk `@react-pdf/renderer` dan
akses kunci privat). Forces:

- Stack sudah React 19 + TypeScript strict + Tailwind v4; butuh kohesi.
- Operasi sederhana: idealnya **satu rahasia** untuk dikelola.
- Kunci privat **tidak boleh** bocor ke klien; verifikasi harus bisa dilakukan
  publik via kunci publik.
- Deploy mudah & cepat untuk demo investor.

## Decision

dashAI dibangun dengan **Next.js 16 (App Router)** dan dideploy di **Vercel**,
dengan **satu-satunya rahasia** `DASHAI_SIGNING_KEY`.

- **Versi terkunci.** `package.json`: `next 16.2.9`, `react`/`react-dom` `19.2.4`,
  TypeScript `^5`, Tailwind `^4`. Dependensi domain: `@noble/ed25519 ^3.1.0`,
  `@noble/hashes ^2.2.0`, `@react-pdf/renderer ^4.5.1`,
  `@tensorflow/tfjs ^4.22.0`, `@tensorflow-models/coco-ssd ^2.2.3`,
  `@mediapipe/tasks-vision ^0.10.35`, `tesseract.js ^7.0.0`, `idb ^8.0.3`,
  `qrcode ^1.5.4`, `zustand ^5.0.14`.
- **Endpoint Node runtime.** Keempat route API (`app/api/{seal,verify,public-key,
  report}/route.ts`) mendeklarasikan `export const runtime = "nodejs"`.
- **Manajemen kunci tunggal.** `lib/crypto/keys.ts` membaca
  `DASHAI_SIGNING_KEY` (seed Ed25519 32-byte hex, divalidasi `^[0-9a-fA-F]{64}$`)
  yang "never leaves the server". Bila tidak ada/invalid, dipakai **kunci DEV**
  tetap & bertanda jelas (`keyId` berprefiks `dev-`; `prod-` untuk kunci sah)
  sehingga aplikasi tetap jalan *out of the box*. Hasil di-*cache* per proses.
- **Kunci publik dipublikasikan.** `GET /api/public-key` (cache `max-age=3600`)
  mengembalikan `publicKeyHex`, `keyId`, `algorithm`, `isDev` sehingga verifikasi
  tidak perlu memercayai UI dashAI.
- **Pemisahan tegas.** `lib/crypto/sign.ts` mengimpor `"server-only"`; verifikasi
  (`lib/crypto/verify.ts`) sengaja isomorfik (jalan di klien & server).

![Topologi deployment](docs/diagrams/deployment.png)

## Status

**Accepted.** Terimplementasi; aplikasi berjalan di
[dashai-mu.vercel.app](https://dashai-mu.vercel.app).

## Consequences

**Positif**

- **Operasi sangat sederhana.** Satu rahasia untuk dikelola; tanpa API key pihak
  ketiga lain.
- **DX & deploy cepat.** Next.js + Vercel memberi build/preview instan, cocok
  untuk iterasi demo.
- **Aman secara default untuk dev.** Kunci DEV memungkinkan menjalankan tanpa
  konfigurasi, tetapi laporan ditandai `dev-` agar tak disangka otoritatif.
- **Verifikasi terbuka** via `/api/public-key`.

**Negatif**

- **Risiko kunci tunggal.** Kompromi `DASHAI_SIGNING_KEY` membatalkan integritas;
  belum ada rotasi/pencabutan otomatis (mitigasi via prefiks `keyId` &
  pengelolaan rahasia Vercel).
- **Lock-in platform yang lunak.** Konvensi route App Router & runtime spesifik
  Vercel, meski Next.js dapat di-*self-host*.
- **Bahaya salah-set kunci di produksi.** Jika env var lupa di-set, sistem
  diam-diam memakai kunci DEV; di-mitigasi dengan penandaan `isDev` yang merambat
  ke laporan PDF & `/api/public-key`.

**Netral**

- *Cold start* function Node untuk `report`/`seal` dapat menambah latensi pertama;
  wajar untuk skala demo.

## Alternatives

| Alternatif | Alasan ditolak |
|------------|----------------|
| **SPA statis + backend terpisah (mis. Express/Fastify)** | Menambah infrastruktur & deploy ganda; App Router menyatukan UI + API. |
| **Edge runtime untuk semua route** | `@react-pdf/renderer` & beberapa API butuh Node; Edge tak cocok untuk render PDF. |
| **KMS terkelola (mis. cloud KMS) sejak awal** | Menambah kompleksitas & ketergantungan; untuk demo, satu env-secret cukup. KMS/rotasi masuk Roadmap produksi. |
| **Banyak secret (kunci per fungsi)** | Bertentangan dengan tujuan operasi minimal "satu rahasia". |

\newpage

# Penutup

ADR-001 sampai ADR-007 membentuk tulang punggung arsitektur dashAI: **CV
in-browser** (privasi & latensi), **tanda tangan Ed25519 tamper-evident** atas
payload kanonik (integritas yang jujur), **local-first IndexedDB dengan sealing
eksplisit** (privacy-by-design), **OpenStreetMap Overpass tanpa API key** (konteks
jalan untuk wrong-way & speeding-self), **rule engine pluggable dengan KB hukum
terverifikasi 3-voter** (kredibilitas hukum), **PDF tertandatangani serverless
yang self-contained** (artefak portabel), dan **Next.js 16 di Vercel dengan satu
signing-key** (operasi minimal).

Benang merah seluruh keputusan adalah **kejujuran teknis**: dashAI bersifat
**tamper-evident, bukan tamper-proof**, kecepatan kendaraan lain adalah
**estimasi** sedangkan kecepatan diri sendiri **akurat (GPS)**, dan laporan yang
dihasilkan saat ini adalah **demo via kamera ponsel** — bukan dokumen resmi
kepolisian. Peningkatan menuju produksi (device attestation, model khusus
helm/pelat, kamera kabin, kalibrasi estimasi kecepatan, integrasi ETLE) tercatat
pada Roadmap dan akan diabadikan sebagai ADR lanjutan ketika diputuskan.
