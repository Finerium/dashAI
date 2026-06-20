---
title: "Rencana & Strategi Pengujian (Test Plan & Strategy)"
subtitle: "dashAI — Saksi Mata Digital yang Netral & Tertandatangani · ISO/IEC/IEEE 29119 · IEEE 829"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Pendahuluan dan Konteks Dokumen

Dokumen ini adalah **Rencana dan Strategi Pengujian (Test Plan & Strategy)** untuk dashAI, sebuah aplikasi web *AI dashcam* yang mendeteksi pelanggaran lalu lintas secara *real-time* di dalam peramban, memetakannya ke pasal **UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)** dari basis pengetahuan terverifikasi, lalu menyegel bukti secara kriptografis menggunakan tanda tangan **Ed25519**. Aplikasi dibangun di atas Next.js 16 (App Router), React 19, TypeScript (mode `strict`), dan Tailwind CSS v4, serta dideploy di Vercel pada `https://dashai-mu.vercel.app` (sumber: `https://github.com/Finerium/dashAI`, lisensi Apache-2.0).

Dokumen disusun mengikuti struktur dan terminologi **ISO/IEC/IEEE 29119** (Software Testing) dan **IEEE 829** (Test Documentation). Setiap pernyataan di dokumen ini di-*ground* pada kode sumber nyata di repositori (`lib/crypto/`, `lib/cv/`, `lib/violations/engine.ts`, `lib/evidence/types.ts`, `lib/legal/citations.ts`, dan `app/api/`). Sitasi hukum dijaga **persis konsisten** dengan `lib/legal/citations.ts`.

> **Status pengujian saat ini.** Pada saat penulisan, repositori **belum memuat berkas uji otomatis** (tidak ada `*.test.ts`/`*.spec.ts` maupun direktori `__tests__`). Skrip yang tersedia di `package.json` adalah `dev`, `build`, `start`, `lint` (ESLint), dan `typecheck` (`tsc --noEmit`). Karena itu, dokumen ini bersifat **rencana ke depan (forward-looking test plan)**: ia mendefinisikan kasus uji yang **harus** dibuat, lengkap dengan oracle (hasil yang diharapkan) yang sudah dipastikan terhadap perilaku kode yang ada. Bagian *entry/exit criteria* dan *traceability* menjadi acuan implementasi rangkaian uji.

> **Batasan demo (kejujuran rekayasa).** dashAI saat ini adalah **demo melalui kamera ponsel**, bukan dokumen resmi kepolisian. Bukti yang dihasilkan bersifat **tamper-evident, bukan tamper-proof**: tanda tangan membuktikan isi laporan tidak berubah satu byte pun sejak disegel server, tetapi **tidak** membuktikan bahwa kamera benar-benar menyaksikan peristiwa di dunia nyata (frame berasal dari klien). Strategi pengujian secara eksplisit mencakup verifikasi *negatif* atas klaim-klaim yang **tidak** boleh dibuat sistem.

---

# Tujuan dan Cakupan Pengujian (Test Objectives & Scope)

## Tujuan pengujian

Tujuan utama strategi pengujian dashAI adalah memberikan keyakinan terukur (*assurance*) bahwa:

1. **Integritas kriptografis benar.** Operasi segel (*seal*) dan verifikasi (*verify*) menghasilkan keputusan yang benar: bukti yang utuh dinyatakan `valid`, dan setiap perubahan satu byte pun pada payload yang disegel terdeteksi (`hashMatches = false`), sesuai perilaku di `lib/crypto/verify.ts`.
2. **Determinisme kanonikalisasi.** Dua payload yang secara semantik sama selalu menghasilkan byte-string identik (`lib/crypto/canonical.ts`), sehingga hash dan tanda tangan stabil lintas klien–server.
3. **Mesin aturan tidak gegabah.** Mesin pelanggaran (`lib/violations/engine.ts`) hanya memunculkan pelanggaran ketika sinyal CV/GPS memenuhi ambang yang ditetapkan, dengan tingkat *false positive* yang terkendali melalui *minimum track age*, *debounce*, dan ambang kosinus/sudut.
4. **Validasi API kokoh.** Endpoint `app/api/{seal,verify,public-key,report}` menolak masukan tidak valid dengan kode status HTTP yang tepat (400/422/500) dan pesan dalam Bahasa Indonesia, serta tidak pernah menandatangani atau menerbitkan laporan dari envelope yang tidak dapat diverifikasi.
5. **Sitasi hukum tepat.** Setiap pelanggaran terpetakan ke pasal UU 22/2009 yang **persis** sama dengan `lib/legal/citations.ts`, tanpa halusinasi.
6. **Privasi terjaga sesuai desain.** Wajah dideteksi (bukan dikenali) dan diburamkan secara default; server hanya menerima payload yang **secara eksplisit** disegel; penyimpanan utama bersifat lokal (IndexedDB).
7. **Aksesibilitas dan performa memadai** untuk demo lewat peramban ponsel.
8. **Kejujuran klaim.** Sistem tidak mengklaim *tamper-proof* maupun bahwa estimasi kecepatan kendaraan lain bersifat pasti.

## Cakupan (in-scope)

| Area | Komponen / berkas | Bentuk pengujian |
|---|---|---|
| Kriptografi bukti | `lib/crypto/canonical.ts`, `keys.ts`, `sign.ts`, `verify.ts` | Unit, properti, adversarial |
| Mesin pelanggaran | `lib/violations/engine.ts` | Unit (rule-level), ambang |
| Pipeline CV | `lib/cv/{detector,tracker,face,pose,plate,pipeline}.ts` | Unit, integrasi (degradasi anggun) |
| Domain & payload | `lib/evidence/{types,payload}.ts` | Unit (kontrak payload) |
| Basis hukum | `lib/legal/{citations,catalog}.ts` | Unit (konsistensi sitasi) |
| Endpoint API | `app/api/{seal,verify,public-key,report}/route.ts` | Integrasi / kontrak HTTP |
| Geo & sensor | `lib/geo/{location,osm}.ts`, `lib/sensors/motion.ts` | Unit (fungsi murni: `angleDelta`) |
| Alur ujung-ke-ujung | live → seal → review → report → verify | E2E (Playwright) |
| Halaman publik | `/`, `/live`, `/review`, `/verify` | E2E, aksesibilitas, performa |
| Laporan PDF + QR | `app/api/report`, `lib/report/ReportDocument.tsx` | Integrasi, verifikasi *round-trip* QR |

## Di luar cakupan (out-of-scope)

- **Akurasi absolut model deteksi pihak ketiga** (coco-ssd `lite_mobilenet_v2`, MediaPipe BlazeFace/Pose, Tesseract.js) sebagai *model* — yang diuji adalah *integrasi* dan *pengaturan ambang* dashAI di sekelilingnya, bukan melatih ulang atau membuktikan presisi internal model.
- **Atestasi perangkat (Play Integrity / App Attest)**, kontinuitas GPS, dan dashcam perangkat keras khusus — masih pada *roadmap*, bukan bagian dari rilis demo.
- **Deteksi penuh berbasis model khusus** (helm SNI, pelat, kabin: sabuk/ponsel/kantuk) — dikatalogkan dan didemonstrasikan via dataset demo, belum aktif sebagai deteksi *live* (lihat `requiresCabinCam` dan tier `secondary`/`cabin` di `lib/legal/catalog.ts`).
- **Ketahanan terhadap pemalsuan adegan fisik** (mis. mengarahkan kamera ke layar) — secara desain dashAI *tamper-evident*, bukan *tamper-proof*; ini diuji sebagai *batasan yang diakui*, bukan sebagai cacat yang harus diperbaiki.
- Penetration testing infrastruktur Vercel dan rantai pasok dependensi (di luar kontrol aplikasi).

---

# Item Uji dan Fitur yang Diuji (Test Items & Features to Be Tested)

## Item uji

Item uji adalah artefak konkret yang menjadi sasaran pengujian:

| ID | Item uji | Lokasi |
|---|---|---|
| TI-CRY | Modul kriptografi (canonical, keys, sign, verify) | `lib/crypto/` |
| TI-ENG | Mesin aturan pelanggaran | `lib/violations/engine.ts` |
| TI-CV | Pipeline CV (detector, tracker, face, pose, plate) | `lib/cv/` |
| TI-DOM | Tipe domain & pembentuk payload | `lib/evidence/{types,payload}.ts` |
| TI-LAW | Basis pengetahuan hukum & katalog | `lib/legal/{citations,catalog}.ts` |
| TI-API | Empat *route handler* API | `app/api/` |
| TI-GEO | Utilitas geo/sensor (mis. `angleDelta`) | `lib/geo/`, `lib/sensors/` |
| TI-RPT | Generator laporan PDF + QR | `app/api/report`, `lib/report/` |
| TI-UI | Halaman & komponen UI | `app/`, `components/` |

## Fitur yang diuji

| ID Fitur | Fitur | Item uji terkait | Prioritas |
|---|---|---|---|
| F-SEAL | Penyegelan bukti (canonical → sha-256 → Ed25519) | TI-CRY, TI-API | Kritis |
| F-VERIFY | Verifikasi tanda tangan & integritas (klien + server) | TI-CRY, TI-API, TI-UI | Kritis |
| F-CANON | Determinisme kanonikalisasi | TI-CRY | Kritis |
| F-KEY | Manajemen kunci (DEV vs PROD, `keyId`) | TI-CRY, TI-API | Tinggi |
| F-WRONGWAY | Deteksi melawan arah (self & other) | TI-ENG, TI-CV, TI-GEO | Tinggi |
| F-SPEED-SELF | Ngebut diri sendiri (GPS vs OSM `maxspeed`) | TI-ENG, TI-GEO | Tinggi |
| F-OVERCAP | Boncengan > 1 (≥ 3 orang per motor) | TI-ENG, TI-CV | Sedang |
| F-REDLIGHT | Terobos lampu merah (self) | TI-ENG | Sedang |
| F-TRACK | Tracking IoU & turunan kecepatan | TI-CV | Tinggi |
| F-DETECT | Object detection coco-ssd + filter kelas | TI-CV | Tinggi |
| F-PRIV | Privasi: deteksi (bukan pengenalan) wajah, blur, lokal-first | TI-CV, TI-UI | Kritis |
| F-LAW | Pemetaan pelanggaran → pasal terverifikasi | TI-LAW, TI-DOM | Kritis |
| F-REPORT | PDF tilang/kecelakaan/coaching + QR ke `/verify` | TI-RPT, TI-API | Tinggi |
| F-PUBKEY | Publikasi kunci publik untuk verifikasi independen | TI-API | Tinggi |
| F-DEGRADE | Degradasi anggun jika model sekunder gagal dimuat | TI-CV | Tinggi |
| F-A11Y | Aksesibilitas halaman publik | TI-UI | Sedang |
| F-PERF | Performa demo di peramban ponsel | TI-UI, TI-CV | Sedang |

---

# Pendekatan Pengujian (Test Approach)

Strategi mengikuti bentuk **piramida pengujian** yang dimiringkan ke arah unit dan kontrak, karena nilai integritas dashAI terletak pada determinisme kriptografi dan logika ambang mesin aturan yang keduanya berupa **fungsi murni atau hampir murni** dan sangat dapat diuji.

## Tingkatan pengujian

### Pengujian unit

- **Sasaran utama:** `lib/crypto/`, `lib/violations/engine.ts`, `lib/geo/location.ts` (mis. `angleDelta`), `lib/evidence/payload.ts`, `lib/cv/tracker.ts`, `lib/cv/plate.ts` (regex `isValidPlate`), `lib/legal/citations.ts`.
- **Karakteristik yang menguntungkan:** kanonikalisasi, hashing, dan aturan mesin tidak bergantung pada DOM/jaringan, sehingga dapat diuji deterministik tanpa *mock* berat. `verifySealed` dan `sealPayload` menggunakan `@noble/ed25519` yang berjalan identik di Node dan peramban.
- **Alat yang direkomendasikan:** Vitest (selaras dengan TypeScript `strict` dan ESM yang dipakai `@noble/*`), dengan `tsc --noEmit` sebagai gerbang tipe.

### Pengujian integrasi

- **Sasaran:** *route handler* API (`app/api/`) diuji sebagai unit fungsi `POST/GET` dengan objek `Request` palsu; pipeline CV diuji dengan *fake* detektor/tracker untuk memverifikasi orkestrasi dan jalur degradasi (`CVPipeline.load`/`analyze` menangkap kegagalan model sekunder).
- **Round-trip kriptografis:** seal → verify lintas modul nyata (bukan *mock*) untuk membuktikan hash & tanda tangan kompatibel ujung ke ujung.

### Pengujian ujung-ke-ujung (E2E)

- **Alat:** Playwright (peramban Chromium/WebKit), dengan kamera dan GPS disuntik via *fake media stream* dan *geolocation override*.
- **Alur kritis:** muat `/live` → izin kamera → pelanggaran terdeteksi (atau dipicu via dataset demo) → segel → tinjau di `/review` → unduh laporan → pindai/buka URL `/verify?d=…` → status **VALID**, lalu uji jalur **DIUBAH** dengan memanipulasi parameter `d`.

### Pengujian manual / eksploratori

- Uji perangkat nyata (Android Chrome, iOS Safari) untuk perilaku `getUserMedia`, izin Geolocation/DeviceMotion, performa GPU/WebGL, dan keterbacaan HUD di bawah sinar matahari.
- Verifikasi visual blur wajah/pelat pada antarmuka.

### Pengujian adversarial

Pengujian adversarial adalah bagian inti, bukan tambahan, karena dashAI adalah sistem bukti:

- **Tamper pada payload:** ubah `plateText`, `egoSpeedKmh`, `violation`, `sealedAt`, atau `legal` setelah seal → harus terdeteksi.
- **Substitusi kunci:** verifikasi dengan kunci publik yang salah → `signatureValid = false`.
- **Salah-pasang tanda tangan/payload (signature–payload mismatch).**
- **Pemalsuan adegan:** dipastikan **tidak** diklaim tertangani (batasan tamper-evident).
- **Masukan API berbahaya:** body bukan-JSON, field hilang, `violation` tak dikenal, tipe `capturedAt` salah, `confidence` di luar [0,1] atau bukan angka.

## Lingkungan dan data uji

| Aspek | Keterangan |
|---|---|
| Kunci tanda tangan uji | Gunakan **DEV key** tetap (`lib/crypto/keys.ts`, seed `4f3edf98…`, `keyId` berawalan `dev-`) untuk determinisme; uji jalur PROD dengan menyetel `DASHAI_SIGNING_KEY` ke hex 64-karakter valid. |
| Data demo | Dataset kurasi (`lib/demo/samples.ts`) yang ditandai `demo: true` dan **tidak pernah** diperlakukan sebagai bukti nyata. |
| Layanan eksternal | OSM Overpass dan CDN model di-*stub* pada unit/integrasi; dipakai nyata hanya pada E2E/manual. |
| Determinisme waktu | `sealedAt`/`checkedAt` memakai `Date.now()`; uji menyuntik *clock* tetap agar payload deterministik. |

---

# Kasus Uji Kriptografi (Crypto Test Cases)

Bagian ini mengacu pada perilaku **nyata** di `lib/crypto/canonical.ts`, `keys.ts`, `sign.ts`, dan `verify.ts`. Properti yang diverifikasi adalah dua pemeriksaan independen pada `verifySealed`: (1) `hashMatches` — sha-256 kanonik dari `payload` cocok dengan `payloadHash`; (2) `signatureValid` — tanda tangan Ed25519 sah untuk byte kanonik di bawah kunci publik. Keputusan akhir `valid = hashMatches && signatureValid`.

## Perilaku oracle yang dipastikan

Dari `lib/crypto/verify.ts`, string `reason` yang dihasilkan **persis** sebagai berikut dan menjadi oracle pengujian:

- Valid: `"Tanda tangan sah dan isi laporan utuh (tidak diubah sejak disegel)."`
- Hash tidak cocok: `"Hash payload tidak cocok — isi laporan telah diubah setelah disegel."`
- Tanda tangan tidak valid (hash cocok, signature gagal): `"Tanda tangan Ed25519 tidak valid untuk kunci publik ini."`

## Tabel kasus uji kriptografi

| ID | Tujuan | Prakondisi / aksi | Hasil yang diharapkan (oracle) |
|---|---|---|---|
| TC-CRY-01 | Seal–verify *happy path* | Bentuk `EvidencePayload` valid → `sealPayload` → `verifySealed` dengan pubkey yang benar | `valid=true`, `hashMatches=true`, `signatureValid=true`, `reason` = string Valid |
| TC-CRY-02 | Determinisme kanonikalisasi (urutan kunci) | `canonicalize({b:1,a:2})` vs `canonicalize({a:2,b:1})` | String byte-identik |
| TC-CRY-03 | Kanonikalisasi rekursif (objek bersarang & array) | Objek bersarang dengan urutan kunci berbeda pada tiap level | String identik; array mempertahankan urutan elemen |
| TC-CRY-04 | `undefined` dijatuhkan | Payload dengan field bernilai `undefined` vs tanpa field tersebut | Kanonikalisasi identik (field hilang) |
| TC-CRY-05 | Stabilitas hash lintas-jalur | `sha256HexOfString(canon)` pada klien vs server | Hash hex sama persis |
| TC-CRY-06 | Tamper `plateText` | Setelah seal, ubah `payload.plateText`, verifikasi ulang | `hashMatches=false`, `valid=false`, `reason` = string Hash tidak cocok |
| TC-CRY-07 | Tamper `egoSpeedKmh` | Naikkan kecepatan pada payload tersegel | `hashMatches=false`, `valid=false` |
| TC-CRY-08 | Tamper `violation` / `legal` | Ganti jenis pelanggaran atau snapshot pasal | `hashMatches=false`, `valid=false` |
| TC-CRY-09 | Tamper `sealedAt` | Ubah stempel waktu server pada payload | `hashMatches=false`, `valid=false` |
| TC-CRY-10 | Kunci publik salah | Verifikasi envelope sah memakai pubkey lain | `hashMatches=true`, `signatureValid=false`, `valid=false`, `reason` = string Tanda tangan tidak valid |
| TC-CRY-11 | Tanda tangan rusak/terpotong | Mutasi byte `signature` | `signatureValid=false`; `verifyAsync` melempar ditangkap → tetap `false` (tanpa *throw* keluar) |
| TC-CRY-12 | Signature–payload mismatch | Pasang tanda tangan dari payload A ke payload B (hash B diperbaiki) | `hashMatches=true`, `signatureValid=false` |
| TC-CRY-13 | `payloadHash` salah, payload utuh | Korupsi hanya field `payloadHash` | `hashMatches=false`, `valid=false` (meski tanda tangan atas payload sah) |
| TC-CRY-14 | Derivasi kunci DEV | `DASHAI_SIGNING_KEY` kosong → `getServerKey()` | `isDev=true`, `keyId` berawalan `dev-` + 16 hex pertama pubkey |
| TC-CRY-15 | Derivasi kunci PROD | Set seed hex 64-karakter valid → `getServerKey()` | `isDev=false`, `keyId` berawalan `prod-` |
| TC-CRY-16 | Validasi format seed | Seed bukan 64 hex (mis. 63 char / non-hex) | Jatuh ke DEV key (`isValid=false`), `isDev=true` |
| TC-CRY-17 | Caching kunci | Panggil `getServerKey()` dua kali | Objek ter-*cache* sama (tidak menderivasi ulang) |
| TC-CRY-18 | Konsistensi `getPublicKeyInfo` | Bandingkan dengan `getServerKey` | `publicKeyHex`/`keyId`/`isDev` konsisten; `algorithm="Ed25519"` |
| TC-CRY-19 | Round-trip publik | Ambil pubkey dari `/api/public-key` → verifikasi laporan tanpa memercayai UI | `valid=true` untuk laporan sah |

> **Catatan kejujuran (wajib diuji secara negatif).** TC-CRY harus disertai pernyataan bahwa **tidak ada** kasus uji yang mengklaim sistem membuktikan kamera menyaksikan realitas fisik. Verifikasi `valid=true` hanya berarti *payload tidak berubah sejak disegel server pada `sealedAt`* — bukan bukti kebenaran adegan. Ini adalah sifat **tamper-evident**.

---

# Kasus Uji Mesin/CV (CV & Engine Test Cases)

Bagian ini menargetkan *false positive* dan kebenaran ambang. Konstanta dan aturan diambil **persis** dari `lib/violations/engine.ts`, `lib/cv/tracker.ts`, dan `lib/cv/detector.ts`.

## Konstanta dan ambang yang menjadi acuan

| Konstanta / ambang | Nilai | Sumber | Peran |
|---|---|---|---|
| `DEBOUNCE_MS` | 6000 ms | `engine.ts` | Satu pelanggaran per (jenis, track) dalam jendela ini |
| `MIN_TRACK_AGE` | 4 frame | `engine.ts` | Menggugurkan deteksi satu-frame yang berisik |
| `SPEED_MARGIN_KMH` | 5 km/jam | `engine.ts` | Margin di atas batas sebelum *speeding* diflag |
| Ambang flow minimum | `flowMag ≥ 0.02` | `engine.ts` (wrong-way other) | Gerak minimum agar arah arus bermakna |
| Minimum kendaraan bergerak | `≥ 3` track | `engine.ts` (wrong-way other) | Arus dominan harus didukung cukup objek |
| Ambang kosinus berlawanan | `cos < -0.6` | `engine.ts` (wrong-way other) | Arah objek vs arus dominan |
| Ambang sudut self wrong-way | `delta > 120°` | `engine.ts` (wrong-way self) | Heading GPS vs bearing ruas satu-arah |
| Kecepatan minimum self wrong-way | `egoSpeedKmh ≥ 8` | `engine.ts` | Abaikan saat hampir berhenti |
| Kecepatan minimum red-light self | `egoSpeedKmh ≥ 10` | `engine.ts` | Masih melaju saat lampu merah |
| Orang per motor (overcapacity) | `≥ 3` | `engine.ts` | 1 pengemudi + ≥ 2 penumpang |
| IoU tracker threshold | `0.3` | `tracker.ts` | Asosiasi deteksi antar-frame |
| `maxMissed` tracker | `8` frame | `tracker.ts` | Umur maksimum track yang hilang |
| coco-ssd `detect()` | maks 20 objek, skor min 0.45, base `lite_mobilenet_v2` | `detector.ts` | Hanya kelas di `TRAFFIC_CLASSES` |

## Tabel kasus uji mesin aturan

| ID | Aturan | Skenario | Hasil yang diharapkan |
|---|---|---|---|
| TC-ENG-01 | Wrong-way other (positif) | ≥ 3 kendaraan bergerak, `flowMag ≥ 0.02`, satu track lawan arah (`cos < -0.6`), `age ≥ 4` | Kandidat `lawan-arus`, `subject="other"`, `confidence ≤ 0.92` |
| TC-ENG-02 | Wrong-way other (FP: arus lemah) | `flowMag < 0.02` | Tidak ada kandidat |
| TC-ENG-03 | Wrong-way other (FP: terlalu sedikit kendaraan) | Hanya 1–2 kendaraan bergerak | Tidak ada kandidat (arah arus terlalu berisik) |
| TC-ENG-04 | Wrong-way other (FP: track terlalu muda) | Track lawan arah namun `age < 4` | Tidak ada kandidat |
| TC-ENG-05 | Wrong-way other (batas kosinus) | `cos = -0.6` tepat (tidak `< -0.6`) | Tidak ada kandidat (uji strict inequality) |
| TC-ENG-06 | Wrong-way self (positif) | `road.oneway=true`, `bearingDeg` ada, `egoHeadingDeg` ada, `delta > 120`, `egoSpeed ≥ 8` | Kandidat `lawan-arus`, `subject="self"`, `confidence=0.9` |
| TC-ENG-07 | Wrong-way self (FP: hampir berhenti) | Kondisi sama tetapi `egoSpeed < 8` | Tidak ada kandidat |
| TC-ENG-08 | Wrong-way self (FP: bukan satu-arah) | `road.oneway` falsy | Tidak ada kandidat |
| TC-ENG-09 | Wrong-way self (batas sudut) | `delta = 120` tepat | Tidak ada kandidat (butuh `> 120`) |
| TC-ENG-10 | Speeding self (positif) | `speed > limit + 5` | Kandidat `melebihi-kecepatan`, `subject="self"`, `confidence=0.95`, membawa `egoSpeedKmh` & `speedLimitKmh` |
| TC-ENG-11 | Speeding self (FP: dalam margin) | `speed = limit + 5` tepat | Tidak ada kandidat (butuh `>`) |
| TC-ENG-12 | Speeding self (data hilang) | `maxspeed` null atau `egoSpeed` null | Tidak ada kandidat |
| TC-ENG-13 | Overcapacity (positif) | Motor `age ≥ 4`, ≥ 3 person berpusat di bbox motor | Kandidat `boncengan-lebih`, `confidence ≤ 0.85` |
| TC-ENG-14 | Overcapacity (FP: 2 orang) | Hanya 2 person pada motor | Tidak ada kandidat |
| TC-ENG-15 | Overcapacity (FP: person di luar bbox) | 3 person tetapi pusat di luar bbox motor | Tidak ada kandidat |
| TC-ENG-16 | Red-light self (positif) | `trafficLightState="red"`, `egoSpeed ≥ 10` | Kandidat `terobos-lampu-merah`, `confidence=0.8` |
| TC-ENG-17 | Red-light self (FP: lampu bukan merah) | State `green`/`yellow`/`null` | Tidak ada kandidat |
| TC-ENG-18 | Red-light self (FP: berhenti di garis) | Merah tetapi `egoSpeed < 10` | Tidak ada kandidat |
| TC-ENG-19 | Debounce per (jenis, track) | Pelanggaran sama dipicu dua kali dalam < 6000 ms | Hanya satu kandidat dilaporkan |
| TC-ENG-20 | Debounce kedaluwarsa | Pemicu kedua pada `now ≥ last + 6000` | Dua kandidat dilaporkan |
| TC-ENG-21 | Reset state | `engine.reset()` lalu picu ulang | `lastFired` kosong; pelanggaran muncul lagi |
| TC-ENG-22 | Clamping confidence | Aturan menghitung confidence besar | Tidak melampaui *cap* per aturan (0.92 / 0.85 / 0.95 / 0.9 / 0.8) |

## Tabel kasus uji pipeline CV

| ID | Komponen | Skenario | Hasil yang diharapkan |
|---|---|---|---|
| TC-CV-01 | Detector filter kelas | Prediksi mentah berisi kelas non-traffic (mis. `cup`) | Hanya kelas di `TRAFFIC_CLASSES` yang diteruskan |
| TC-CV-02 | Detector normalisasi bbox | Prediksi piksel `[x,y,w,h]` pada frame W×H | bbox ternormalisasi 0..1 |
| TC-CV-03 | Detector input nol-dimensi | `videoWidth=0` | Mengembalikan `[]` (tanpa error) |
| TC-CV-04 | Tracker asosiasi IoU | Deteksi sama bergeser, IoU `≥ 0.3` | `id` track stabil; `age` bertambah |
| TC-CV-05 | Tracker track baru | Deteksi IoU `< 0.3` dengan semua track | Track baru `age=1`, `vx=vy=0` |
| TC-CV-06 | Tracker velocity | Track bergeser antar-frame dengan `dt` diketahui | `vx,vy` ≈ (Δcenter / dt) |
| TC-CV-07 | Tracker age-out | Track tak cocok selama `> 8` frame | Track dihapus |
| TC-CV-08 | Tracker tak meng-age track baru | Track yang muncul pada frame ini | Tidak ikut di-*age* pada frame kemunculan |
| TC-CV-09 | Dominant flow | Beberapa track bergerak | `dominantFlow` ≈ rata-rata `vx,vy`; null jika tak ada yang bergerak |
| TC-CV-10 | Degradasi anggun (face) | `faceCV.load()` gagal | `status.face=false`, pipeline tetap jalan |
| TC-CV-11 | Degradasi anggun (pose) | `poseCV.load()` gagal | `status.pose=false`, pipeline tetap jalan |
| TC-CV-12 | Degradasi anggun (inference) | `faceCV.detect()` melempar saat analisis | `faces=[]`, frame tetap diproses |
| TC-CV-13 | Plate regex valid | `"B 1234 CD"` | `isValidPlate=true`; `readPlate` menormalkan ke `"B 1234 CD"` |
| TC-CV-14 | Plate regex tolak | String tanpa pola pelat | `isValidPlate=false`; `readPlate` → `null` |
| TC-CV-15 | Plate OCR gagal | Worker Tesseract melempar | `readPlate` → `null` (ditangkap) |
| TC-CV-16 | Privasi face = deteksi | Hasil `FaceDetectorCV.detect` | Hanya `bbox`+`score`, tanpa embedding/identitas (deteksi, bukan pengenalan) |

---

# Kasus Validasi API (API Validation — 400/422/500)

Diuji terhadap perilaku **nyata** *route handler* di `app/api/`. Semua endpoint berjalan pada `runtime = "nodejs"`. Pesan galat dalam Bahasa Indonesia dan menjadi oracle.

## `POST /api/seal`

| ID | Masukan | Status | Body oracle |
|---|---|---|---|
| TC-API-01 | Body bukan JSON | 400 | `{ error: "Body JSON tidak valid." }` |
| TC-API-02 | `event` tanpa `id`/`violation`/`subject`/`capturedAt` | 400 | `{ error: "Event tidak lengkap (butuh id, violation, subject, capturedAt)." }` |
| TC-API-03 | `event.violation` tak ada di `CITATIONS` | 400 | `{ error: "Jenis pelanggaran (violation) tidak dikenal." }` |
| TC-API-04 | `event.subject` selain `self`/`other` | 400 | `{ error: "Subjek (subject) harus 'self' atau 'other'." }` |
| TC-API-05 | `event.capturedAt` bukan angka | 400 | `{ error: "Waktu pengambilan (capturedAt) harus berupa angka." }` |
| TC-API-06 | `confidence` bukan angka berhingga | 200 | `confidence` di-*coerce* ke `0` lalu disegel |
| TC-API-07 | `confidence` di luar [0,1] | 200 | Di-*clamp* ke [0,1] (mis. 5 → 1, -2 → 0) |
| TC-API-08 | Event valid lengkap | 200 | `SealedEvidence` (`algorithm="Ed25519"`, `payloadHash`, `signature`, `publicKeyId`, `sealedAt`) |
| TC-API-09 | `sealedAt` otoritatif | 200 | `payload.sealedAt` berasal dari server (`Date.now()`), bukan klien |
| TC-API-10 | Snapshot hukum benar | 200 | `payload.legal` cocok dengan `CITATIONS[violation]` (uu/pasal/ayat/sanksi) |

## `POST /api/verify`

| ID | Masukan | Status | Body oracle |
|---|---|---|---|
| TC-API-11 | Body bukan JSON | 400 | `{ error: "Body JSON tidak valid." }` |
| TC-API-12 | `sealed` tanpa `signature` atau `payload` | 400 | `{ error: "Envelope tidak lengkap." }` |
| TC-API-13 | Envelope sah | 200 | `VerificationResult` `valid=true` |
| TC-API-14 | Envelope ter-tamper | 200 | `valid=false`, `hashMatches=false` (verifikasi adalah hasil, bukan galat HTTP) |

## `GET /api/public-key`

| ID | Aksi | Status | Oracle |
|---|---|---|---|
| TC-API-15 | GET | 200 | `{ publicKeyHex, keyId, algorithm:"Ed25519", isDev }`; header `Cache-Control: public, max-age=3600` |
| TC-API-16 | Verifikasi independen | n/a | Kunci ini memverifikasi laporan tanpa memercayai UI |

## `POST /api/report`

| ID | Masukan | Status | Oracle |
|---|---|---|---|
| TC-API-17 | Body bukan JSON | 400 | `{ error: "Body JSON tidak valid." }` |
| TC-API-18 | `sealed` tanpa `payload`/`signature` | 400 | `{ error: "Envelope tidak lengkap." }` |
| TC-API-19 | `violation` tak dikenal | 400 | `{ error: "Jenis pelanggaran (violation) tidak dikenal." }` |
| TC-API-20 | Envelope tidak dapat diverifikasi | 422 | `{ error: "Envelope tidak dapat diverifikasi — laporan resmi tidak dibuat.", reason }` |
| TC-API-21 | Render PDF gagal | 500 | `{ error: "Gagal membuat dokumen PDF laporan." }` |
| TC-API-22 | Envelope sah, subject `other` | 200 | PDF; `kind` default `tilang`; header `Content-Type: application/pdf`, `Content-Disposition` attachment |
| TC-API-23 | Envelope sah, subject `self` | 200 | `kind` default `coaching` |
| TC-API-24 | `kind` eksplisit | 200 | Menghormati `kind` (`tilang`/`kecelakaan`/`coaching`) |
| TC-API-25 | Round-trip QR/URL | 200 | `verifyUrl = {origin}/verify?d={base64url(JSON sealed)}`; dekode `d` → envelope identik → verifikasi `valid=true` |

> **Properti keamanan utama (`/api/report`):** laporan **tidak pernah** diterbitkan untuk envelope yang gagal verifikasi (422). Ini harus menjadi kasus uji eksplisit anti-regresi.

---

# Pengujian Aksesibilitas & Performa (Accessibility & Performance Testing)

## Aksesibilitas (F-A11Y)

Target: **WCAG 2.1 AA** untuk halaman publik `/`, `/live`, `/review`, `/verify`.

| ID | Aspek | Metode | Kriteria lulus |
|---|---|---|---|
| TC-A11Y-01 | Audit otomatis | axe-core via Playwright pada tiap halaman | Tidak ada pelanggaran *serious/critical* |
| TC-A11Y-02 | Kontras warna | Palet *signal-red/amber/verified-green* pada latar gelap (*forensic terminal*) | Rasio kontras teks ≥ 4.5:1 (≥ 3:1 untuk teks besar) |
| TC-A11Y-03 | Navigasi keyboard | Tab melalui kontrol `/live` dan `/verify` | Semua kontrol terjangkau & punya *focus ring* |
| TC-A11Y-04 | Status terbaca *screen reader* | Hasil verifikasi VALID/DIUBAH | Status diumumkan (mis. `aria-live`); `/verify` fallback memakai `aria-busy` |
| TC-A11Y-05 | Teks alternatif | Diagram, ikon, dan crop bukti | `alt`/label deskriptif; crop wajah ditandai sebagai buram |
| TC-A11Y-06 | Pesan galat | Galat izin kamera/GPS | Tersampaikan sebagai teks, bukan hanya warna |
| TC-A11Y-07 | Bahasa dokumen | `<html lang>` | Diset `id` (Bahasa Indonesia) |

## Performa (F-PERF)

Konteks: inferensi berjalan **di peramban** (TF.js WebGL + MediaPipe GPU), sehingga performa adalah properti pengalaman, bukan sekadar metrik server.

| ID | Metrik | Metode | Target demo |
|---|---|---|---|
| TC-PERF-01 | Waktu muat model | Ukur `CVPipeline.load` (coco-ssd `lite_mobilenet_v2` + MediaPipe dari CDN) | Selesai & memberi *progress* bertahap; tidak memblokir UI |
| TC-PERF-02 | Laju frame analisis | FPS efektif `analyze()` di perangkat menengah | Cukup mulus untuk demo (degradasi anggun bila lambat) |
| TC-PERF-03 | Degradasi anggun | Matikan WebGL → fallback backend (cpu/wasm) | Aplikasi tetap berjalan |
| TC-PERF-04 | Latensi seal | `POST /api/seal` (Node runtime) | Round-trip wajar pada demo Vercel |
| TC-PERF-05 | Latensi/ukuran PDF | `POST /api/report` render `@react-pdf/renderer` | Selesai tanpa *timeout* fungsi serverless |
| TC-PERF-06 | Web Vitals halaman publik | Lighthouse pada `/` dan `/verify` | LCP/CLS/INP dalam rentang "baik" untuk demo |
| TC-PERF-07 | Beban memori CV | Sesi panjang `/live` | Tidak ada kebocoran; `dispose()` membersihkan model & tracker |
| TC-PERF-08 | OCR pada permintaan | `readPlate` hanya pada crop bukti, bukan stream | OCR tidak berjalan per-frame live |

---

# Kriteria Masuk dan Keluar (Entry & Exit Criteria)

## Kriteria masuk (entry)

Pengujian sebuah tingkatan dimulai hanya bila:

1. `pnpm build` sukses dan `pnpm typecheck` (`tsc --noEmit`) lulus tanpa galat.
2. `pnpm lint` (ESLint, `eslint-config-next`) lulus tanpa galat baru.
3. Item uji target sudah ter-*commit* dan stabil (tidak sedang dalam refactor besar).
4. Lingkungan uji siap: DEV key tersedia by default; untuk uji jalur PROD, `DASHAI_SIGNING_KEY` valid disetel.
5. Data demo (`lib/demo/samples.ts`) tersedia; *stub* OSM/CDN siap untuk uji unit/integrasi.

## Kriteria keluar (exit)

Rilis demo dapat dinyatakan layak bila:

1. **100% kasus uji kriptografi (TC-CRY) lulus.** Ini *gating*: kegagalan satu pun pada seal/verify/tamper memblokir rilis.
2. **100% kasus validasi API (TC-API) lulus**, khususnya properti "report tidak terbit untuk envelope tak-terverifikasi" (TC-API-20).
3. **≥ 95% kasus mesin/CV (TC-ENG, TC-CV) lulus**, dengan tidak ada kegagalan pada kasus *false positive* berprioritas tinggi (TC-ENG-02..05, 07..09, 11, 14, 15, 17, 18).
4. **Tidak ada cacat terbuka berseverity *blocker* atau *critical*.** Cacat *major* memiliki *workaround* terdokumentasi.
5. Audit aksesibilitas tanpa pelanggaran *serious/critical* pada halaman publik.
6. Target performa demo (Bagian Performa) terpenuhi pada minimal satu perangkat Android dan satu iOS.
7. **Pernyataan kejujuran terverifikasi:** UI dan dokumen tidak mengklaim *tamper-proof*; estimasi kecepatan kendaraan lain ditandai sebagai perkiraan; laporan ditandai bukan dokumen resmi kepolisian; laporan DEV ditandai `dev-…`.
8. Coverage unit untuk `lib/crypto/` dan `lib/violations/engine.ts` ≥ 90% baris/cabang.

## Kriteria suspensi dan dimulainya ulang

- **Suspensi:** jika `build`/`typecheck` rusak, atau jika ditemukan cacat kriptografi yang membuat verifikasi memberi hasil salah (mis. tamper tak terdeteksi), pengujian lanjutan dihentikan sampai diperbaiki.
- **Mulai ulang:** setelah perbaikan ter-*commit* dan suite regresi kriptografi (TC-CRY) hijau kembali.

---

# Risiko dan Mitigasi (Risks & Mitigations)

| ID | Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|---|
| R-01 | Klaim berlebihan: pengguna menyangka bukti *tamper-proof* | Tinggi | Sedang | Uji negatif eksplisit; istilah "tamper-evident" konsisten di UI/dokumen; `/verify` menjelaskan batasan |
| R-02 | *False positive* mesin aturan menuduh pengendara tak bersalah | Tinggi | Sedang | Ambang ketat (`MIN_TRACK_AGE`, `cos<-0.6`, `delta>120`, margin 5 km/jam, ≥3 kendaraan); suite TC-ENG FP; verifikasi manusia pada penindakan nyata |
| R-03 | Estimasi kecepatan kendaraan **lain** dianggap akurat | Sedang | Tinggi | Pisahkan `egoSpeedKmh` (GPS, akurat) dari `otherSpeedKmh` (estimasi); tandai sebagai perkiraan di UI/laporan; uji label |
| R-04 | Sitasi hukum salah/tergeser dari `citations.ts` | Tinggi | Rendah | Uji konsistensi TC-LAW; basis pengetahuan digenerate dari riset 3-voter adversarial, tidak diedit tangan |
| R-05 | DEV key tak sengaja dipakai di produksi | Tinggi | Rendah | `keyId` berawalan `dev-`/`prod-`; laporan DEV ditandai `dev-…`; uji TC-CRY-14..16; pemeriksaan lingkungan |
| R-06 | Kebocoran privasi (wajah/pelat) | Tinggi | Rendah | Deteksi (bukan pengenalan) wajah; blur default; lokal-first IndexedDB; server hanya menerima payload tersegel; uji TC-CV-16 |
| R-07 | Variabilitas perangkat ponsel (WebGL/izin) | Sedang | Tinggi | Degradasi anggun (TC-CV-10..12, TC-PERF-03); uji manual lintas perangkat |
| R-08 | Kegagalan layanan eksternal (OSM Overpass / CDN model) | Sedang | Sedang | Pipeline tetap jalan dengan model yang berhasil; aturan berbasis OSM tidak memicu jika data null (TC-ENG-08, TC-ENG-12) |
| R-09 | Ketergantungan determinisme JSON antar mesin | Tinggi | Rendah | `canonicalize` mengurutkan kunci rekursif & menjatuhkan `undefined`; suite TC-CRY-02..05 |
| R-10 | Render PDF gagal/timeout di serverless | Sedang | Sedang | Penanganan galat → 500 terdefinisi; QR *best-effort* dengan URL cadangan tercetak; TC-API-21, TC-PERF-05 |
| R-11 | Tidak adanya suite uji otomatis saat ini | Sedang | Tinggi (saat ini) | Dokumen ini menetapkan kasus + oracle; jadikan TC-CRY/TC-API/TC-ENG sebagai prasyarat CI sebelum rilis berikutnya |
| R-12 | Pemalsuan adegan fisik (kamera ke layar) | Tinggi | Sedang | Diakui sebagai batasan; *roadmap* atestasi perangkat & kontinuitas GPS; tidak diklaim tertangani |

---

# Keterlacakan ke Kebutuhan (Traceability to Requirements)

Matriks menautkan kebutuhan/sifat sistem ke kasus uji dan ke kode sumber yang menjadi *ground truth*. Ini memenuhi syarat keterlacakan IEEE 829/29119.

| Req ID | Kebutuhan / sifat | Sumber kode | Fitur | Kasus uji |
|---|---|---|---|---|
| REQ-SEAL | Bukti disegel canonical→sha-256→Ed25519 di server | `lib/crypto/sign.ts`, `app/api/seal` | F-SEAL | TC-CRY-01,05,14–18; TC-API-08–10 |
| REQ-VERIFY | Verifikasi dua-pemeriksaan (hash + signature) | `lib/crypto/verify.ts`, `app/api/verify` | F-VERIFY | TC-CRY-01,06–13,19; TC-API-13,14 |
| REQ-TAMPER | Perubahan payload terdeteksi (tamper-evident) | `lib/crypto/verify.ts` | F-VERIFY | TC-CRY-06–09,13 |
| REQ-CANON | Serialisasi kanonik deterministik | `lib/crypto/canonical.ts` | F-CANON | TC-CRY-02–05 |
| REQ-KEY | Kunci PROD via 1 env `DASHAI_SIGNING_KEY`; DEV fallback bertanda | `lib/crypto/keys.ts` | F-KEY | TC-CRY-14–18; TC-API-15 |
| REQ-PUBKEY | Kunci publik dipublikasikan untuk verifikasi independen | `app/api/public-key` | F-PUBKEY | TC-API-15,16; TC-CRY-19 |
| REQ-WRONGWAY | Deteksi melawan arah (self: OSM+GPS; other: arus visual) | `lib/violations/engine.ts` | F-WRONGWAY | TC-ENG-01–09 |
| REQ-SPEED | Ngebut self akurat (GPS vs OSM `maxspeed`) | `lib/violations/engine.ts` | F-SPEED-SELF | TC-ENG-10–12 |
| REQ-OVERCAP | Boncengan > 1 (≥3 orang/motor) | `lib/violations/engine.ts` | F-OVERCAP | TC-ENG-13–15 |
| REQ-REDLIGHT | Terobos lampu merah (self) | `lib/violations/engine.ts` | F-REDLIGHT | TC-ENG-16–18 |
| REQ-DEBOUNCE | Satu laporan per (jenis, track), debounce 6 s | `lib/violations/engine.ts` | F-WRONGWAY/.. | TC-ENG-19–21 |
| REQ-TRACK | Tracking IoU + velocity | `lib/cv/tracker.ts` | F-TRACK | TC-CV-04–09 |
| REQ-DETECT | Object detection coco-ssd, filter `TRAFFIC_CLASSES` | `lib/cv/detector.ts` | F-DETECT | TC-CV-01–03 |
| REQ-DEGRADE | Degradasi anggun model sekunder | `lib/cv/pipeline.ts` | F-DEGRADE | TC-CV-10–12; TC-PERF-03 |
| REQ-PRIV | Deteksi (bukan pengenalan) wajah, blur, lokal-first | `lib/cv/face.ts`, UI | F-PRIV | TC-CV-16; TC-A11Y-05 |
| REQ-PLATE | OCR pelat hanya pada crop, normalisasi & validasi | `lib/cv/plate.ts` | F-DETECT/F-PRIV | TC-CV-13–15; TC-PERF-08 |
| REQ-LAW | Pemetaan pelanggaran → pasal UU 22/2009 terverifikasi | `lib/legal/citations.ts`, `lib/evidence/payload.ts` | F-LAW | TC-LAW-01–03; TC-API-10 |
| REQ-REPORT | PDF tilang/kecelakaan/coaching + QR self-contained | `app/api/report`, `lib/report/` | F-REPORT | TC-API-17–25; TC-PERF-05 |
| REQ-REPORT-SAFE | Laporan hanya untuk envelope terverifikasi | `app/api/report` | F-REPORT | TC-API-20 |
| REQ-PAYLOAD | Kontrak `EvidencePayload` (boundary kripto) | `lib/evidence/types.ts`, `payload.ts` | F-SEAL/F-LAW | TC-API-09,10; TC-CRY-01 |
| REQ-HONEST | Tidak klaim tamper-proof; estimasi ditandai; bukan dok. resmi | README, UI, `keys.ts` | F-VERIFY/F-SPEED | TC-CRY (catatan), TC-A11Y-05, exit #7 |
| REQ-A11Y | Aksesibilitas WCAG 2.1 AA halaman publik | `app/`, `components/` | F-A11Y | TC-A11Y-01–07 |
| REQ-PERF | Performa demo di peramban ponsel | `lib/cv/`, `app/api/` | F-PERF | TC-PERF-01–08 |

## Kasus uji konsistensi hukum (TC-LAW)

| ID | Tujuan | Hasil yang diharapkan |
|---|---|---|
| TC-LAW-01 | Kelengkapan katalog | 12 kunci di `ViolationKey` punya entri di `CITATIONS` **dan** `VIOLATION_CATALOG` |
| TC-LAW-02 | Snapshot hukum cocok | `buildPayload` menyalin `uu/pasal/ayat/sanksi` persis dari `CITATIONS[violation]` |
| TC-LAW-03 | Status verifikasi | Setiap sitasi `verified=true`, `confidence="high"` (12/12, 3-voter adversarial) |

---

# Lampiran: Ringkasan Cakupan Pelanggaran dan Status Deteksi

Konsisten dengan `lib/legal/catalog.ts` dan `lib/legal/citations.ts`. Sitasi pasal **persis** seperti basis pengetahuan terverifikasi.

| Kunci | Label | Tier | Subjek | Pasal (UU 22/2009) | Deteksi live aktif? |
|---|---|---|---|---|---|
| `lawan-arus` | Melawan arah | core | other, self | Pasal 287 ayat (1) | Ya (self: OSM+GPS; other: arus visual) |
| `melebihi-kecepatan` | Melebihi batas kecepatan | core | other, self | Pasal 287 ayat (5) | Ya untuk self (GPS vs OSM `maxspeed`, akurat) |
| `terobos-lampu-merah` | Menerobos lampu merah | core | other, self | Pasal 287 ayat (2) | Ya untuk self (state merah + masih melaju) |
| `boncengan-lebih` | Boncengan lebih dari satu | core | other | Pasal 292 | Ya (≥3 orang/motor) |
| `tanpa-helm` | Pengendara tanpa helm | core | other | Pasal 291 ayat (1) | Belum (butuh model khusus) |
| `penumpang-tanpa-helm` | Penumpang tanpa helm | secondary | other | Pasal 291 ayat (2) | Belum |
| `langgar-marka` | Melanggar marka/rambu | secondary | other, self | Pasal 287 ayat (1) | Belum |
| `tanpa-plat` | Tanpa pelat nomor sah | secondary | other | Pasal 280 | Belum |
| `tanpa-lampu-malam` | Tanpa lampu pada malam hari | secondary | other, self | Pasal 293 ayat (1) | Belum |
| `motor-lampu-siang` | Motor tanpa lampu di siang hari | secondary | other | Pasal 293 ayat (2) | Belum |
| `tanpa-sabuk` | Tanpa sabuk keselamatan | cabin | self | Pasal 289 | Belum (butuh kamera kabin) |
| `main-hp` | Bermain ponsel saat berkendara | cabin | self | Pasal 283 | Belum (butuh kamera kabin) |

> Pelanggaran yang **belum** terdeteksi *live* tetap dikatalogkan dan didemonstrasikan melalui dataset demo; deteksi penuh memerlukan model khusus (helm/pelat) atau kamera kabin (lihat *roadmap* README). Pengujian untuk pelanggaran ini berfokus pada **konsistensi sitasi** (TC-LAW) dan **rendering demo**, bukan akurasi deteksi *live*.

# Lampiran: Diagram Pendukung

![Pipeline CV](docs/diagrams/cv-pipeline.png)

![Diagram alur seal (sequence)](docs/diagrams/sequence-seal.png)

![Diagram aliran data (DFD)](docs/diagrams/dfd.png)

![Model ancaman (threat model)](docs/diagrams/threat-model.png)

![State pelanggaran](docs/diagrams/violation-state.png)
