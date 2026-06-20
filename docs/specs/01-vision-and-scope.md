---
title: "dashAI — Vision & Scope Document"
subtitle: "Saksi mata digital yang netral dan tertandatangani untuk keselamatan jalan Indonesia"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Ringkasan Eksekutif

dashAI adalah aplikasi web (Next.js 16 App Router, React 19, TypeScript *strict*, Tailwind CSS v4) yang diterapkan di Vercel pada [https://dashai-mu.vercel.app](https://dashai-mu.vercel.app). Sistem ini mengubah ponsel atau dashcam apa pun menjadi **saksi mata digital yang netral**: ia mendeteksi pelanggaran lalu lintas secara *real-time* langsung di dalam peramban (*in-browser*), memetakan setiap pelanggaran ke pasal **Undang-Undang Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)** dari basis pengetahuan hukum yang telah diverifikasi, lalu menyegel bukti secara kriptografis menggunakan Ed25519 sehingga keasliannya dapat diverifikasi oleh siapa pun.

Inti masalah yang diselesaikan dashAI bersifat sosial sekaligus teknis: di Indonesia, pihak yang melanggar sering kali justru yang paling berani memfitnah, memicu kerumunan, dan menjadikan kesenjangan ekonomi sebagai bahan bakar amuk massa — sementara bukti objektif kalah oleh emosi. ETLE (*Electronic Traffic Law Enforcement*) negara tidak hadir di setiap sudut jalan. dashAI menutup celah ini dengan pendekatan **dwi-subjek**: menindak pelanggar lain (mendukung pelaporan ke kepolisian) **dan** melindungi pemiliknya sendiri (bukti yang meringankan/eksulpatori serta *self-coaching*).

Dokumen ini menetapkan visi, sasaran, ruang lingkup (membedakan demo saat ini versus produksi perangkat keras masa depan), pemangku kepentingan, asumsi, dependensi, batasan, gambaran solusi tingkat tinggi, serta ringkasan risiko. Dokumen ini menjadi acuan tunggal (*source of truth*) bagi pengambilan keputusan produk dan rekayasa dashAI.

> **Catatan integritas.** dashAI bersifat **tamper-evident** (perubahan terdeteksi), **bukan** tamper-proof. Saat ini dashAI adalah demonstrasi teknologi lewat kamera ponsel; laporan yang dihasilkan **bukan** dokumen resmi kepolisian. Lihat [Risiko dan Batasan](#asumsi-dependensi-dan-batasan) serta [Ringkasan Risiko](#ringkasan-risiko).

---

# Kebutuhan Bisnis dan Pernyataan Masalah

## Konteks sosial: fitnah dan amuk massa (*mob justice*)

Permasalahan yang melatarbelakangi dashAI bersifat nyata dan spesifik untuk konteks Indonesia. Dalam insiden lalu lintas, **pihak yang melanggar sering kali adalah pihak yang paling berani memfitnah lebih dahulu.** Skenario klasik: sebuah mobil menyerempet sepeda motor yang sedang melawan arah; alih-alih mengakui kesalahan, si pelanggar marah duluan, memicu kerumunan, dan kesenjangan ekonomi (mobil versus motor) dijadikan bahan bakar emosi massa. Dalam dinamika seperti ini, **bukti objektif kalah oleh emosi kolektif** — kebenaran ditentukan oleh siapa yang paling keras bersuara dan paling cepat menggalang simpati, bukan oleh fakta yang dapat diuji.

Akibatnya, pengendara yang justru tidak bersalah dapat menjadi korban "katanya-katanya" (klaim lisan tanpa dasar), tuntutan ganti rugi yang tidak adil, hingga kekerasan fisik dari massa. Tidak adanya catatan netral yang **tidak dapat dibantah** membuat pihak yang benar tetap rentan.

## Celah dalam penegakan: ETLE tidak ada di setiap sudut jalan

Sistem **ETLE** yang dijalankan negara (Polri/Korlantas) menangkap pelanggaran secara otomatis melalui kamera CCTV tetap serta armada **ETLE Mobile** yang sedang berkembang (dashcam, *helmet-cam*, *body-cam*, dan *drone-cam* pada kendaraan patroli), dengan pemanfaatan AI yang meningkat untuk mendeteksi sekitar 12 jenis pelanggaran. Alur kerjanya bersifat **dua tahap**: kamera menangkap bukti beserta waktu/lokasi/jenis → data masuk ke *Back Office* → seorang petugas memverifikasi dan mencocokkan pelat dengan basis data Regident → surat konfirmasi dikirim ke pemilik terdaftar → jika terkonfirmasi/tidak dibayar, pembayaran via *virtual account* dan STNK dapat diblokir. Korlantas sedang menyentralisasi ETLE secara nasional dengan target sekitar **5.000 kamera pada 2027**.

Dua implikasi penting dari kondisi ini:

1. **Cakupan terbatas.** Meskipun terus berkembang, kamera tetap tidak hadir di setiap ruas dan persimpangan. Mayoritas interaksi lalu lintas terjadi di luar jangkauan ETLE.
2. **Pelajaran desain.** ETLE secara prinsip adalah **DETEKSI otomatis yang diikuti VERIFIKASI MANUSIA wajib** dan langkah konfirmasi pemilik sebelum sanksi apa pun. Tidak ada penghukuman yang sepenuhnya otomatis. dashAI sengaja mengadopsi prinsip yang sama: ia menghasilkan *lead*/laporan, bukan tilang yang mengeksekusi dirinya sendiri.

## Celah hukum: admisibilitas video warga

Berdasarkan riset Fase-0, **belum ada mekanisme hukum mapan** bagi warga untuk mengajukan rekaman dashcam pribadi sebagai bukti langsung untuk tilang. Kepolisian (Ditlantas Polda Metro Jaya) secara eksplisit menyatakan rekaman dashcam mobil pribadi "belum bisa" dijadikan bukti karena regulasi dan SOP-nya belum ada; hanya rekaman dari kendaraan dinas/tugas resmi yang masuk ke rantai bukti ETLE resmi.

Namun demikian, terdapat dua jalur yang relevan:

- **Secara elektronik**, UU ITE (Pasal 5 ayat (1)–(2)) menjadikan Informasi/Dokumen Elektronik dan hasil cetaknya sebagai alat bukti yang sah — sebagai tambahan terhadap KUHAP Pasal 184 — sepanjang integritas/keaslian terjaga dan rekaman diperoleh secara sah. CCTV/video lazim diterima di pengadilan sebagai alat bukti, khususnya sebagai "petunjuk".
- **Secara praktik**, rekaman warga/viral serta laporan yang diajukan melalui kanal pengaduan publik Polri (Dumas Presisi / super-app PRESISI, WhatsApp 0855-5555-4141) dapat **memicu** tindak lanjut/penyelidikan polisi — tetapi statusnya adalah *lead*, bukan tilang yang mengeksekusi diri sendiri; petugas tetap harus memverifikasi dan bertindak.

Konsekuensi desain: dashAI harus diposisikan sebagai **alat pelaporan / pembangkit *lead* yang memberi umpan kepada peninjauan manusia oleh kepolisian, BUKAN sistem penegakan setingkat bukti yang menjatuhkan sanksi sendiri.** Justru di sinilah penyegelan kriptografis menjadi penting: ia menjaga **integritas/keaslian** (syarat UU ITE) sehingga laporan lebih kredibel ketika ditinjau manusia.

## Ringkasan pernyataan masalah

| Dimensi masalah | Kondisi saat ini | Dampak |
|---|---|---|
| Sosial | Pelanggar memfitnah lebih dulu; massa terprovokasi; kesenjangan ekonomi dijadikan bahan bakar | Pihak yang benar dirugikan; tidak ada catatan netral yang tak terbantahkan |
| Penegakan | ETLE statis/mobile belum menjangkau semua ruas (target ~5.000 kamera pada 2027) | Sebagian besar pelanggaran tidak tertangkap |
| Hukum | Belum ada SOP untuk video dashcam warga sebagai bukti langsung; video tetap sah secara elektronik bila integritasnya terjaga | Bukti warga hanya menjadi *lead*; keaslian sulit dijamin |
| Privasi | Merekam wajah/pelat orang lain adalah pemrosesan data pribadi (UU 27/2022) | Risiko hukum bila tanpa basis sah/minimisasi data |

---

# Pernyataan Visi

> **Menjadikan setiap perjalanan memiliki saksi mata digital yang netral dan tertandatangani — sehingga kebenaran di jalan ditentukan oleh bukti yang dapat diverifikasi, bukan oleh siapa yang paling keras bersuara.**

dashAI membayangkan ekosistem di mana:

- Setiap pengendara dapat **melindungi diri** dari fitnah, tilang yang keliru, dan amuk massa dengan bukti yang keasliannya dapat dibuktikan secara independen.
- Setiap pelanggaran yang teramati dapat **dipetakan secara tepat** ke dasar hukumnya (pasal UU 22/2009) tanpa halusinasi model.
- Setiap pihak — kepolisian, asuransi, pengadilan, atau warga lain — dapat **memverifikasi keaslian** sebuah laporan tanpa harus memercayai antarmuka dashAI, melalui kunci publik yang dipublikasikan.
- Privasi pihak ketiga **dihormati sejak desain** (deteksi wajah, bukan pengenalan; blur secara *default*; penyimpanan lokal lebih dulu), selaras dengan semangat UU 27/2022 (Pelindungan Data Pribadi/PDP).

---

# Sasaran dan Metrik Keberhasilan

Sasaran berikut diturunkan langsung dari kapabilitas yang sudah ada di basis kode (lihat [Gambaran Solusi Tingkat Tinggi](#gambaran-solusi-tingkat-tinggi)) dan dari posisi produk sebagai demonstrasi teknologi menuju produk.

## Sasaran produk

| # | Sasaran | Metrik keberhasilan (dapat diuji) | Dasar di basis kode |
|---|---|---|---|
| G1 | Deteksi pelanggaran *real-time* di peramban tanpa unggah video | Empat aturan deteksi *live* aktif (lawan arah orang lain, lawan arah diri sendiri, *speeding* diri sendiri, boncengan berlebih, terobos lampu merah diri sendiri) berjalan pada *pipeline* per-frame | `lib/violations/engine.ts`, `lib/cv/pipeline.ts` |
| G2 | Sitasi hukum yang terverifikasi, bukan halusinasi | 12/12 sitasi pelanggaran terverifikasi melalui pemungutan suara adversarial 3-pemilih (`confirm_votes: 3`, `verified: true`) | `lib/legal/citations.ts`, `docs/research/phase0-research.json` (`legal_verified_count: 12`) |
| G3 | Bukti tamper-evident yang dapat diverifikasi siapa pun | Setiap *envelope* tersegel berisi `payloadHash` SHA-256 + tanda tangan Ed25519; verifikasi sukses ketika hash cocok DAN tanda tangan sah | `lib/crypto/sign.ts`, `lib/crypto/verify.ts`, `lib/evidence/types.ts` |
| G4 | Verifikasi tanpa memercayai UI dashAI | Kunci publik diterbitkan di `/api/public-key`; verifikasi dapat berjalan di sisi klien | `app/api/public-key/route.ts`, `lib/crypto/keys.ts` |
| G5 | Laporan mandiri (*self-contained*) | PDF berisi QR + URL yang mengkodekan seluruh *envelope* tersegel; verifikasi tidak butuh basis data | `app/api/report/route.ts` |
| G6 | Privasi sejak desain | Wajah/pelat di-blur di antarmuka; hanya deteksi wajah (bukan pengenalan); server hanya menerima *payload* yang secara eksplisit disegel | `lib/cv/face.ts`, README, `lib/evidence/types.ts` |
| G7 | Permukaan rahasia minimal | Hanya satu *secret* (`DASHAI_SIGNING_KEY`); tanpa API key pihak ketiga | `lib/crypto/keys.ts`, README |

## Indikator integritas dan akurasi

| Aspek | Status akurasi (jujur) | Catatan |
|---|---|---|
| *Speeding* diri sendiri | **Akurat** | GPS vs OSM `maxspeed` (`ruleSpeedingSelf`, margin 5 km/jam) |
| Lawan arah diri sendiri | Akurat (peta + sensor) | Fusi OSM `oneway` + *heading* GPS; ambang Δ > 120° |
| Lawan arah orang lain | Indikatif | Analisis arah gerak terhadap arus dominan; butuh ≥ 3 kendaraan bergerak |
| Kecepatan kendaraan lain | **Estimasi** | Perkiraan dari perubahan skala *bounding-box* + *optical flow* (dengan rentang error) |
| Sitasi pasal | Terverifikasi | 3-pemilih adversarial, `confidence: high` untuk seluruh 12 entri |

Metrik bisnis tingkat lebih tinggi (mis. tingkat adopsi, jumlah laporan tervalidasi kepolisian) bersifat pasca-investor dan bergantung pada integrasi resmi yang belum tersedia; metrik tersebut tidak diklaim sebagai capaian demo saat ini.

---

# Ruang Lingkup: Termasuk vs Tidak Termasuk

dashAI dirancang sebagai **demo lewat kamera ponsel sekarang; perangkat keras khusus kemudian (pasca-investor).** Pembedaan demo vs produksi sangat penting agar klaim tetap jujur.

## Termasuk dalam ruang lingkup (demo saat ini)

- **Deteksi *real-time* di peramban**: object detection TensorFlow.js coco-ssd (varian `lite_mobilenet_v2`, bobot dimuat dari CDN saat runtime), *IoU tracker*, serta MediaPipe Tasks (face/pose) yang dimuat opsional dan men-*degrade* dengan anggun bila gagal.
- **Aturan deteksi *live* aktif**: lawan arah (orang lain & diri sendiri), *speeding* diri sendiri, boncengan berlebih, dan terobos lampu merah diri sendiri — dengan *debounce* 6 detik per (pelanggaran, *track*) dan usia *track* minimum 4 frame untuk menekan derau.
- **Katalog pelanggaran lengkap (12 entri)** dengan sitasi terverifikasi; pelanggaran yang belum dideteksi *live* tetap dikatalogkan dan diperagakan melalui kumpulan data demo terkurasi (`demo: true`, tidak pernah diperlakukan sebagai bukti nyata).
- **Penyegelan bukti Ed25519** di server (*Node runtime*) via `/api/seal`, menstempel waktu otoritatif (`sealedAt`) dan melampirkan *snapshot* sitasi hukum.
- **Verifikasi**: `/api/verify` (kenyamanan sisi server) dan verifikasi sisi klien menggunakan `/api/public-key`.
- **Laporan PDF** (tilang / kecelakaan / coaching) dengan QR ke halaman `/verify` mandiri.
- **OCR pelat** via Tesseract.js dan **konteks jalan** via OpenStreetMap Overpass (tag `oneway` dan `maxspeed`), tanpa API key pihak ketiga.
- **Privacy-by-design**: blur *default*, deteksi (bukan pengenalan) wajah, penyimpanan lokal-dahulu (IndexedDB); server hanya menerima *payload* yang secara eksplisit disegel.

## Tidak termasuk dalam ruang lingkup (demo saat ini)

- **Penghukuman otomatis / penerbitan tilang resmi.** dashAI menghasilkan laporan/*lead*, bukan dokumen resmi kepolisian; sitasi bersifat indikatif.
- **Pengenalan identitas wajah (*face recognition*).** Hanya deteksi wajah untuk keperluan blur; tidak ada pencocokan identitas.
- **Deteksi *live* untuk kelas yang membutuhkan model khusus / kamera kabin** (helm, pelat sah/tidak, sabuk keselamatan, bermain ponsel, lampu) — dikatalogkan namun belum dideteksi penuh secara *live*.
- **Atestasi perangkat (*device attestation*)**, kontinuitas GPS terjamin, dan jaminan bahwa kamera benar-benar menyaksikan dunia nyata — inilah batas *tamper-evident*.
- **Integrasi resmi ETLE / kanal pelaporan kepolisian.** Berada di peta jalan, bukan di demo.

## Akan datang (produksi perangkat keras, pasca-investor)

Tercermin dari *roadmap* README:

- Atestasi perangkat (Play Integrity / App Attest) untuk *tamper-resistance* produksi.
- *Backend* YOLOv8/ONNX + model khusus helm/pelat.
- Kamera kabin (*driver monitoring*): sabuk, ponsel, kantuk.
- Kalibrasi estimasi kecepatan kendaraan lain (rentang error/*error bars*).
- Integrasi resmi ETLE / kanal pelaporan kepolisian.
- Dashcam perangkat keras khusus.

## Matriks demo vs produksi

| Kapabilitas | Demo (sekarang) | Produksi (pasca-investor) |
|---|---|---|
| Sumber kamera | Kamera ponsel (`getUserMedia`) | Dashcam perangkat keras khusus |
| Model deteksi | coco-ssd (lite_mobilenet_v2) + MediaPipe | YOLOv8/ONNX + model helm/pelat khusus |
| Deteksi kabin | Tidak | Kamera kabin (sabuk, ponsel, kantuk) |
| *Tamper resistance* | Tamper-evident (tanda tangan) | + Atestasi perangkat, kontinuitas GPS |
| Estimasi kecepatan kendaraan lain | Estimasi tanpa kalibrasi | Estimasi terkalibrasi dengan rentang error |
| Jalur penegakan | Laporan/*lead* mandiri | Integrasi resmi ETLE / kanal Polri |

---

# Pemangku Kepentingan dan Persona Pengguna

## Diagram konteks sistem (C4 Level 1)

![Diagram Konteks Sistem dashAI (C4 Level 1)](docs/diagrams/c4-context.png)

Diagram di atas (digenerate dari `docs/diagrams/c4-context.mmd`) memperlihatkan dua aktor manusia utama — **Pengguna/Pengendara** dan **Verifikator** — yang berinteraksi dengan sistem perangkat lunak dashAI, serta dua sistem eksternal tanpa API key: **OpenStreetMap Overpass API** (konteks jalan: `oneway`, `maxspeed`) dan **CDN Model AI** (TF.js coco-ssd dari TF Hub dan MediaPipe Tasks face/pose).

## Daftar pemangku kepentingan

| Pemangku kepentingan | Peran terhadap dashAI | Kepentingan utama |
|---|---|---|
| Pengendara (pengguna) | Aktor primer; memantau jalan, meninjau, menyegel bukti, mengunduh laporan | Perlindungan diri dari fitnah; bukti kredibel; privasi |
| Polisi / ETLE | Verifikator & penindak | Keaslian bukti; *lead* yang dapat ditindaklanjuti; kesesuaian dengan alur verifikasi manusia |
| Asuransi | Verifikator pihak ketiga | Bukti klaim yang tak terbantahkan; rekonstruksi kejadian |
| Operator dashAI | Pengendali Data Pribadi (UU 27/2022) | Kepatuhan privasi; minimisasi data; keamanan kunci penandatangan |
| Pengembang / kontributor | Pembangun & pemelihara | Arsitektur *pluggable*; akurasi sitasi; kejujuran klaim |

## Persona pengguna

### Persona 1 — Pengendara (subjek "self" dan pelapor "other")

- **Profil.** Pengendara motor/mobil sehari-hari di kota Indonesia yang khawatir menjadi korban fitnah atau amuk massa saat terjadi insiden.
- **Tujuan.** (a) Mengumpulkan bukti yang meringankan (eksulpatori) jika dituduh, (b) melaporkan pelanggar lain secara kredibel, (c) memperbaiki perilaku berkendaranya sendiri lewat *self-coaching*.
- **Kebutuhan.** Berjalan di ponsel yang ada; tanpa konfigurasi rumit; privasi terjaga; bukti yang keasliannya bisa dibuktikan.
- **Bagaimana dashAI melayani.** Deteksi *live* + penyegelan Ed25519 + laporan *coaching*/tilang; penyimpanan lokal-dahulu; blur *default*.

### Persona 2 — Petugas Polisi / ETLE (verifikator-penindak)

- **Profil.** Petugas yang meninjau laporan/*lead* dari warga dan menjalankan alur verifikasi manusia khas ETLE.
- **Tujuan.** Menentukan apakah sebuah laporan layak ditindaklanjuti; memastikan bukti tidak diubah sejak dibuat.
- **Kebutuhan.** Bukti dengan integritas terbukti (selaras UU ITE Pasal 5); referensi pasal yang benar; *self-contained* (bisa diverifikasi tanpa basis data).
- **Bagaimana dashAI melayani.** *Envelope* tersegel + QR pada PDF menuju `/verify`; kunci publik di `/api/public-key`; sitasi terverifikasi 3-pemilih.
- **Penting.** dashAI memberi *lead* untuk peninjauan manusia, **bukan** tilang yang mengeksekusi diri sendiri.

### Persona 3 — Penilai Klaim Asuransi (verifikator pihak ketiga)

- **Profil.** Petugas klaim yang menilai kejadian kecelakaan/sengketa.
- **Tujuan.** Merekonstruksi kejadian dari bukti netral; mencegah klaim curang.
- **Kebutuhan.** Bukti yang dapat diverifikasi independen (tanpa memercayai UI dashAI); metadata waktu/lokasi/jenis pelanggaran.
- **Bagaimana dashAI melayani.** Verifikasi sisi klien atas hash + tanda tangan; laporan *kecelakaan* dengan data lokasi (`GeoPoint`) dan konteks jalan (`RoadContext`).

---

# Gambaran Solusi Tingkat Tinggi

dashAI terdiri atas tiga lapisan yang dipisahkan oleh **batas kriptografis** yang tegas: peramban/ponsel (klien), Next.js di Vercel (server, *Node runtime*), dan layanan publik eksternal tanpa API key.

## Klien (peramban / ponsel)

1. **Akuisisi**: kamera (`getUserMedia`) dan sensor (Geolocation, DeviceMotion).
2. **CV Pipeline** (`lib/cv/pipeline.ts`): object detection coco-ssd → *IoU tracker*; ditambah face/pose MediaPipe opsional. Setiap model sekunder dibungkus agar kegagalan *load*/inferensi men-*degrade* dengan anggun.
3. **Violation Engine** (`lib/violations/engine.ts`): aturan *stateful* lintas-frame dengan *debounce* (6 detik) dan usia *track* minimum (4 frame). Aturan *live*: `ruleWrongWayOther`, `ruleWrongWaySelf`, `ruleSpeedingSelf`, `ruleOvercapacity`, `ruleRedLightSelf`.
4. **Viewer/HUD**: kotak merah, garis, dan panel pasal; wajah/pelat di-blur.
5. **Penyimpanan lokal**: IndexedDB menyimpan bukti lebih dulu.

## Server (Next.js di Vercel, *Node runtime*)

Empat *endpoint* API:

| Endpoint | Fungsi | File |
|---|---|---|
| `POST /api/seal` | Membangun *payload*, menstempel `sealedAt`, melampirkan sitasi, lalu menandatangani Ed25519 | `app/api/seal/route.ts` |
| `POST /api/verify` | Verifikasi sisi server (kenyamanan; bukan basis kepercayaan) | `app/api/verify/route.ts` |
| `GET /api/public-key` | Menerbitkan kunci publik Ed25519 (cache 1 jam) | `app/api/public-key/route.ts` |
| `POST /api/report` | Memverifikasi *envelope*, lalu merender PDF + QR ke `/verify` | `app/api/report/route.ts` |

Penandatanganan memakai **satu rahasia**, `DASHAI_SIGNING_KEY` (seed Ed25519 32-byte heksadesimal). Tanpa konfigurasi, dipakai kunci DEV bertanda `dev-…` yang tidak boleh dianggap otoritatif (`lib/crypto/keys.ts`).

## Batas kriptografis dan siklus bukti

Batas kriptografis adalah `EvidencePayload` (`lib/evidence/types.ts`): tepat *field* inilah yang — diserialisasi secara kanonik (kunci objek diurutkan rekursif, nilai `undefined` dibuang; `lib/crypto/canonical.ts`) — di-hash SHA-256 lalu ditandatangani. Siklusnya: frame + GPS → deteksi + aturan → `POST /api/seal` → server menstempel waktu + hash kanonik + tanda tangan Ed25519 (kunci privat tak pernah keluar server) → klien menerima `SealedEvidence` (signature + payloadHash + keyId) → simpan + buat PDF (QR ke `/verify`) → verifikator mengambil kunci publik dan memeriksa hash + tanda tangan → hasil **VALID** atau **DIUBAH**.

## Layanan eksternal (tanpa API key)

- **OpenStreetMap Overpass**: tag `oneway` dan `maxspeed`. Koordinat dibulatkan ke 4 desimal (~11 m) sebelum dikirim, sehingga lokasi presisi tidak pernah dibagikan (`lib/geo/osm.ts`).
- **CDN Model**: bobot TF.js (TF Hub) dan MediaPipe (jsDelivr/GCS) dimuat saat runtime; tidak ada bobot yang di-*bundle*.

## Kejujuran soal tamper-evidence

- **Yang dibuktikan tanda tangan**: isi laporan tidak berubah satu byte pun sejak disegel server pada waktu tertera. Mengubah pelat/kecepatan/pasal → hash tidak cocok → **terdeteksi**.
- **Yang TIDAK dibuktikan**: bahwa kamera benar-benar menyaksikan peristiwa dunia nyata (kamera bisa diarahkan ke layar). Karena frame berasal dari klien, dashAI bersifat **tamper-evident, bukan tamper-proof**.
- **Jalan menuju produksi**: atestasi perangkat, kontinuitas GPS, stempel waktu server, dan dashcam perangkat keras khusus menaikkan biaya pemalsuan; penilaian akhir tetap pada pihak berwenang.

---

# Cakupan Pelanggaran dan Sitasi

Satu mesin aturan *pluggable* dengan katalog lengkap; tiap entri terikat ke pasal terverifikasi (`lib/legal/citations.ts`, digenerate dari riset terverifikasi). Sitasi berikut disalin **persis** dari basis pengetahuan.

| Tier | Pelanggaran (`labelId`) | Pasal & ayat (UU 22/2009) | Denda maksimum | Kurungan maks. |
|---|---|---|---|---|
| core | Melawan arah | Pasal 287 ayat (1) | Rp500.000 | 2 bulan |
| core | Pengendara tanpa helm | Pasal 291 ayat (1) | Rp250.000 | 1 bulan |
| core | Menerobos lampu merah | Pasal 287 ayat (2) | Rp500.000 | 2 bulan |
| core | Boncengan lebih dari satu | Pasal 292 | Rp250.000 | 1 bulan |
| core | Melebihi batas kecepatan | Pasal 287 ayat (5) | Rp500.000 | 2 bulan |
| secondary | Melanggar marka/rambu | Pasal 287 ayat (1) | Rp500.000 | 2 bulan |
| secondary | Tanpa pelat nomor sah | Pasal 280 | Rp500.000 | 2 bulan |
| secondary | Tanpa lampu pada malam hari | Pasal 293 ayat (1) | Rp250.000 | 1 bulan |
| secondary | Motor tanpa lampu di siang hari | Pasal 293 ayat (2) | Rp100.000 | 15 hari |
| secondary | Penumpang tanpa helm | Pasal 291 ayat (2) | Rp250.000 | 1 bulan |
| cabin | Tanpa sabuk keselamatan | Pasal 289 | Rp250.000 | 1 bulan |
| cabin | Bermain ponsel saat berkendara | Pasal 283 | Rp750.000 | 3 bulan |

Seluruh 12 sitasi berstatus `verified: true` dengan `confidence: high` dan `confirm_votes: 3` (verifikasi adversarial 3-pemilih terhadap sumber resmi/terpercaya seperti hukumonline, korlantas.polri.go.id, dishub, dan teks resmi UU). Sitasi **bukan halusinasi model** (lihat `docs/research/phase0-research.json`, `legal_verified_count: 12`).

---

# Asumsi, Dependensi, dan Batasan

## Asumsi

- Pengguna menjalankan dashAI pada peramban ponsel modern yang mendukung `getUserMedia`, WebGL/WASM (untuk TF.js), Geolocation, dan DeviceMotion.
- Pengguna memberikan izin kamera dan lokasi; tanpa GPS, deteksi yang bergantung pada peta (lawan arah diri sendiri, *speeding* diri sendiri) tidak aktif.
- Konektivitas tersedia untuk memuat bobot model dari CDN dan untuk *query* OSM Overpass serta penyegelan di server.
- Penggunaan dilakukan secara bertanggung jawab; **ponsel tidak dioperasikan saat mengemudi**.

## Dependensi

| Jenis | Dependensi | Catatan |
|---|---|---|
| Kerangka kerja | Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind v4 | — |
| CV/ML | TensorFlow.js (coco-ssd `lite_mobilenet_v2`), MediaPipe Tasks (face, pose), Tesseract.js (OCR pelat) | Bobot dari CDN saat runtime |
| Kripto | `@noble/ed25519`, `@noble/hashes` (SHA-256/SHA-512) | Verifikasi berjalan di klien & server |
| PDF/QR | `@react-pdf/renderer`, `qrcode` | Render di *Node runtime* |
| Data jalan | OpenStreetMap Overpass API | Tanpa API key; koordinat dibulatkan ~11 m |
| *State* | `zustand`, IndexedDB | Penyimpanan lokal-dahulu |
| Penerapan | Vercel | *Node runtime* untuk API |
| Rahasia | `DASHAI_SIGNING_KEY` | Satu-satunya rahasia; tanpa API key pihak ketiga |

## Batasan

- **Kejujuran teknis**: tamper-evident, **bukan** tamper-proof; demo lewat kamera ponsel, **bukan** dokumen resmi kepolisian.
- **Hukum**: belum ada SOP yang menjadikan video dashcam warga sebagai bukti langsung; laporan berfungsi sebagai *lead* bagi peninjauan manusia.
- **Privasi (UU 27/2022)**: operator adalah Pengendali Data Pribadi; wajah adalah data pribadi spesifik/biometrik. Karena umumnya tidak dapat memperoleh persetujuan dari orang yang terekam, dashAI mengandalkan minimisasi data, blur *default*, deteksi (bukan pengenalan), penyimpanan lokal-dahulu, dan penyaluran data berkeperluan penegakan ke otoritas yang berwenang.
- **Akurasi**: estimasi kecepatan kendaraan lain bersifat **perkiraan**; deteksi *live* terbatas pada empat aturan; kelas lain dikatalogkan/diperagakan via dataset demo.
- **Lisensi**: Apache License 2.0.

---

# Ringkasan Risiko

| ID | Risiko | Kategori | Dampak | Mitigasi |
|---|---|---|---|---|
| R1 | Pemalsuan dengan mengarahkan kamera ke layar | Integritas bukti | Bukti palsu lolos | Komunikasikan batas tamper-evident; *roadmap* atestasi perangkat + kontinuitas GPS; penilaian akhir oleh otoritas |
| R2 | Kebocoran/penyalahgunaan `DASHAI_SIGNING_KEY` | Keamanan | Tanda tangan palsu sah | Kunci tunggal tak pernah keluar server; rotasi kunci; *keyId* membedakan dev vs prod |
| R3 | *False positive* deteksi (oklusi, malam, sudut) | Akurasi | Tuduhan keliru | *Debounce*, usia *track* minimum, ambang kepercayaan; verifikasi manusia wajib |
| R4 | Pelanggaran privasi pihak ketiga (UU 27/2022) | Hukum/Privasi | Sanksi administratif/pidana | Blur *default*, deteksi bukan pengenalan, minimisasi data, lokal-dahulu, salurkan ke otoritas |
| R5 | Estimasi kecepatan kendaraan lain dianggap akurat | Misrepresentasi | Klaim berlebih | Tandai eksplisit sebagai estimasi; kalibrasi + rentang error di produksi |
| R6 | Laporan dikira dokumen resmi kepolisian | Reputasi/Hukum | Salah paham status hukum | *Disclaimer* tegas; posisikan sebagai *lead* untuk peninjauan manusia |
| R7 | Ketergantungan CDN model / OSM tak tersedia | Operasional | Fitur menurun | Degradasi anggun pada *pipeline*; *fallback* backend CV di *roadmap* |
| R8 | Penyalahgunaan untuk main hakim sendiri/doxing | Etis/Hukum | Bahaya bagi orang | Blur *default*; salurkan ke kanal resmi; edukasi pengguna; risiko UU ITE/PDP atas publikasi tanpa dasar |

Risiko-risiko ini dielaborasi lebih lanjut dalam dokumen Threat Model dan Privacy & PDP yang terpisah; ringkasan di atas menautkan setiap risiko ke mitigasi yang sudah ada di basis kode atau pada *roadmap* produksi.

---

# Lampiran: Konsistensi Sitasi

Seluruh sitasi dalam dokumen ini konsisten persis dengan `lib/legal/citations.ts`. Setiap perubahan pada basis pengetahuan hukum **harus** dilakukan dengan menjalankan ulang *workflow* riset dan meregenerasi berkas tersebut (berkas tidak boleh disunting tangan), lalu memperbarui dokumen ini agar tetap selaras.
