---
title: "Panduan Pengguna dashAI (User Manual)"
subtitle: "dashAI — Saksi Mata Digital yang Netral & Tertandatangani · Panduan Operasional untuk Pengguna Akhir"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Pengenalan dashAI

## Apa itu dashAI

**dashAI** adalah aplikasi web *AI dashcam* yang mengubah ponsel (dan, di masa depan, perangkat keras khusus) menjadi **saksi mata digital yang netral dan tertandatangani**. Aplikasi mendeteksi pelanggaran lalu lintas secara *real-time* langsung di dalam peramban Anda, memetakan setiap pelanggaran ke pasal **Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)** dari basis pengetahuan yang telah diverifikasi, lalu **menyegel bukti secara kriptografis** menggunakan tanda tangan digital **Ed25519** di server. Hasilnya adalah bukti yang **tamper-evident** (perubahan apa pun pasti terdeteksi) dan dapat diverifikasi oleh siapa saja, tanpa perlu memercayai antarmuka dashAI.

dashAI dapat dicoba langsung di **<https://dashai-mu.vercel.app>**. Kode sumbernya bersifat terbuka di **<https://github.com/Finerium/dashAI>** dengan lisensi **Apache-2.0**.

> **Penting.** dashAI saat ini adalah **demo melalui kamera ponsel**, bukan dokumen resmi kepolisian. Bukti yang dihasilkan bersifat **tamper-evident, bukan tamper-proof** — artinya tanda tangan membuktikan bahwa isi laporan tidak berubah sejak disegel, tetapi **tidak** membuktikan bahwa kamera benar-benar menyaksikan peristiwa di dunia nyata. Penilaian akhir atas fakta tetap berada di tangan manusia/pihak berwenang.

## Mengapa dashAI ada

Di Indonesia sering terjadi situasi di mana **pihak yang melanggar justru paling berani memfitnah**: kecelakaan atau senggolan kecil memicu emosi dan kerumunan, dan bukti objektif kalah oleh tekanan massa. Kamera tilang elektronik statis (ETLE) tidak hadir di setiap sudut jalan. dashAI dirancang untuk dua tujuan sekaligus:

1. **Menindak pihak lain** — mendokumentasikan pelanggaran pengendara lain sebagai dasar laporan ke pihak berwenang.
2. **Melindungi diri Anda sendiri** — mengumpulkan bukti yang meringankan (ekskulpatori) saat Anda difitnah, sekaligus memberi *self-coaching* agar Anda tidak mengulang kesalahan berkendara.

## Prinsip utama yang perlu Anda pahami

| Prinsip | Penjelasan singkat |
|---|---|
| **Lokal lebih dulu (local-first)** | Analisis kamera berjalan di perangkat Anda. Bukti disimpan dulu secara lokal di **IndexedDB**. Server hanya menerima payload yang **secara eksplisit** Anda segel. |
| **Privasi sejak desain** | dashAI melakukan **deteksi wajah, bukan pengenalan identitas**. Wajah di-blur secara default di antarmuka. Selaras dengan semangat **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (PDP)**. |
| **Dapat diverifikasi siapa saja** | Kunci publik dipublikasikan di `/api/public-key`, sehingga verifikasi keaslian laporan tidak bergantung pada kepercayaan terhadap dashAI. |
| **Jujur soal batasan** | dashAI bersifat **tamper-evident**, bukan tamper-proof, dan estimasi kecepatan kendaraan lain bersifat **perkiraan**. |

## Apa yang akan Anda gunakan

dashAI memiliki empat halaman utama:

| Halaman | Alamat | Fungsi |
|---|---|---|
| Beranda | `/` | Pengenalan dan titik masuk. |
| **Live** | `/live` | Pemindaian pelanggaran langsung dari kamera. |
| **Penyimpanan Bukti** (Tinjauan) | `/review` | Meninjau, menyegel, dan mengunduh laporan bukti. |
| **Verifikasi** | `/verify` | Memeriksa keaslian (tanda tangan) sebuah laporan. |

---

# Memulai

## Perangkat dan peramban yang dibutuhkan

dashAI berjalan sepenuhnya di peramban dan tidak memerlukan pemasangan aplikasi. Untuk pengalaman terbaik:

- **Ponsel atau perangkat dengan kamera belakang** (dashAI meminta kamera `environment`, yaitu kamera belakang).
- **Peramban modern** yang mendukung WebGL, IndexedDB, dan Web Crypto (Chrome/Edge/Safari/Firefox versi terbaru).
- **Koneksi internet** saat pertama kali memuat — model AI diunduh dari CDN publik (TensorFlow.js dan MediaPipe) dan konteks jalan diambil dari OpenStreetMap. **Tidak ada API key pihak ketiga** yang diperlukan.

## Wajib: koneksi aman (HTTPS)

Akses kamera **hanya** dapat dilakukan melalui **HTTPS** atau melalui `localhost`. Ini adalah persyaratan keamanan peramban (`secure context`), bukan keterbatasan dashAI. Demo resmi `https://dashai-mu.vercel.app` sudah berjalan di atas HTTPS, sehingga Anda tidak perlu konfigurasi apa pun.

Jika Anda membuka dashAI lewat koneksi tidak aman (mis. `http://` ke alamat IP), dashAI akan menampilkan pesan **"Butuh koneksi aman (HTTPS)"** dan tidak akan mengaktifkan kamera.

## Langkah memberi izin kamera dan lokasi

1. Buka **`/live`**.
2. Tekan tombol **Mulai**. dashAI akan menampilkan status "Meminta akses kamera…".
3. Peramban akan menampilkan **dialog izin kamera**. Pilih **Izinkan/Allow**.
4. Setelah kamera aktif, dashAI memuat model deteksi (status: "Memuat model deteksi…"), lalu mulai memindai (status: "Pemindaian aktif").
5. **Izin lokasi (GPS)** dan **sensor gerak (DeviceMotion)** bersifat **opsional namun sangat dianjurkan**. Izin lokasi mengaktifkan deteksi *melawan arah untuk diri sendiri* dan *melebihi kecepatan diri sendiri*; sensor gerak mengaktifkan *pengamanan otomatis saat benturan/pengereman keras*.

### Apa yang terjadi jika izin ditolak

dashAI dirancang agar **gagal dengan anggun (graceful degradation)**: fitur yang izinnya ditolak akan dinonaktifkan, tetapi sisanya tetap berjalan.

| Kondisi | Perilaku dashAI |
|---|---|
| Kamera ditolak | Tampil panel **"Akses kamera ditolak"** dengan saran membuka pengaturan peramban. Tersedia tautan ke **mode demo** (`/review`). |
| Koneksi tidak aman | Tampil panel **"Butuh koneksi aman (HTTPS)"**. |
| Kamera tidak tersedia/dipakai aplikasi lain | Tampil panel **"Kamera tidak tersedia"**. |
| GPS ditolak/tidak ada | Pemindaian tetap berjalan; fitur kecepatan dan konteks jalan **terdegradasi** (tidak fatal). |
| Sensor gerak ditolak (mis. iOS 13+) | Pengamanan otomatis saat benturan tidak aktif; pemindaian tetap berjalan. |

> **Catatan iOS.** Pada iOS 13 ke atas, akses sensor gerak (DeviceMotion) memerlukan **gestur pengguna eksplisit dan izin**. dashAI meminta izin ini saat Anda menekan **Mulai**.

## Tentang kinerja dan baterai

Untuk menjaga ponsel tetap responsif dan tidak terlalu panas, dashAI **membatasi laju analisis ke sekitar 13 frame per detik** (interval 75 ms). Permintaan konteks jalan ke OpenStreetMap juga dibatasi (debounce ~8 detik). Ini disengaja: laju tersebut sudah memadai untuk penegakan, sementara menjalankan CV berat di setiap frame akan membebani perangkat.

---

# Mode Live: membaca HUD

Mode Live (`/live`) adalah jantung dashAI. Halaman ini menampilkan **panggung kamera** dengan lapisan HUD (*heads-up display*) di atasnya, serta **umpan pelanggaran** di sisi kanan.

## Tata letak layar

- **Panggung kamera (kiri/atas):** menampilkan video langsung dengan overlay deteksi.
- **Bilah HUD atas:** indikator status pemindaian (hanya muncul saat kamera berjalan).
- **Umpan pelanggaran (kanan/bawah):** daftar pelanggaran terdeteksi, terbaru menumpuk; tertulis jumlahnya. Jika kosong: "Belum ada pelanggaran terdeteksi."
- **Tombol Mulai / Stop** di pojok kanan atas header.

## Membaca bilah HUD atas

Bilah HUD muncul di tepi atas panggung saat pemindaian aktif. Berikut arti setiap indikator:

| Indikator | Arti |
|---|---|
| **REC** (titik merah berkedip) | Pemindaian sedang berjalan. |
| **FPS** | Frame per detik yang dianalisis (rolling ~1 detik). |
| **DET** | Jumlah objek yang terdeteksi pada frame saat ini. |
| **SPD** | Kecepatan Anda (GPS) per batas kecepatan ruas, dalam km/jam. Format `kecepatan/batas`. Berubah **merah** bila melebihi batas. Tampil `—` bila GPS/kecepatan belum tersedia. |
| **JLN** | Nama ruas jalan dari OpenStreetMap. Disertai label **1-arah** (amber) bila ruas tersebut satu arah. |
| **OBJ / FACE / POSE** | Status pemuatan model: titik **hijau** = model aktif, abu-abu = tidak aktif. OBJ (deteksi objek) wajib; FACE dan POSE opsional. |

## Membaca kotak (box) di atas video

Lapisan overlay menggambar bentuk geometris di atas video. Semua koordinat dinormalisasi (0..1) sehingga menyesuaikan ukuran tampilan.

| Elemen | Tampilan | Arti |
|---|---|---|
| **Box kendaraan** | Garis **amber tipis**; saat menjadi fokus pelanggaran berubah **merah tebal berdenyut** dengan kurung sudut | Kendaraan terdeteksi (mobil, motor, bus, truk, sepeda). Label kecil menampilkan `kelas #id keyakinan%`, mis. `motorcycle #a3f1 88%`. |
| **Box orang** | Garis **abu-abu** | Pejalan kaki/penumpang (kelas `person`). |
| **Chip wajah** | Kotak ber-**blur** bertuliskan **"WAJAH • blur"** | Wajah yang terdeteksi selalu di-blur. dashAI **tidak** mengenali identitas. |
| **Garis rangka (skeleton) hijau** | Garis dan titik **hijau** | Estimasi pose tubuh (MediaPipe), digunakan untuk analisis perilaku (mis. boncengan). |
| **Panah arus (kanan bawah)** | Panah amber bertuliskan **"arus"** | Arah arus lalu lintas dominan dari frame. Bertuliskan "diam" bila tidak ada gerak berarti. |

> Box yang **berdenyut merah** menandai objek yang sedang menjadi subjek pelanggaran terkonfirmasi — itulah yang akan masuk ke umpan pelanggaran.

## Membaca kartu pelanggaran dan panel pasal

Setiap pelanggaran yang terkonfirmasi menjadi sebuah **kartu** di umpan kanan. Pada kartu Anda akan melihat:

- **Nama pelanggaran** (Bahasa Indonesia) dan **waktu** kejadian.
- **Tag subjek**: **Diri** (amber) atau **Lain** (merah).
- **Keyakinan** mesin dalam persen (0–100%).
- **Status segel**: **Menyegel…** (sementara) lalu **Tersegel** (hijau) setelah disegel server.
- **Catatan** otomatis dari mesin aturan (mis. "Arah gerak berlawanan dengan arus dominan lalu lintas.").
- Tombol **"Lihat dasar hukum"** yang membuka **panel pasal** (citation breakdown).

Panel pasal menampilkan **bunyi pasal UU 22/2009**, **pasal & ayat**, dan **ancaman/sanksi** persis seperti yang tersimpan di basis pengetahuan terverifikasi dashAI (lihat bagian *Cakupan pelanggaran* di bawah).

## Cakupan pelanggaran dan apa yang aktif secara live

dashAI memiliki katalog lengkap 12 jenis pelanggaran, semuanya terikat ke pasal UU 22/2009 yang telah diverifikasi. Namun **tidak semua** dideteksi secara live pada demo ponsel saat ini — hanya aturan yang memiliki sinyal andal dari kamera + GPS yang aktif. Sisanya dikatalogkan dan diperagakan melalui kumpulan data demo (lihat halaman Penyimpanan Bukti).

### Pelanggaran yang aktif terdeteksi secara live

| Pelanggaran | Subjek | Pasal (UU 22/2009) | Dasar deteksi |
|---|---|---|---|
| Melawan arah (diri sendiri) | Diri | Pasal 287 ayat (1) | Heading GPS dibandingkan arah sah ruas satu arah dari OSM (selisih > 120°, kecepatan ≥ 8 km/jam). |
| Melawan arah (pihak lain) | Lain | Pasal 287 ayat (1) | Arah gerak objek berlawanan kuat dengan arus dominan (cosine < −0,6), butuh ≥ 3 kendaraan bergerak. |
| Melebihi kecepatan (diri sendiri) | Diri | Pasal 287 ayat (5) | Kecepatan GPS dibandingkan `maxspeed` OSM, dengan margin 5 km/jam. **Akurat.** |
| Boncengan lebih dari satu | Lain | Pasal 292 ayat (9) | ≥ 3 orang terdeteksi berada di dalam satu sepeda motor. |
| Menerobos lampu merah (diri sendiri) | Diri | Pasal 287 ayat (2) | Status lampu merah terdeteksi sementara kendaraan masih melaju (≥ 10 km/jam). |

### Pelanggaran lain dalam katalog (diperagakan via dataset demo)

| Pelanggaran | Pasal (UU 22/2009) | Catatan deteksi penuh |
|---|---|---|
| Pengendara tanpa helm | Pasal 291 ayat (1) | Butuh model klasifikasi helm khusus. |
| Penumpang tanpa helm | Pasal 291 ayat (2) | Subjek hukum yang dipidana adalah **pengemudi** yang membiarkan penumpang tanpa helm. |
| Melanggar marka/rambu | Pasal 287 ayat (1) | Butuh deteksi lajur/marka. |
| Tanpa pelat nomor sah | Pasal 280 ayat (1) | Butuh OCR pelat (Tesseract.js) pada region pelat. |
| Tanpa lampu pada malam hari | Pasal 293 ayat (1) | Butuh estimasi cahaya ambient + region lampu. |
| Motor tanpa lampu di siang hari | Pasal 293 ayat (2) | Sanksi: kurungan maks 15 hari atau denda maks Rp100.000,00. |
| Tanpa sabuk keselamatan | Pasal 289 ayat (6) | Butuh kamera kabin (driver monitoring). |
| Bermain ponsel saat berkendara | Pasal 283 ayat (1) | Butuh kamera kabin (driver monitoring). |

> **Penting soal kecepatan.** Kecepatan **diri sendiri** dihitung dari GPS dibandingkan `maxspeed` OSM dan bersifat **akurat**. Kecepatan **kendaraan lain** bersifat **estimasi/perkiraan** (dari perubahan skala box + optical flow) dan ditampilkan dengan penanda `± est`. Jangan perlakukan estimasi kecepatan pihak lain sebagai angka pasti.

## Siklus hidup sebuah pelanggaran

Diagram berikut menggambarkan perjalanan satu pelanggaran, mulai dari deteksi kandidat hingga terverifikasi. Diagram di-*ground* pada `lib/violations/engine.ts` (debounce 6 detik, `MIN_TRACK_AGE` 4 frame), penyimpanan IndexedDB, lalu alur segel → laporan → verifikasi.

![Diagram mesin status siklus hidup pelanggaran dashAI](docs/diagrams/violation-state.png)

Penjelasan tahapan:

1. **Detected (kandidat):** objek/track terlihat di frame (coco-ssd + IoU tracker). Track yang berusia kurang dari 4 frame atau masih dalam jendela *debounce* 6 detik diabaikan agar tidak ada *false positive* dari noise satu frame.
2. **Confirmed:** aturan terpenuhi, usia track memadai, dan jendela debounce sudah lewat. Mesin menghasilkan `ViolationCandidate` dengan nilai keyakinan 0..1 dan *snapshot* pasal UU 22/2009.
3. **Stored (lokal):** kejadian disimpan di **IndexedDB** pada perangkat Anda (privacy-by-design). Anda dapat menghapusnya kapan saja.
4. **Sealed (server):** setelah Anda menyetujui, payload dikirim ke `/api/seal`, distempel waktu server, dihash (SHA-256), lalu ditandatangani Ed25519.
5. **Reported:** laporan PDF (tilang/kecelakaan/coaching) dibuat melalui `/api/report`, lengkap dengan QR menuju halaman `/verify`.
6. **Verified:** verifikator mana pun memeriksa hash + tanda tangan, menghasilkan putusan **VALID** (utuh) atau **DIUBAH** (tamper-evident).

## Pengamanan otomatis saat benturan

Jika sensor gerak aktif, dashAI memantau lonjakan akselerasi. Saat terdeteksi **dugaan benturan** (≈ ≥ 2,5 g) atau **pengereman keras** (≈ ≥ 0,75 g), dashAI **otomatis mengamankan frame** sebagai bukti — berguna jika Anda tidak sempat menyentuh ponsel saat insiden. Kejadian ini diberi catatan yang menjelaskan jenis dan puncak g-force-nya.

---

# Penyimpanan Bukti (review, segel, unduh laporan)

Halaman **Penyimpanan Bukti** (`/review`) adalah arsip forensik tempat Anda meninjau, menyegel, dan mengekspor bukti.

## Meninjau bukti

- Saat dibuka, halaman memuat bukti dari **IndexedDB** perangkat dan menggabungkannya dengan **kumpulan data demo** (data demo ditandai label **demo** dan tidak pernah diperlakukan sebagai bukti nyata). Bukti tersimpan akan menimpa demo bila ber-ID sama. Daftar diurutkan dari yang **terbaru**.
- Gunakan **filter subjek** di atas: **Semua / Pihak lain / Diri sendiri**, lengkap dengan jumlah masing-masing.
- Klik sebuah **kartu** untuk membuka **panel rincian** di sebelah kanan.

## Membaca panel rincian

Panel rincian menampilkan:

- **Bingkai adegan (scene frame)** dengan overlay deteksi.
- **Berkas pengukuran**: subjek, waktu kejadian, kepercayaan (%), **kecepatan pemilik** (km/jam), **kecepatan pihak lain** (`km/jam ± est`), **batas kecepatan**, **ruas** jalan, dan **koordinat** (latitude, longitude).
- **Panel pasal** (citation breakdown) untuk pelanggaran terkait.
- **Status segel** lewat lencana **TERSEGEL / BELUM SEGEL**.

## Menyegel bukti

Menyegel adalah tindakan yang **mengirim payload ke server** untuk ditandatangani secara kriptografis. Ini satu-satunya momen data Anda meninggalkan perangkat.

1. Pada panel rincian, tekan **Segel bukti**.
2. dashAI mengirim kejadian ke `POST /api/seal`. Server akan:
   - Memvalidasi kelengkapan kejadian (butuh `id`, `violation`, `subject`, `capturedAt`) dan jenis pelanggaran yang dikenal.
   - Menstempel **waktu segel (`sealedAt`)** secara otoritatif.
   - Melampirkan **snapshot pasal** dari basis pengetahuan.
   - Menghitung **hash SHA-256** dari payload kanonik, lalu **menandatangani dengan Ed25519**.
3. Kembalian server adalah **SealedEvidence** (berisi `signature`, `payloadHash`, `publicKeyId`). Kejadian kini berlabel **Tersegel** dan disimpan kembali di IndexedDB.

> Setelah tersegel, antarmuka menampilkan catatan: "Disegel kriptografis (Ed25519) — payload tidak dapat diubah tanpa terdeteksi."

## Apa yang ditandatangani (batas kriptografis)

Yang ditandatangani server **bukan** seluruh tampilan, melainkan **payload kanonik** yang ringkas (skema `dashai.evidence.v1`). Gambar tidak disertakan utuh — hanya **hash SHA-256** dari gambar yang dikomitkan ke dalam payload, sehingga tanda tangan tetap kecil namun tetap mengikat citranya. Isi payload yang ditandatangani meliputi antara lain:

| Field | Keterangan |
|---|---|
| `schema` | Selalu `dashai.evidence.v1`. |
| `eventId` | ID unik kejadian. |
| `violation`, `subject` | Jenis pelanggaran dan subjek (`self`/`other`). |
| `capturedAt`, `sealedAt` | Waktu kejadian (klien) dan waktu segel (server, otoritatif). |
| `confidence` | Keyakinan mesin (0..1). |
| `egoSpeedKmh` | Kecepatan pemilik dari GPS (akurat). |
| `otherSpeedKmh` | Kecepatan pihak lain (estimasi). |
| `speedLimitKmh` | Batas kecepatan dari OSM. |
| `location`, `road` | Titik GPS dan konteks jalan OSM. |
| `mediaHashes` | Hash SHA-256 dari frame/wajah/pelat. |
| `legal` | Snapshot pasal: `uu`, `pasal`, `ayat`, `sanksi`. |

## Mengunduh laporan PDF

1. Tekan **Unduh Laporan PDF** pada panel rincian. Jika bukti belum tersegel, dashAI akan **menyegelnya lebih dahulu** secara otomatis, lalu membuat laporan.
2. Server (`POST /api/report`) **memverifikasi ulang** envelope sebelum membuat PDF. Bila tidak valid, laporan **tidak** dibuat (pesan: "Envelope tidak dapat diverifikasi — laporan resmi tidak dibuat.").
3. Jenis laporan ditentukan otomatis dari subjek:

| Subjek | Jenis laporan default |
|---|---|
| Pihak lain (`other`) | **tilang** |
| Diri sendiri (`self`) | **coaching** |

   (Jenis **kecelakaan** juga tersedia dalam katalog laporan.)

4. PDF berisi data laporan, tanda tangan, dan **QR code** yang menuju halaman `/verify`. **Verifikasi bersifat mandiri**: seluruh envelope tersegel dikodekan (base64url) di dalam URL/QR, sehingga tidak perlu basis data atau koneksi ke server dashAI untuk memeriksa keaslian.
5. Berkas terunduh dengan nama `dashAI-<jenis>-<idKejadian>.pdf`.

> **Demo vs. produksi.** Bila server menggunakan **kunci pengembangan** (DEV), laporan dan hasil verifikasi diberi penanda jelas (`dev-…` / "DEV KEY") dan **tidak sah untuk pembuktian resmi**. Produksi menggunakan satu rahasia `DASHAI_SIGNING_KEY` yang menghasilkan ID kunci berawalan `prod-`.

---

# Verifikasi laporan (cara cek keaslian)

Halaman **Verifikasi** (`/verify`) memungkinkan **siapa saja** memastikan bahwa sebuah laporan dashAI **utuh dan benar-benar disegel** oleh kunci dashAI yang dipublikasikan. Pemeriksaan berjalan **sepenuhnya di peramban Anda**: dashAI mengambil kunci publik dari `/api/public-key`, lalu mencocokkan hash dan tanda tangan Ed25519 secara lokal. **Server tidak dipercaya untuk menyatakan keabsahannya sendiri (zero trust).**

## Tiga cara memberi data ke verifikator

1. **Pindai/buka QR atau tautan** dari laporan PDF. Tautan berisi parameter `?d=` (base64url dari envelope). Verifikasi berjalan **otomatis** saat halaman terbuka.
2. **Tempel JSON** envelope tersegel ke kolom "Tempel JSON bukti tersegel", lalu tekan **Verifikasi**.
3. **Unggah berkas `.json`** envelope, melalui tombol **Unggah .json**.

## Membaca hasil verifikasi

Hasil ditampilkan sebagai **putusan besar**:

| Putusan | Arti |
|---|---|
| **VALID** (hijau) | Hash cocok **dan** tanda tangan sah. Isi laporan tidak berubah satu byte pun sejak disegel, dan benar berasal dari kunci dashAI yang dipublikasikan. |
| **DIUBAH** (merah) | **Hash payload tidak cocok** — isi laporan telah diubah setelah disegel. |
| **TIDAK SAH** (merah) | Tanda tangan Ed25519 tidak valid untuk kunci publik ini (mis. ditandatangani kunci lain). |

Di bawah putusan terdapat **dua sub-pemeriksaan** yang harus sama-sama lulus:

- **Hash payload cocok** — isi laporan tidak berubah sejak disegel.
- **Tanda tangan Ed25519 valid** — disegel oleh kunci dashAI yang dipublikasikan.

Verifikator juga menampilkan **"Isi yang ditandatangani"** — payload kanonik persis yang ditandatangani, termasuk pasal, sanksi, waktu segel, ID kunci, algoritma, **hash payload (SHA-256)**, dan **tanda tangan (base64url)**. Mengubah satu byte pun akan membatalkan tanda tangan.

> Jika laporan diverifikasi terhadap **kunci pengembangan**, verifikator menampilkan peringatan amber bahwa hasilnya **tidak sah untuk produksi atau pembuktian resmi**.

## Apa yang dibuktikan dan TIDAK dibuktikan oleh "VALID"

| Yang **dibuktikan** | Yang **TIDAK dibuktikan** |
|---|---|
| Integritas sejak disegel: isi laporan tidak berubah satu byte pun. | Bahwa kamera benar-benar menyaksikan realita (seseorang bisa mengarahkan kamera ke layar). |
| Asal dari kunci dashAI yang dipublikasikan. | Bahwa lokasi/kecepatan akurat atau interpretasi mesin tepat. |
| Stempel waktu segel bersifat otoritatif. | Penilaian fakta — itu tetap di tangan manusia/pihak berwenang. |

Inilah inti dari **tamper-evident, bukan tamper-proof**.

---

# Self-coaching

Selain menindak pihak lain, dashAI dirancang untuk **melindungi dan memperbaiki Anda sendiri**.

## Bagaimana self-coaching bekerja

- Pelanggaran dengan subjek **Diri sendiri (`self`)** — seperti **melawan arah**, **melebihi kecepatan**, dan **menerobos lampu merah** — direkam dengan dasar pengukuran yang akurat (kecepatan GPS vs `maxspeed` OSM; heading GPS vs arah sah ruas satu arah).
- Saat Anda mengunduh laporan untuk kejadian `self`, jenis laporan default-nya adalah **coaching** — laporan ini berorientasi pembelajaran, bukan penindakan.
- Setiap kejadian menyertakan **catatan** yang menjelaskan pemicunya, mis. "Kecepatan GPS 64 km/jam melebihi batas 50 km/jam." atau "Arah kendaraan (10°) berlawanan dengan arah sah ruas satu-arah (190°)." Catatan ini membantu Anda memahami kesalahan secara konkret.

## Bukti yang melindungi Anda (ekskulpatori)

Pengamanan otomatis saat **benturan/pengereman keras** menghasilkan bukti yang **meringankan** apabila Anda difitnah setelah insiden. Karena bukti tersegel secara kriptografis dan distempel waktu oleh server, pihak lain tidak dapat mengklaim isinya "katanya-katanya" tanpa terbantah oleh verifikasi.

> Self-coaching adalah cermin, bukan hukuman: tujuannya membuat Anda mengemudi lebih aman, sekaligus memberi Anda bukti netral saat Anda berada di pihak yang benar.

---

# Privasi & keamanan data Anda

dashAI dibangun dengan prinsip **privacy-by-design** dan selaras dengan semangat **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (PDP)**.

## Prinsip privasi

| Prinsip | Implementasi nyata di dashAI |
|---|---|
| **Deteksi wajah, bukan pengenalan** | dashAI memakai MediaPipe BlazeFace hanya untuk **menemukan** wajah agar dapat di-blur. dashAI **tidak pernah** mencocokkan wajah dengan identitas. |
| **Blur secara default** | Setiap wajah yang terdeteksi ditampilkan sebagai chip ber-blur bertuliskan "WAJAH • blur" di antarmuka. |
| **Lokal lebih dulu** | Analisis kamera berjalan **di perangkat**. Bukti disimpan dulu di **IndexedDB** lokal. Tidak ada unggahan otomatis. |
| **Server hanya menerima yang Anda segel** | Data baru meninggalkan perangkat **hanya** saat Anda menekan **Segel bukti** atau **Unduh Laporan**. |
| **Tanpa API key pihak ketiga** | Model AI dan konteks jalan diambil dari layanan publik (CDN model, OpenStreetMap Overpass) tanpa kunci, sehingga tidak ada akun pihak ketiga yang menyimpan jejak Anda. |

## Bagaimana data Anda mengalir

1. **Di perangkat:** frame kamera → CV pipeline (coco-ssd + IoU tracker + MediaPipe + Tesseract bila diperlukan) → mesin aturan → IndexedDB lokal. **Tidak ada upload.**
2. **Saat menyegel:** payload ringkas (lihat tabel field di atas) dikirim ke `/api/seal`. Frame disimpan/dirujuk lewat **hash**, bukan diunggah utuh.
3. **Saat verifikasi:** verifikator hanya mengambil **kunci publik** dari `/api/public-key`; pencocokan dilakukan lokal.

## Keamanan kriptografis

- Tanda tangan menggunakan **Ed25519** (pustaka `@noble/ed25519`), dengan **SHA-256** untuk hash payload kanonik.
- **Kunci privat (`DASHAI_SIGNING_KEY`) adalah satu-satunya rahasia** dan **tidak pernah meninggalkan server**.
- **Kunci publik dipublikasikan** di `/api/public-key`, sehingga verifikasi tidak perlu memercayai antarmuka dashAI.
- Penyerialan **kanonik** (kunci objek diurutkan secara rekursif) memastikan payload yang sama menghasilkan byte yang sama di klien maupun server — syarat agar hash dan tanda tangan stabil.

## Mengelola data lokal Anda

- Bukti yang belum disegel sepenuhnya berada di perangkat Anda dan dapat **dihapus** kapan saja (`deleteEvent`).
- Karena penyimpanan menggunakan IndexedDB peramban, **menghapus data situs/peramban** akan menghapus arsip lokal Anda. Pastikan Anda telah menyegel dan/atau mengunduh laporan untuk bukti penting sebelum membersihkan data.

---

# Batasan & disclaimer

> **Disclaimer.** dashAI adalah **demonstrasi teknologi**. Laporan yang dihasilkan **bukan** dokumen resmi kepolisian; sitasi pasal bersifat **indikatif**; dan estimasi kecepatan kendaraan lain bersifat **perkiraan**. Gunakan dengan tanggung jawab, dan **jangan mengoperasikan ponsel saat mengemudi**.

## Batasan penting yang harus dipahami

| Batasan | Penjelasan |
|---|---|
| **Tamper-evident, bukan tamper-proof** | Tanda tangan membuktikan isi laporan tidak berubah sejak disegel — **bukan** bahwa kamera menyaksikan realita. Karena frame berasal dari klien, peristiwa dapat dipalsukan (mis. merekam layar). |
| **Estimasi kecepatan pihak lain** | Hanya perkiraan (perubahan skala box + optical flow), ditandai `± est`. Kecepatan **diri sendiri** (GPS vs OSM) yang akurat. |
| **Deteksi live terbatas** | Hanya sebagian pelanggaran aktif live (lihat tabel Cakupan). Helm, pelat, lampu, sabuk, dan ponsel butuh model khusus / kamera kabin. |
| **Bergantung pada sinyal eksternal** | Akurasi `oneway`/`maxspeed` bergantung pada kelengkapan data OpenStreetMap di lokasi Anda; GPS bisa kurang akurat di area tertentu. |
| **Demo via ponsel** | Perangkat keras dashcam khusus dengan device attestation (Play Integrity / App Attest) direncanakan setelah tahap investor. |
| **Kunci DEV pada lingkungan tertentu** | Bila server memakai kunci pengembangan, laporan/verifikasi **tidak sah untuk pembuktian resmi** dan diberi penanda jelas. |

## Penggunaan yang bertanggung jawab

- **Jangan** menyentuh atau mengoperasikan ponsel saat berkendara — pasang perangkat pada dudukan dan mulai pemindaian sebelum berangkat.
- Perlakukan laporan dashAI sebagai **bahan pendukung**, bukan vonis. Keputusan hukum tetap kewenangan pihak berwenang.
- Hormati privasi orang lain; manfaatkan fitur blur dan jangan menyebarkan citra individu secara sembarangan.

## Provenans data hukum

Sitasi UU dalam dashAI **bukan halusinasi model**. Basis pengetahuan digenerate dari alur riset multi-agent dengan **verifikasi adversarial 3-voter** terhadap sumber resmi/terpercaya (mis. hukumonline, korlantas.polri.go.id, dishub, peraturan.bpk.go.id). Seluruh 12 sitasi berstatus **terverifikasi (`verified`)** dengan tingkat keyakinan **high**. Artefak riset tersimpan di `docs/research/phase0-research.json`.

---

# FAQ & troubleshooting

## Pertanyaan umum (FAQ)

**Apakah video saya dikirim ke server?**
Tidak. Analisis berjalan di perangkat dan bukti disimpan lokal di IndexedDB. Data baru meninggalkan perangkat **hanya** saat Anda menekan **Segel bukti** atau **Unduh Laporan**, dan yang dikirim adalah **payload ringkas** (gambar dirujuk lewat hash), bukan stream video.

**Apakah dashAI mengenali wajah orang?**
Tidak. dashAI hanya **mendeteksi** posisi wajah untuk di-blur. Tidak ada pengenalan/pencocokan identitas.

**Apakah laporan dashAI sah secara hukum?**
dashAI adalah demonstrasi teknologi; laporannya **bukan** dokumen resmi kepolisian dan sitasinya **indikatif**. Laporan dapat menjadi **bahan pendukung**, tetapi penilaian fakta tetap di tangan pihak berwenang.

**Apa beda "tamper-evident" dan "tamper-proof"?**
*Tamper-evident* berarti setiap perubahan **pasti terdeteksi** saat verifikasi. *Tamper-proof* (yang **tidak** dijanjikan dashAI) berarti tidak mungkin dipalsukan sama sekali. dashAI hanya menjamin yang pertama.

**Siapa yang bisa memverifikasi laporan saya?**
Siapa saja. Kunci publik tersedia di `/api/public-key`, dan halaman `/verify` melakukan pemeriksaan sepenuhnya di peramban tanpa memercayai server dashAI.

**Apakah saya butuh akun atau API key?**
Tidak. dashAI tidak membutuhkan akun maupun API key pihak ketiga.

**Mengapa kecepatan kendaraan lain ditandai "± est"?**
Karena itu **estimasi** dari penglihatan komputer, bukan pengukuran langsung. Hanya kecepatan **diri Anda** (GPS) yang akurat.

## Pemecahan masalah (troubleshooting)

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Pesan **"Butuh koneksi aman (HTTPS)"** | Situs dibuka lewat koneksi tidak aman | Buka via HTTPS (mis. `https://dashai-mu.vercel.app`) atau `localhost`. |
| Pesan **"Akses kamera ditolak"** | Izin kamera ditolak | Aktifkan izin kamera di pengaturan peramban untuk situs ini, lalu tekan **Mulai** lagi. |
| Pesan **"Kamera tidak tersedia"** | Tidak ada kamera atau sedang dipakai aplikasi lain | Tutup aplikasi lain yang memakai kamera; pastikan kamera berfungsi. |
| Pesan **"Gagal memuat model deteksi"** | Model gagal diunduh dari CDN | Periksa koneksi internet, lalu coba mulai ulang. Model deteksi objek bersifat wajib. |
| **SPD** dan **JLN** menampilkan `—` | Izin lokasi belum diberikan atau GPS lemah | Aktifkan izin lokasi; tunggu GPS terkunci. Fitur ini opsional dan tidak menghentikan pemindaian. |
| Indikator **FACE/POSE** abu-abu | Model opsional gagal/lambat dimuat | Tidak fatal — pemindaian tetap berjalan dengan model yang berhasil dimuat. |
| **FPS** rendah / perangkat panas | Beban CV pada perangkat | Wajar; dashAI sudah membatasi ke ~13 fps. Tutup tab lain dan pastikan ventilasi perangkat baik. |
| Banyak **false positive "melawan arah"** untuk pihak lain | Lalu lintas terlalu sepi untuk menentukan arus | Aturan butuh ≥ 3 kendaraan bergerak; deteksi akan stabil saat lalu lintas lebih ramai. |
| Pengamanan otomatis benturan tidak aktif | Sensor gerak ditolak (mis. iOS) atau tak didukung | Berikan izin sensor gerak saat menekan **Mulai**; sebagian perangkat tidak menyediakannya. |
| Verifikasi gagal: **"Parameter tautan rusak"** | URL/QR `?d=` terpotong atau berubah | Gunakan tautan/QR lengkap dari PDF, atau tempel JSON envelope secara manual. |
| Verifikasi menampilkan peringatan **DEV KEY** | Server memakai kunci pengembangan | Hasil tidak sah untuk pembuktian resmi; gunakan instans produksi (`prod-…`). |
| Arsip bukti kosong setelah membersihkan peramban | IndexedDB terhapus bersama data situs | Segel dan/atau unduh laporan untuk bukti penting sebelum membersihkan data peramban. |

## Butuh bantuan lebih lanjut

- Coba demo: **<https://dashai-mu.vercel.app>**
- Kode sumber & laporan isu: **<https://github.com/Finerium/dashAI>** (lisensi Apache-2.0)
- Pelaporan kerentanan keamanan: lihat `SECURITY.md` di repositori.
