---
title: "dashAI — Product Requirements Document (PRD)"
subtitle: "Saksi mata digital yang netral & tertandatangani — AI dashcam berbasis browser untuk deteksi pelanggaran lalu lintas, sitasi UU LLAJ, dan penyegelan bukti kriptografis"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Ringkasan Eksekutif & Tujuan

## Konteks masalah

Di Indonesia, perselisihan lalu lintas sering kali tidak diselesaikan oleh fakta, melainkan oleh emosi dan keberanian memfitnah. Pihak yang melanggar — misalnya pengendara sepeda motor yang melawan arah — kerap kali yang paling dahulu marah, memicu kerumunan, dan menjadikan kesenjangan ekonomi sebagai bahan bakar amuk massa. Dalam situasi seperti ini, bukti objektif kalah oleh dinamika sosial. Pada saat yang sama, kamera ETLE (Electronic Traffic Law Enforcement) statis tidak hadir di setiap sudut jalan, sehingga sebagian besar pelanggaran dan sengketa terjadi di luar jangkauannya.

dashAI menjawab dua kebutuhan sekaligus, yang selama ini ditangani secara terpisah:

1. **Penegakan terhadap pihak lain** — mengubah ponsel/dashcam menjadi pelapor pelanggaran yang netral dan terdokumentasi.
2. **Perlindungan terhadap pemilik** — menyediakan bukti yang meringankan (exculpatory evidence) ketika pemilik difitnah, serta umpan balik self-coaching agar pemilik tidak mengulang kesalahannya sendiri.

## Pernyataan produk

dashAI adalah aplikasi web (Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4) yang dideploy di Vercel pada [https://dashai-mu.vercel.app](https://dashai-mu.vercel.app) (sumber: [https://github.com/Finerium/dashAI](https://github.com/Finerium/dashAI), lisensi Apache-2.0). dashAI:

1. **Mendeteksi pelanggaran lalu lintas secara real-time di dalam browser** menggunakan TensorFlow.js coco-ssd (varian `lite_mobilenet_v2`), IoU tracker, MediaPipe Tasks (face detection BlazeFace + pose landmarker), dan Tesseract.js untuk OCR pelat — semuanya berjalan di perangkat tanpa mengunggah video.
2. **Mengaitkan setiap pelanggaran ke basis pengetahuan hukum terverifikasi** atas UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (LLAJ): 12 entri pelanggaran, masing-masing diverifikasi melalui proses adversarial 3-voter terhadap sumber resmi/terpercaya.
3. **Menyegel bukti secara kriptografis** dengan Ed25519 di sisi server (satu rahasia tunggal, variabel lingkungan `DASHAI_SIGNING_KEY`), menghasilkan bukti yang bersifat **tamper-evident** dan dapat diverifikasi siapa pun melalui `/api/public-key`.
4. **Menghasilkan laporan PDF tertandatangani** (jenis: tilang / kecelakaan / coaching) yang memuat QR menuju halaman verifikasi mandiri `/verify`.

> **Pernyataan kejujuran integritas.** dashAI bersifat **tamper-evident, bukan tamper-proof**. Tanda tangan membuktikan bahwa isi laporan tidak berubah satu byte pun sejak disegel server pada waktu tertera; tanda tangan **tidak** membuktikan bahwa kamera benar-benar menyaksikan peristiwa di dunia nyata (frame berasal dari klien). Saat ini dashAI adalah **demonstrasi melalui kamera ponsel**; perangkat keras khusus direncanakan setelah pendanaan investor.

## Tujuan produk

| No. | Tujuan | Indikator keberhasilan ringkas |
|-----|--------|--------------------------------|
| T1 | Menyediakan deteksi pelanggaran lalu lintas yang berjalan sepenuhnya di browser tanpa unggah video | Pipeline live berjalan di ponsel kelas menengah; tidak ada frame video meninggalkan perangkat sebelum disegel eksplisit |
| T2 | Menjadikan setiap laporan terikat ke dasar hukum yang tepat dan terverifikasi | 12/12 sitasi `verified: true` dengan 3-voter; setiap laporan memuat pasal, bunyi, dan sanksi |
| T3 | Menjamin integritas bukti yang dapat diperiksa publik | Setiap bukti tersegel dapat diverifikasi independen via `/verify` + `/api/public-key` tanpa memercayai UI dashAI |
| T4 | Melindungi privasi sesuai semangat UU 27/2022 (PDP) | Deteksi wajah (bukan pengenalan), blur default, penyimpanan lokal-dulu (IndexedDB) |
| T5 | Memberi nilai dua arah: menindak pihak lain dan melindungi/membina pemilik | Tersedia laporan tilang, kecelakaan, dan coaching dari subjek `other` dan `self` |

## Prinsip desain

- **Privacy-by-design.** Deteksi wajah, bukan pengenalan identitas; wajah dan pelat di-blur pada antarmuka secara default; bukti disimpan lokal terlebih dahulu di IndexedDB. Server hanya menerima payload yang **secara eksplisit** disegel oleh pengguna.
- **Local-first.** Sumber kebenaran bukti adalah perangkat pengguna; pengunggahan adalah tindakan sadar, bukan default.
- **Honest integrity.** Klaim keamanan dibatasi pada apa yang benar-benar dibuktikan kriptografi (tamper-evident), bukan klaim yang berlebihan.
- **Grounded legality.** Sitasi UU bukan halusinasi model; semuanya berasal dari basis pengetahuan terverifikasi.
- **Graceful degradation.** Model sekunder (face/pose) dan layanan eksternal (OSM Overpass, CDN model) gagal secara anggun tanpa menghentikan live view.

# Persona & Jobs-to-be-Done

dashAI melayani satu pengguna utama (pengendara/pemilik) dan beberapa pemangku kepentingan sekunder yang mengonsumsi keluaran sistem (bukti dan laporan).

## Persona

### P1 — Pengendara terdampak (pemilik dashAI)

Pengendara harian (motor/mobil) di kota Indonesia yang khawatir difitnah dalam sengketa lalu lintas dan ingin alat netral untuk melindungi dirinya, sekaligus terbuka untuk melaporkan pelanggaran nyata pihak lain. Melek ponsel, tetapi bukan ahli teknis. Membutuhkan alat yang langsung jalan dari browser tanpa instalasi rumit.

### P2 — Pengemudi yang ingin membina diri

Pengendara yang sadar keselamatan dan ingin tahu kebiasaan buruknya sendiri (ngebut, masuk jalur satu-arah) tanpa risiko terlapor. Membutuhkan umpan balik self-coaching yang bersifat pribadi, bukan dokumen penegakan.

### P3 — Petugas / sistem ETLE (konsumen laporan)

Pihak kepolisian atau sistem ETLE yang menerima laporan bukti pelanggaran. Membutuhkan dokumen yang ringkas, terbaca, memuat dasar hukum yang tepat, dan dapat diverifikasi keasliannya secara independen. Catatan: laporan dashAI saat ini **bukan** dokumen resmi kepolisian dan bersifat indikatif.

### P4 — Verifikator independen (siapa pun)

Pihak ketiga — penyidik, perusahaan asuransi, jurnalis, hakim, atau publik — yang perlu memastikan sebuah laporan tidak diubah sejak disegel. Membutuhkan verifikasi yang tidak bergantung pada kepercayaan terhadap UI dashAI.

### P5 — Perusahaan asuransi / penyidik kecelakaan

Pihak yang menilai klaim atau rekonstruksi kejadian. Membutuhkan bukti kejadian/kecelakaan bertanda waktu dengan konteks lokasi dan pengukuran, beserta jaminan keutuhan.

## Pemetaan Jobs-to-be-Done

| Persona | JTBD | Kebutuhan inti | Modul dashAI |
|---------|------|----------------|--------------|
| P1 | "Ketika saya difitnah dalam sengketa, saya ingin bukti netral yang tak terbantahkan, agar saya tidak kalah oleh emosi massa." | Bukti bertanda waktu, tersegel, terbaca | Live, Seal, Report (kecelakaan/tilang), Verify |
| P1 | "Ketika saya melihat pelanggaran nyata, saya ingin melaporkannya dengan dasar hukum yang benar." | Sitasi pasal otomatis + bukti | Live, Citation KB, Seal, Report (tilang) |
| P2 | "Ketika saya berkendara, saya ingin tahu kesalahan saya sendiri tanpa dilaporkan." | Deteksi subjek `self` + laporan pribadi | Live (self), Report (coaching) |
| P3 | "Ketika saya menerima laporan, saya ingin yakin pasal dan keasliannya benar." | Dasar hukum tepat + verifikasi | Citation KB, Report, Verify, Public-Key |
| P4 | "Ketika saya memeriksa laporan, saya ingin memastikan isinya tidak diubah tanpa memercayai pembuatnya." | Verifikasi mandiri sisi klien | Verify, Public-Key, Crypto |
| P5 | "Ketika saya menilai klaim, saya ingin konteks kejadian yang terukur dan utuh." | Lokasi + kecepatan + waktu + segel | Sensors, Geo/OSM, Seal, Report (kecelakaan) |

# User Story & Kriteria Penerimaan

User story dikelompokkan berdasarkan lima alur fungsional inti: **deteksi**, **segel (seal)**, **laporan**, **verifikasi**, dan **self-coaching**. Setiap kriteria penerimaan ditulis dengan gaya Given/When/Then dan dapat ditelusuri ke kode (`lib/violations/engine.ts`, `lib/crypto/*`, `app/api/*`).

## Deteksi

**US-D1 — Deteksi pelanggaran live di browser.**
Sebagai pengendara (P1), saya ingin mengarahkan kamera ponsel dan mendapatkan deteksi pelanggaran real-time tanpa video saya diunggah, agar privasi dan kuota saya terjaga.

- **Diberikan** kamera diberi izin dan pipeline termuat (`status.object === true`), **ketika** kendaraan/orang terlihat di frame, **maka** sistem menjalankan coco-ssd (kelas relevan: `car`, `motorcycle`, `bus`, `truck`, `bicycle`, `person`, `traffic light`) lalu menugaskan id track stabil melalui IoU tracker.
- **Diberikan** model wajah/pose gagal dimuat atau gagal inferensi, **ketika** live berjalan, **maka** view tetap berjalan dengan model yang berhasil (degradasi anggun, lihat `CVPipeline`).
- **Diberikan** sebuah track baru muncul, **ketika** usia track `< MIN_TRACK_AGE` (4 frame), **maka** kandidat tidak dipromosikan menjadi pelanggaran (penekan derau satu-frame).

**US-D2 — Deteksi melawan arah (lawan-arus) pihak lain.**
Sebagai pengendara (P1), saya ingin pelanggaran melawan arah terdeteksi, agar saya punya bukti saat berhadapan dengan pelanggar.

- **Diberikan** ada minimal 3 kendaraan bergerak yang membentuk arus dominan, **ketika** sebuah kendaraan bergerak dengan kemiripan kosinus terhadap arus dominan `< -0.6`, **maka** kandidat `lawan-arus` (subjek `other`) dihasilkan dengan confidence terbatas hingga 0.92.
- **Diberikan** jumlah kendaraan bergerak `< 3` atau magnitudo arus `< 0.02`, **ketika** dievaluasi, **maka** tidak ada kandidat (arah arus terlalu berisik).

**US-D3 — Deteksi melawan arah diri sendiri (self).**
Sebagai pengemudi (P2), saya ingin diberi tahu jika saya memasuki jalur satu-arah secara salah.

- **Diberikan** OSM menandai ruas `oneway` dengan `bearingDeg` diketahui dan heading GPS tersedia, **ketika** selisih sudut heading vs arah sah `> 120°` dan kecepatan ego `>= 8 km/jam`, **maka** kandidat `lawan-arus` (subjek `self`, confidence 0.9) dihasilkan.

**US-D4 — Deteksi melebihi kecepatan diri sendiri (akurat).**
Sebagai pengemudi (P2), saya ingin tahu jika saya melebihi batas kecepatan ruas.

- **Diberikan** OSM `maxspeedKmh` dan kecepatan GPS ego tersedia, **ketika** kecepatan `> maxspeed + 5 km/jam` (`SPEED_MARGIN_KMH`), **maka** kandidat `melebihi-kecepatan` (subjek `self`, confidence 0.95) dihasilkan dengan nilai kecepatan dan batas tercatat.

**US-D5 — Deteksi boncengan lebih dari satu.**
Sebagai pengendara (P1), saya ingin pelanggaran boncengan berlebih terdeteksi.

- **Diberikan** satu track sepeda motor dengan usia `>= 4` frame, **ketika** jumlah orang yang pusat bounding-box-nya berada di dalam kotak motor `>= 3`, **maka** kandidat `boncengan-lebih` (subjek `other`) dihasilkan (confidence hingga 0.85).

**US-D6 — Deteksi menerobos lampu merah diri sendiri.**

- **Diberikan** status lampu lalu lintas `red`, **ketika** kecepatan ego `>= 10 km/jam`, **maka** kandidat `terobos-lampu-merah` (subjek `self`, confidence 0.8) dihasilkan.

**US-D7 — Debounce dan idempotensi pelaporan.**

- **Diberikan** sebuah pasangan (`violation`, `trackId`/`subject`) baru saja terpicu, **ketika** terjadi lagi dalam `DEBOUNCE_MS` (6000 ms), **maka** tidak dilaporkan ulang (satu kejadian, bukan per-frame).

> Catatan cakupan: deteksi live yang aktif adalah `lawan-arus` (other & self), `melebihi-kecepatan` (self, akurat), `boncengan-lebih`, dan `terobos-lampu-merah` (self). Pelanggaran lain (helm, pelat, lampu, kabin) dikatalogkan dan ditampilkan melalui dataset demo; deteksi penuh memerlukan model khusus dan/atau kamera kabin (lihat §[Cakupan Rilis & Milestone] dan §[Di Luar Cakupan]).

## Segel (Seal)

**US-S1 — Menyegel bukti secara eksplisit.**
Sebagai pengendara (P1), saya ingin menyetujui dan menyegel sebuah kejadian, agar bukti memperoleh tanda waktu otoritatif dan tanda tangan.

- **Diberikan** sebuah `ViolationEvent` lengkap (`id`, `violation`, `subject`, `capturedAt`), **ketika** saya memicu `POST /api/seal`, **maka** server memvalidasi event, memastikan `violation ∈ CITATIONS`, menstempel `sealedAt` (waktu server, otoritatif), membangun payload kanonik, menghitung SHA-256, dan menandatangani dengan Ed25519, lalu mengembalikan `SealedEvidence`.
- **Diberikan** `violation` tidak dikenal, **ketika** seal dipanggil, **maka** server menolak dengan HTTP 400 ("Jenis pelanggaran (violation) tidak dikenal.").
- **Diberikan** `subject` bukan `self`/`other`, **ketika** seal dipanggil, **maka** server menolak dengan HTTP 400.
- **Diberikan** `confidence` tidak finit, **ketika** seal dipanggil, **maka** nilai di-clamp ke rentang [0, 1] (default 0).

**US-S2 — Private key tidak pernah keluar server.**

- **Diberikan** `DASHAI_SIGNING_KEY` (seed Ed25519 hex 64 karakter) di-set, **ketika** seal dijalankan, **maka** private key hanya dibaca di server (`getServerKey`), tidak pernah dikirim ke klien; `keyId` berawalan `prod-`.
- **Diberikan** env var hilang/tidak valid, **ketika** seal dijalankan, **maka** kunci DEV tetap berfungsi, `keyId` berawalan `dev-`, dan dokumen ditandai sebagai tidak sah.

**US-S3 — Payload kanonik deterministik.**

- **Diberikan** dua payload yang secara semantik sama, **ketika** dikanonikalisasi (`canonicalize`, kunci objek diurutkan rekursif, `undefined` dibuang), **maka** keduanya menghasilkan string byte-identik sehingga hash dan tanda tangan stabil di klien maupun server.

## Laporan

**US-R1 — Menghasilkan laporan PDF dengan QR verifikasi.**
Sebagai pengendara (P1), saya ingin membuat dokumen PDF rapi dari bukti tersegel, agar dapat dibagikan ke petugas/asuransi.

- **Diberikan** sebuah `SealedEvidence` valid, **ketika** saya memicu `POST /api/report` dengan `kind` (atau dibiarkan kosong), **maka** server memverifikasi ulang segel (`verifySealed`) sebelum render; jika tidak valid, menolak dengan HTTP 422 ("Envelope tidak dapat diverifikasi — laporan resmi tidak dibuat.").
- **Diberikan** `kind` tidak diberikan, **ketika** laporan dibuat, **maka** jenis ditentukan otomatis: `coaching` jika `subject === "self"`, selain itu `tilang`.
- **Diberikan** laporan dirender, **maka** PDF memuat ringkasan pelanggaran, identitas & pengukuran, dasar hukum (UU, pasal, bunyi, sanksi), blok integritas kriptografi (algoritma Ed25519, key ID, SHA-256 payload, tanda tangan), QR dan URL menuju `/verify?d=<base64url(sealed)>`, serta catatan disclaimer tamper-evident.

**US-R2 — Tiga jenis laporan.**

- **Diberikan** subjek `other`, **maka** tersedia laporan **tilang** ("LAPORAN BUKTI PELANGGARAN LALU LINTAS", ditujukan ke Polri/ETLE) dan **kecelakaan** ("LAPORAN BUKTI KEJADIAN / KECELAKAAN", ditujukan ke Polri/asuransi).
- **Diberikan** subjek `self`, **maka** tersedia laporan **coaching** ("LAPORAN PEMBINAAN MENGEMUDI MANDIRI") yang ditandai sebagai dokumen pribadi, bukan penegakan.

**US-R3 — Self-contained verification.**

- **Diberikan** sebuah PDF laporan, **ketika** QR/URL-nya dibuka, **maka** verifikasi tidak memerlukan basis data — seluruh envelope tersegel di-encode di dalam URL (base64url), sehingga tamper-evidence bersifat stateless.

## Verifikasi

**US-V1 — Verifikasi mandiri tanpa memercayai UI.**
Sebagai verifikator (P4), saya ingin memeriksa keaslian laporan tanpa harus memercayai dashAI.

- **Diberikan** sebuah envelope tersegel (dari QR/URL), **ketika** saya membuka `/verify`, **maka** halaman mengambil kunci publik dari `GET /api/public-key` dan menjalankan dua pemeriksaan independen di sisi klien: (1) hash kanonik cocok; (2) tanda tangan Ed25519 valid untuk payload tersebut.
- **Diberikan** isi laporan diubah satu byte, **ketika** diverifikasi, **maka** hasil `valid: false` dengan alasan "Hash payload tidak cocok — isi laporan telah diubah setelah disegel."
- **Diberikan** tanda tangan tidak valid untuk kunci, **ketika** diverifikasi, **maka** hasil `valid: false` dengan alasan tanda tangan tidak valid.
- **Diberikan** keduanya lolos, **maka** hasil `valid: true` dengan alasan "Tanda tangan sah dan isi laporan utuh (tidak diubah sejak disegel)."

**US-V2 — Endpoint verifikasi server (kemudahan, bukan dasar kepercayaan).**

- **Diberikan** `POST /api/verify`, **ketika** dipanggil, **maka** server memverifikasi memakai kunci publiknya; namun kepercayaan akhir tidak bergantung pada route ini karena `/verify` memverifikasi sepenuhnya di klien.

**US-V3 — Kunci publik dapat diakses publik.**

- **Diberikan** `GET /api/public-key`, **maka** dikembalikan `publicKeyHex`, `keyId`, `algorithm: "Ed25519"`, dan `isDev`, dengan `Cache-Control: public, max-age=3600`.

## Self-Coaching

**US-C1 — Umpan balik pribadi atas pelanggaran sendiri.**
Sebagai pengemudi (P2), saya ingin mengetahui pelanggaran saya sendiri secara pribadi.

- **Diberikan** pelanggaran dengan subjek `self` (mis. `melebihi-kecepatan` self, `lawan-arus` self), **ketika** saya membuat laporan, **maka** jenis default adalah `coaching` dan dokumen secara eksplisit menyatakan bersifat pribadi dan bukan dokumen penegakan hukum.
- **Diberikan** laporan coaching, **maka** judulnya "LAPORAN PEMBINAAN MENGEMUDI MANDIRI" dengan heading hukum "Catatan Keselamatan & Rujukan Aturan".

**US-C2 — Auto-trigger kejadian kecelakaan via sensor gerak.**
Sebagai pengendara (P1), saya ingin bukti tersegel otomatis ketika terjadi benturan, meski saya tak sempat menyentuh ponsel.

- **Diberikan** DeviceMotion tersedia dan izin diberikan (iOS 13+ memerlukan gestur eksplisit), **ketika** magnitudo akselerasi bersih `>= 0.75 g` (hard-brake) atau `>= 2.5 g` (impact), **maka** kejadian dipicu dengan debounce 3000 ms untuk penangkapan bukti kecelakaan.

# Kebutuhan Fungsional per Modul

Bagian ini merinci kebutuhan fungsional (Functional Requirement, FR) per modul kode. Penomoran FR mengikuti prefiks modul.

## Modul CV Pipeline (`lib/cv/`)

| ID | Kebutuhan |
|----|-----------|
| FR-CV1 | Memuat coco-ssd (`lite_mobilenet_v2`) dari CDN TF Hub saat runtime; backend WebGL dengan fallback otomatis ke backend lain (cpu/wasm). |
| FR-CV2 | Deteksi objek membatasi hasil ke `TRAFFIC_CLASSES` dengan ambang skor `0.45` dan maksimum 20 prediksi; bounding-box dinormalisasi ke 0..1. |
| FR-CV3 | IoU tracker greedy menugaskan id stabil, ambang IoU `0.3`, `maxMissed = 8`, menghitung kecepatan per-track (vx, vy) dalam unit ternormalisasi/detik. |
| FR-CV4 | Deteksi wajah memakai MediaPipe BlazeFace short-range (delegasi GPU, `minDetectionConfidence 0.5`) — hanya untuk lokasi (crop+blur), **tidak pernah** pengenalan. |
| FR-CV5 | Pose memakai MediaPipe Pose Landmarker lite (hingga 4 pose) untuk menggambar skeleton. |
| FR-CV6 | OCR pelat (Tesseract.js) hanya berjalan pada crop kecil dari frame pelanggaran terkonfirmasi, tidak pada stream live; pola pelat Indonesia divalidasi via regex. |
| FR-CV7 | Pipeline menghitung `dominantFlow` (rerata vektor gerak track yang bergerak) untuk dasar deteksi lawan-arah. |
| FR-CV8 | Kegagalan muat/inferensi model sekunder tidak boleh menghentikan live view (degradasi anggun). |

## Modul Violation Engine (`lib/violations/engine.ts`)

| ID | Kebutuhan |
|----|-----------|
| FR-VE1 | Mesin aturan stateful lintas-frame; melaporkan satu kejadian per pasangan (`violation`, `trackId`/`subject`) dengan debounce 6000 ms. |
| FR-VE2 | Aturan aktif: `ruleWrongWayOther`, `ruleWrongWaySelf`, `ruleSpeedingSelf`, `ruleOvercapacity`, `ruleRedLightSelf`. |
| FR-VE3 | Setiap aturan mensyaratkan usia track minimal (`MIN_TRACK_AGE = 4`) sebelum dipromosikan (kecuali aturan berbasis konteks ego). |
| FR-VE4 | Engine bersifat pluggable: menambah pelanggaran = tambah entri katalog + sitasi + aturan detektor. |

## Modul Legal Knowledge Base (`lib/legal/`)

| ID | Kebutuhan |
|----|-----------|
| FR-LG1 | Menyediakan sitasi untuk 12 `ViolationKey` dari `CITATIONS`, masing-masing memuat `uu`, `pasal`, `ayat`, `bunyi`, `sanksi`, `dendaMaxRupiah`, `kurunganMax`, `relatedArticles`, `confidence`, `verified`, `sources`. |
| FR-LG2 | Basis pengetahuan di-generate dari workflow riset terverifikasi (3-voter adversarial); tidak boleh diedit manual (regenerasi via workflow). |
| FR-LG3 | Katalog (`VIOLATION_CATALOG`) menyimpan metadata deteksi: `tier` (core/secondary/cabin), `subjects`, `severity`, `requiresCabinCam`, `detectionBasis`. |
| FR-LG4 | Snapshot hukum (`LegalSnapshot`) disuntikkan ke payload pada saat seal agar laporan mencerminkan versi statuta saat itu. |

Katalog pelanggaran dan sitasinya (konsisten dengan `lib/legal/citations.ts`):

| Key | Label (ID) | Subjek | Tier | Pasal UU 22/2009 | Denda maks | Kurungan maks |
|-----|------------|--------|------|------------------|-----------|---------------|
| `lawan-arus` | Melawan arah | other, self | core | Pasal 287 ayat (1) | Rp500.000 | 2 bulan |
| `tanpa-helm` | Pengendara tanpa helm | other | core | Pasal 291 ayat (1) | Rp250.000 | 1 bulan |
| `penumpang-tanpa-helm` | Penumpang tanpa helm | other | secondary | Pasal 291 ayat (2) | Rp250.000 | 1 bulan |
| `terobos-lampu-merah` | Menerobos lampu merah | other, self | core | Pasal 287 ayat (2) | Rp500.000 | 2 bulan |
| `langgar-marka` | Melanggar marka/rambu | other, self | secondary | Pasal 287 ayat (1) | Rp500.000 | 2 bulan |
| `boncengan-lebih` | Boncengan lebih dari satu | other | core | Pasal 292 | Rp250.000 | 1 bulan |
| `melebihi-kecepatan` | Melebihi batas kecepatan | other, self | core | Pasal 287 ayat (5) | Rp500.000 | 2 bulan |
| `tanpa-sabuk` | Tanpa sabuk keselamatan | self | cabin | Pasal 289 | Rp250.000 | 1 bulan |
| `main-hp` | Bermain ponsel saat berkendara | self | cabin | Pasal 283 | Rp750.000 | 3 bulan |
| `tanpa-plat` | Tanpa pelat nomor sah | other | secondary | Pasal 280 | Rp500.000 | 2 bulan |
| `tanpa-lampu-malam` | Tanpa lampu pada malam hari | other, self | secondary | Pasal 293 ayat (1) | Rp250.000 | 1 bulan |
| `motor-lampu-siang` | Motor tanpa lampu di siang hari | other | secondary | Pasal 293 ayat (2) | Rp100.000 | 15 hari |

## Modul Crypto (`lib/crypto/`)

| ID | Kebutuhan |
|----|-----------|
| FR-CR1 | `canonical.ts`: serialisasi JSON deterministik (kunci diurutkan rekursif, `undefined` dibuang) + util SHA-256 (`@noble/hashes`). |
| FR-CR2 | `keys.ts`: manajemen kunci server; membaca `DASHAI_SIGNING_KEY` (validasi regex hex 64), fallback ke kunci DEV; menerbitkan `keyId` berawalan `prod-`/`dev-`. |
| FR-CR3 | `sign.ts`: `sealPayload` = canonicalize → SHA-256 → Ed25519 sign (`@noble/ed25519`); modul `server-only`. |
| FR-CR4 | `verify.ts`: `verifySealed` berjalan identik di browser dan server; dua pemeriksaan independen (hash + signature). |

## Modul Evidence (`lib/evidence/`)

| ID | Kebutuhan |
|----|-----------|
| FR-EV1 | `types.ts`: `EvidencePayload` (schema `dashai.evidence.v1`) adalah batas kriptografis; field di luar payload tidak punya bobot pembuktian. |
| FR-EV2 | `payload.ts`: `buildPayload` menstempel `sealedAt` server, melampirkan `LegalSnapshot`, dan men-default field opsional ke `null`. |
| FR-EV3 | `store.ts`: penyimpanan lokal-dulu IndexedDB (`saveEvent`, `getAllEvents`, `getEvent`, `deleteEvent`, `clearEvents`); media dirujuk via hash agar tanda tangan tidak membengkak. |
| FR-EV4 | Media (`frame`, `faceCrop`, `plateCrop`) di-commit ke payload via SHA-256 (`MediaHashes`), bukan base64 mentah. |

## Modul Geo & Sensors (`lib/geo/`, `lib/sensors/`)

| ID | Kebutuhan |
|----|-----------|
| FR-GE1 | `osm.ts`: resolve konteks jalan (oneway, bearing, maxspeed) via OpenStreetMap Overpass tanpa API key; dua endpoint fallback. |
| FR-GE2 | Koordinat dibulatkan ke 4 desimal (~11 m) sebelum dikirim ke Overpass (minimalisasi paparan lokasi); hasil di-cache per sel grid; degradasi anggun (null) saat gagal. |
| FR-GE3 | `motion.ts`: deteksi benturan/hard-brake dari DeviceMotion (ambang 0.75 g / 2.5 g), debounce 3000 ms, izin eksplisit di iOS 13+. |

## Modul API (`app/api/`)

| ID | Endpoint | Kebutuhan |
|----|----------|-----------|
| FR-AP1 | `POST /api/seal` | Validasi event, cek `violation ∈ CITATIONS`, stempel `sealedAt`, bangun payload, tanda tangan; runtime `nodejs`. |
| FR-AP2 | `POST /api/verify` | Verifikasi envelope (kemudahan; bukan dasar kepercayaan). |
| FR-AP3 | `GET /api/public-key` | Publikasikan kunci publik + keyId + algoritma + flag dev; cache 1 jam. |
| FR-AP4 | `POST /api/report` | Verifikasi ulang sebelum render PDF; tolak 422 jika tidak valid; encode envelope ke URL QR; `Content-Disposition` attachment. |

## Modul Report (`lib/report/`)

| ID | Kebutuhan |
|----|-----------|
| FR-RP1 | `ReportDocument` (@react-pdf/renderer) merender A4 dengan bagian: ringkasan, identitas & pengukuran, dasar hukum (bunyi + sanksi), integritas kriptografi (hash + tanda tangan + QR), disclaimer. |
| FR-RP2 | Membedakan tampilan kecepatan: kecepatan pemilik via GPS ("akurat"), kecepatan pihak lain sebagai "± estimasi". |
| FR-RP3 | Menandai dokumen DEV sebagai tidak sah; menandai laporan coaching sebagai dokumen pribadi. |

## Modul State (`lib/state/`)

| ID | Kebutuhan |
|----|-----------|
| FR-ST1 | Store sesi live (zustand): status pipeline, FPS, jumlah deteksi, daftar event, geo/road/egoSpeed; aksi `addEvent`, `updateEvent`, `reset`. |

# Kebutuhan Non-Fungsional

## Privasi & perlindungan data

| ID | Kebutuhan |
|----|-----------|
| NFR-P1 | **Face detection, bukan recognition.** Sistem hanya melokalisasi wajah untuk crop+blur; tidak pernah mencocokkan wajah ke identitas (boundary di `lib/cv/face.ts`). |
| NFR-P2 | **Blur-by-default.** Wajah dan pelat di-blur pada antarmuka secara default. |
| NFR-P3 | **Local-first.** Bukti disimpan di IndexedDB perangkat; server hanya menerima payload yang disegel secara eksplisit oleh pengguna. |
| NFR-P4 | **Minimalisasi lokasi.** Koordinat dibulatkan ~11 m sebelum dikirim ke Overpass pihak ketiga. |
| NFR-P5 | **Selaras semangat UU 27/2022 (PDP).** Pemrosesan data pribadi diminimalkan, lokal, dan atas dasar tindakan sadar pengguna. |
| NFR-P6 | **Satu rahasia.** Private key (`DASHAI_SIGNING_KEY`) adalah satu-satunya rahasia, tidak pernah meninggalkan server. |

## Keamanan & integritas

| ID | Kebutuhan |
|----|-----------|
| NFR-S1 | Algoritma tanda tangan: Ed25519 (EdDSA); hash kanonik: SHA-256. |
| NFR-S2 | Verifikasi dapat dijalankan oleh siapa pun secara independen (kunci publik di `/api/public-key`), tanpa memercayai UI dashAI. |
| NFR-S3 | **Tamper-evident, bukan tamper-proof.** Sistem membuktikan keutuhan isi sejak disegel, bukan kebenaran bahwa kamera menyaksikan realitas. Klaim "tamper-proof" dilarang dalam komunikasi produk. |
| NFR-S4 | Kunci DEV menghasilkan dokumen yang ditandai tidak sah; tidak boleh diperlakukan otoritatif. |

## Performa

| ID | Kebutuhan |
|----|-----------|
| NFR-PF1 | Pipeline berjalan di browser ponsel dengan backend WebGL bila tersedia, fallback cpu/wasm; UI menampilkan FPS dan jumlah deteksi. |
| NFR-PF2 | Operasi mahal dibatasi: OCR pelat hanya pada crop frame pelanggaran (bukan stream live); maks 20 prediksi/inferensi objek. |
| NFR-PF3 | Resolusi konteks jalan di-cache per sel grid (~11 m) dan tidak memblokir live (timeout Overpass 8 dtk, fallback null). |
| NFR-PF4 | Debounce engine (6 dtk) dan usia track minimal (4 frame) menekan beban pelaporan berulang dan derau. |
| NFR-PF5 | Deployment statis-friendly: bobot model dimuat dari CDN saat runtime (tidak dibundel). |

## Aksesibilitas & UX

| ID | Kebutuhan |
|----|-----------|
| NFR-A1 | Antarmuka berbahasa Indonesia yang jelas; istilah teknis standar boleh dalam bahasa Inggris. |
| NFR-A2 | Estetika "forensic evidence terminal" (Archivo + JetBrains Mono; palet signal-red / amber / verified-green) dengan kontras tinggi untuk keterbacaan status (VALID/DIUBAH). |
| NFR-A3 | Pesan status dan alasan verifikasi ditulis dalam kalimat lengkap yang dapat dipahami non-teknis. |
| NFR-A4 | Disclaimer keterbatasan (demo, estimasi kecepatan pihak lain, bukan dokumen resmi) tampil jelas pada laporan dan UI. |

## Keandalan & portabilitas

| ID | Kebutuhan |
|----|-----------|
| NFR-R1 | Degradasi anggun pada semua dependensi eksternal (CDN model, OSM, sensor) tanpa menghentikan alur utama. |
| NFR-R2 | Tidak ada API key pihak ketiga yang dibutuhkan untuk fitur inti. |
| NFR-R3 | Verifikasi bersifat stateless: seluruh envelope tertanam di URL/QR; tidak ada ketergantungan basis data. |

# Alur UX

## Alur Live (deteksi → segel)

Diagram urutan berikut (sumber: `docs/diagrams/sequence-seal.png`) menampilkan alur dari deteksi hingga verifikasi, yang dibumikan pada `lib/violations/engine.ts`, `lib/evidence/payload.ts`, `app/api/{seal,report}/route.ts`, dan `lib/crypto/*`.

![Sequence: detect → seal → report → verify](docs/diagrams/sequence-seal.png)

Langkah ringkas:

1. Pengguna mengarahkan kamera; pipeline memproses frame (coco-ssd + IoU tracker + face/pose) dan GPS/sensor.
2. Engine menerapkan aturan + debounce 6 dtk untuk menghasilkan `ViolationCandidate`, lalu menyimpan `ViolationEvent` ke IndexedDB (lokal-dulu).
3. Pengguna menyetujui dan menyegel: `POST /api/seal` → server memvalidasi, menstempel `sealedAt`, membangun payload (+`LegalSnapshot`), `canonicalize` → SHA-256 → `ed.signAsync` → `SealedEvidence`.
4. Event tersegel disimpan kembali (`sealed = true`).

## Alur Review (peninjauan bukti → laporan)

1. Pengguna membuka halaman review; daftar event ditarik dari IndexedDB (terbaru dahulu) dan/atau dataset demo (ditandai `demo: true`).
2. Tiap kartu menampilkan box merah, data pengukuran, dan breakdown pasal (komponen `citation-breakdown`).
3. Pengguna memilih membuat laporan: `POST /api/report` dengan `kind`. Server memverifikasi ulang segel, lalu merender PDF (tilang/kecelakaan/coaching) berisi QR + URL ke `/verify`.
4. PDF diunduh (attachment) untuk dibagikan.

## Alur Verify (verifikasi mandiri)

1. Verifikator memindai QR atau membuka `/verify?d=<base64url(sealed)>`.
2. Halaman mengambil `GET /api/public-key`, lalu menjalankan `verifySealed` di klien: recompute hash kanonik + `ed.verifyAsync`.
3. Hasil ditampilkan: **VALID** (utuh) atau **DIUBAH** (tamper-evident), beserta alasan dalam bahasa Indonesia. Verifikasi tidak bergantung pada UI dashAI maupun basis data.

## Siklus hidup pelanggaran (state machine)

Diagram berikut (sumber: `docs/diagrams/violation-state.png`) menggambarkan transisi state bukti: Detected → Confirmed → Stored (lokal) → Sealed → Reported → Verified, yang dibumikan pada engine (debounce/`MIN_TRACK_AGE`), store IndexedDB, serta route seal/report dan halaman verify.

![Violation lifecycle state machine](docs/diagrams/violation-state.png)

# Cakupan Rilis & Milestone

## Cakupan rilis saat ini (Demo publik)

Status saat tanggal dokumen: aplikasi web live di [https://dashai-mu.vercel.app](https://dashai-mu.vercel.app).

| Area | Termasuk dalam rilis demo |
|------|---------------------------|
| Deteksi live aktif | `lawan-arus` (other & self), `melebihi-kecepatan` (self, akurat), `boncengan-lebih`, `terobos-lampu-merah` (self) |
| Katalog & sitasi | 12 pelanggaran terkatalog dengan sitasi terverifikasi (3-voter) |
| Demonstrasi penuh | 8 kejadian demo terkurasi (`lib/demo/samples.ts`) untuk menampilkan viewer, sitasi, laporan, dan verifikasi tanpa izin kamera |
| Segel & verifikasi | Ed25519 seal, `/verify` sisi klien, `/api/public-key` |
| Laporan | PDF tilang / kecelakaan / coaching dengan QR |
| Privasi | Face detection + blur default, IndexedDB lokal-dulu, minimalisasi lokasi |
| Sensor | Auto-trigger kejadian via DeviceMotion (impact/hard-brake) |

## Milestone berikutnya (Roadmap)

Diambil langsung dari README (Roadmap):

| Milestone | Deskripsi |
|-----------|-----------|
| M1 — Device attestation | Play Integrity / App Attest untuk tamper-resistance produksi |
| M2 — Backend model khusus | YOLOv8/ONNX + model helm/pelat khusus (mengaktifkan deteksi penuh tier secondary) |
| M3 — Kamera kabin (DMS) | Driver monitoring: sabuk, ponsel, kantuk (mengaktifkan tier cabin: `tanpa-sabuk`, `main-hp`) |
| M4 — Kalibrasi kecepatan | Kalibrasi estimasi kecepatan kendaraan lain dengan error bars |
| M5 — Integrasi resmi | Integrasi ETLE / kanal pelaporan kepolisian resmi |
| M6 — Perangkat keras khusus | Dashcam hardware khusus pasca-investor (menggantikan kamera ponsel) |

# Di Luar Cakupan

Hal-hal berikut **tidak** termasuk dalam cakupan rilis demo saat ini:

- **Klaim tamper-proof.** dashAI tidak pernah mengklaim tamper-proof; klaim integritas dibatasi pada tamper-evident.
- **Bukti bahwa kamera menyaksikan realitas.** Tanda tangan tidak membuktikan peristiwa fisik benar terjadi (frame berasal dari klien; seseorang dapat mengarahkan kamera ke layar). Penilaian akhir tetap pada pihak berwenang.
- **Status dokumen resmi.** Laporan yang dihasilkan bukan dokumen resmi kepolisian; sitasi bersifat indikatif.
- **Deteksi live penuh untuk tier secondary/cabin.** Helm, penumpang tanpa helm, pelat, lampu malam/siang, sabuk, dan main-HP belum dideteksi secara live; saat ini dikatalogkan dan ditampilkan via dataset demo. Memerlukan model khusus dan/atau kamera kabin (M2/M3).
- **Estimasi kecepatan pihak lain yang terkalibrasi.** Kecepatan kendaraan lain saat ini adalah estimasi tanpa error bars terkalibrasi (M4).
- **Device attestation.** Belum ada Play Integrity/App Attest (M1).
- **Integrasi ETLE/kepolisian resmi.** Belum ada kanal pelaporan resmi (M5).
- **Pengenalan wajah / identifikasi pemilik kendaraan.** Secara prinsip di luar cakupan (privacy-by-design); hanya deteksi wajah untuk blur.
- **Penyimpanan bukti di server / cloud akun.** Tidak ada akun pengguna atau database bukti server; penyimpanan bersifat lokal-dulu dan verifikasi stateless.
- **Hardware dashcam khusus.** Direncanakan pasca-investor (M6), bukan bagian dari demo browser.

# Metrik Keberhasilan & Analitik

Karena dashAI bersifat local-first dan privacy-by-design (tanpa akun dan tanpa basis data bukti server), pengukuran harus menghormati prinsip privasi: hindari telemetri yang mengirim isi bukti, lokasi presisi, atau identitas. Metrik dirancang sebagai agregat fungsional/teknis.

## Metrik produk (outcome)

| Metrik | Definisi | Target awal (demo) |
|--------|----------|--------------------|
| Tingkat penyelesaian alur | Proporsi sesi yang mencapai minimal satu segel (`POST /api/seal` sukses) | Tren naik antar-rilis |
| Tingkat pembuatan laporan | Proporsi bukti tersegel yang menjadi laporan PDF (`POST /api/report` sukses) | Tren naik |
| Tingkat verifikasi VALID | Proporsi pemanggilan verifikasi dengan hasil `valid: true` (kesehatan integritas) | Mendekati 100% pada laporan tak-diubah |
| Cakupan dua subjek | Rasio laporan `self` (coaching) vs `other` (tilang/kecelakaan) | Keduanya nontrivial |

## Metrik kualitas deteksi

| Metrik | Definisi | Catatan |
|--------|----------|---------|
| Stabilitas track | Proporsi kandidat yang lolos `MIN_TRACK_AGE` sebelum promosi | Penekan derau satu-frame |
| Distribusi confidence | Histogram confidence per `ViolationKey` | Akurasi `self` (GPS/OSM) lebih tinggi daripada estimasi `other` |
| Rasio duplikasi tertekan | Efektivitas debounce 6 dtk (kejadian unik vs frame) | Idempotensi pelaporan |
| Ketersediaan konteks jalan | Proporsi resolusi OSM sukses (non-null) | Memengaruhi akurasi lawan-arah/speeding self |

## Metrik teknis & keandalan

| Metrik | Definisi | Target |
|--------|----------|--------|
| FPS pipeline | Frame per detik pada perangkat target | Cukup untuk tracking stabil |
| Tingkat keberhasilan muat model | Proporsi sesi dengan `status.object === true`; face/pose opsional | Objek wajib; sekunder best-effort |
| Tingkat kegagalan anggun | Proporsi kegagalan dependensi eksternal yang tidak menghentikan live | Mendekati 100% (tidak ada crash fatal) |
| Latensi seal | Waktu `POST /api/seal` end-to-end | Rendah (operasi kripto ringan) |

## Prinsip analitik (guardrail privasi)

| ID | Prinsip |
|----|---------|
| AN1 | Tidak mengirim isi bukti (frame, crop, plat, koordinat presisi) ke analitik. |
| AN2 | Hanya agregat fungsional/teknis (event sukses/gagal, durasi, status pipeline) yang boleh diukur. |
| AN3 | Tidak ada identifikasi individu; tidak ada pengenalan wajah; tidak ada profil pengguna. |
| AN4 | Setiap pengukuran konsisten dengan local-first dan semangat UU 27/2022 (PDP). |

---

## Lampiran: Glosarium singkat

| Istilah | Makna |
|---------|-------|
| Tamper-evident | Perubahan pada bukti dapat terdeteksi (bukan dicegah). |
| SealedEvidence | Envelope tertandatangani: payload + algoritma + payloadHash + signature + publicKeyId + sealedAt. |
| EvidencePayload | Batas kriptografis; JSON kanonik yang ditandatangani server (schema `dashai.evidence.v1`). |
| LegalSnapshot | Cuplikan sitasi (uu, pasal, ayat, sanksi) yang disuntikkan ke payload saat seal. |
| Subjek `self` / `other` | Pelanggaran oleh pemilik dashAI sendiri / oleh pihak lain. |
| Tier core/secondary/cabin | Tingkat keandalan deteksi dari kamera menghadap jalan; cabin butuh kamera kabin. |
