---
title: "Rujukan Sitasi Hukum — UU No. 22 Tahun 2009 (LLAJ)"
subtitle: "dashAI — Saksi Mata Digital yang Netral & Tertandatangani"
author: "dashAI"
date: "2026-06-21"
lang: "id"
toc: true
numbersections: true
---

# Pendahuluan & Metodologi Verifikasi

## Tujuan dokumen

Dokumen ini adalah rujukan hukum kanonik untuk seluruh sitasi yang ditampilkan oleh dashAI. Setiap pelanggaran yang dideteksi sistem dipetakan ke satu pasal **Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan** (selanjutnya disebut **UU LLAJ** atau **UU 22/2009**). Tujuannya adalah memastikan bahwa setiap klaim hukum yang muncul di antarmuka, di panel *citation breakdown*, dan di dalam laporan PDF tertanda tangan **bukan hasil halusinasi model bahasa**, melainkan dasar hukum yang telah diverifikasi terhadap sumber resmi atau sumber hukum mapan.

Dokumen ini adalah cerminan satu-ke-satu dari basis pengetahuan (*knowledge base*) hukum yang dikodekan dalam berkas [`lib/legal/citations.ts`](lib/legal/citations.ts). Berkas tersebut **digenerate** dari keluaran terverifikasi alur kerja riset Phase-0 dan tidak boleh disunting secara manual; sumber kebenarannya adalah artefak riset [`docs/research/phase0-research.json`](docs/research/phase0-research.json). Setiap angka denda, durasi kurungan, nomor pasal, nomor ayat, dan bunyi pasal dalam dokumen ini diambil persis dari kedua berkas tersebut agar tidak terjadi *drift* antara dokumentasi dan kode produksi.

## Posisi sitasi dalam arsitektur bukti

dashAI memisahkan secara tegas antara **deteksi** (apa yang dilihat kamera) dan **kualifikasi hukum** (pasal apa yang relevan). Saat sebuah pelanggaran terkonfirmasi oleh mesin aturan, server menyalin sebuah *snapshot* hukum (struktur `LegalSnapshot` pada [`lib/evidence/types.ts`](lib/evidence/types.ts), berisi `uu`, `pasal`, `ayat`, dan `sanksi`) ke dalam `EvidencePayload`. *Snapshot* inilah—bukan teks bebas—yang ikut **disegel secara kriptografis** dengan Ed25519. Konsekuensinya: kualifikasi hukum yang melekat pada sebuah bukti menjadi **tamper-evident** (perubahan satu byte pun akan terdeteksi melalui ketidakcocokan hash), sama seperti pelat, kecepatan, dan lokasi.

Penting untuk dipahami: tanda tangan kriptografis membuktikan bahwa *snapshot* hukum **tidak berubah sejak disegel**; ia **tidak** membuktikan bahwa kualifikasi hukum tersebut pasti benar di pengadilan. Penilaian hukum akhir tetap menjadi kewenangan pihak berwenang. Lihat bagian [Disclaimer](#disclaimer-indikatif-bukan-nasihat-hukum).

## Metodologi verifikasi: pemungutan suara adversarial 3-pemilih

Seluruh sitasi diverifikasi melalui mekanisme **adversarial 3-voter** (pemungutan suara adversarial tiga pemilih) pada alur kerja riset multi-agent. Mekanisme ini dirancang untuk menekan risiko halusinasi—masalah yang melekat pada penggunaan model bahasa untuk klaim hukum—dengan memaksa kesepakatan independen lintas sumber sebelum sebuah sitasi diloloskan ke produksi.

Prinsip kerjanya:

1. **Klaim per pelanggaran.** Untuk setiap kunci pelanggaran (`ViolationKey`), sistem menyusun satu klaim hukum terstruktur: UU yang mengatur, nomor pasal, nomor ayat, bunyi pasal, ancaman pidana, denda maksimum, kurungan maksimum, dan pasal-pasal terkait.

2. **Verifikasi adversarial tiga pemilih.** Klaim tersebut diuji secara independen terhadap sumber-sumber hukum (resmi maupun mapan). Pendekatannya bersifat *adversarial*: pemilih tidak sekadar mencari konfirmasi, tetapi juga aktif mencari pertentangan, kesalahan nomor pasal/ayat, dan ketidaksesuaian nominal denda.

3. **Ambang konfirmasi.** Sebuah sitasi ditandai `verified: true` hanya bila memperoleh **3 (tiga) suara konfirmasi** (`confirm_votes: 3`) yang konvergen. Bila ditemukan pertentangan, koreksi dicatat pada larik `corrections` dan klaim tidak diloloskan apa adanya.

4. **Tingkat keyakinan (confidence).** Tipe `CitationConfidence` mengizinkan empat nilai: `high`, `medium`, `low`, dan `pending`. Hanya sitasi berstatus `high` dan terkonfirmasi penuh yang ditampilkan sebagai dasar hukum aktif.

5. **Jejak sumber.** Setiap sitasi menyimpan larik `sources` berisi tautan ke sumber yang dipakai untuk verifikasi (mis. `peraturan.bpk.go.id`, `dpr.go.id`, `id.wikisource.org`, `hukumonline.com`, `korlantas.polri.go.id`, situs Dinas Perhubungan daerah, dan portal Polri). Jejak ini memungkinkan audit ulang independen.

**Hasil akhir.** Dari 12 (dua belas) jenis pelanggaran dalam katalog dashAI, **seluruh 12 sitasi (12/12) berstatus terverifikasi** dengan `confidence: high`, `verified: true`, dan `confirm_votes: 3`, **tanpa koreksi** (`corrections: []`) pada satu pun entri. Angka `legal_verified_count` pada artefak riset bernilai **12**, konsisten dengan jumlah entri katalog.

> **Catatan provenans.** Karena `lib/legal/citations.ts` digenerate dari riset terverifikasi, dokumen ini memperlakukannya sebagai sumber kebenaran tunggal. Bila terjadi perbedaan antara dokumen ini dan kode, kode-lah yang otoritatif; dokumen harus diregenerasi, bukan kode yang disesuaikan dengan dokumen.

# Tabel Sitasi per Pelanggaran

Tabel berikut merangkum seluruh 12 pelanggaran dalam katalog dashAI beserta dasar hukumnya. Kolom **Tier** mengikuti taksonomi deteksi pada [`lib/legal/catalog.ts`](lib/legal/catalog.ts) (`core` / `secondary` / `cabin`). Kolom **Subjek** menunjukkan kepada siapa pelanggaran dapat ditujukan (`other` = kendaraan/pengendara lain; `self` = pemilik dashAI itu sendiri). Seluruh nominal dan durasi diambil persis dari `lib/legal/citations.ts`.

## Ringkasan: pasal, sanksi, dan status verifikasi

| # | Pelanggaran | Tier | Subjek | Pasal | Ayat | Denda maks. | Kurungan maks. | Verifikasi |
|---|-------------|------|--------|-------|------|-------------|----------------|------------|
| 1 | Melawan arah | core | other, self | Pasal 287 | ayat (1) | Rp500.000 | 2 bulan | ✓ 3/3 · high |
| 2 | Pengendara tanpa helm | core | other | Pasal 291 | ayat (1) | Rp250.000 | 1 bulan | ✓ 3/3 · high |
| 3 | Penumpang tanpa helm | secondary | other | Pasal 291 | ayat (2) | Rp250.000 | 1 bulan | ✓ 3/3 · high |
| 4 | Menerobos lampu merah | core | other, self | Pasal 287 | ayat (2) | Rp500.000 | 2 bulan | ✓ 3/3 · high |
| 5 | Melanggar marka/rambu | secondary | other, self | Pasal 287 | ayat (1) | Rp500.000 | 2 bulan | ✓ 3/3 · high |
| 6 | Boncengan lebih dari satu | core | other | Pasal 292 | — (jo. Ps. 106 ayat (9)) | Rp250.000 | 1 bulan | ✓ 3/3 · high |
| 7 | Melebihi batas kecepatan | core | other, self | Pasal 287 | ayat (5) | Rp500.000 | 2 bulan | ✓ 3/3 · high |
| 8 | Tanpa sabuk keselamatan | cabin | self | Pasal 289 | — (jo. Ps. 106 ayat (6)) | Rp250.000 | 1 bulan | ✓ 3/3 · high |
| 9 | Bermain ponsel saat berkendara | cabin | self | Pasal 283 | — (jo. Ps. 106 ayat (1)) | Rp750.000 | 3 bulan | ✓ 3/3 · high |
| 10 | Tanpa pelat nomor sah | secondary | other | Pasal 280 | — (jo. Ps. 68 ayat (1)) | Rp500.000 | 2 bulan | ✓ 3/3 · high |
| 11 | Tanpa lampu pada malam hari | secondary | other, self | Pasal 293 | ayat (1) | Rp250.000 | 1 bulan | ✓ 3/3 · high |
| 12 | Motor tanpa lampu di siang hari | secondary | other | Pasal 293 | ayat (2) | Rp100.000 | 15 hari | ✓ 3/3 · high |

**Catatan tabel:**

- Sanksi pada UU LLAJ untuk seluruh pelanggaran di atas bersifat **alternatif** (pidana kurungan **ATAU** denda), bukan kumulatif. Penegak hukum memilih salah satu, dan dalam praktik tilang lazimnya berupa denda.
- Untuk pasal yang tidak memiliki pembagian ayat (Pasal 280, Pasal 283, Pasal 289, Pasal 292), kolom **Ayat** diberi tanda "—" dan dilengkapi rujukan ke pasal kewajiban dasar (norma yang dilanggar). Lihat detail per pasal di bawah.
- Denda dan kurungan yang tercantum adalah **maksimum** (ancaman tertinggi), sesuai rumusan "paling lama" dan "paling banyak" dalam undang-undang.

## Cakupan deteksi vs. cakupan katalog

Status hukum (terverifikasi) tidak sama dengan status deteksi *live*. Seluruh 12 pelanggaran terkatalogkan dan tersitasi penuh, tetapi hanya sebagian yang dideteksi secara langsung oleh mesin aturan pada demo kamera ponsel saat ini. Berikut pemetaannya berdasarkan [`lib/violations/engine.ts`](lib/violations/engine.ts):

| Pelanggaran | Aktif live? | Basis deteksi |
|-------------|-------------|---------------|
| Melawan arah (other) | Ya | Analisis arah gerak objek terhadap arus dominan visual (butuh ≥ 3 kendaraan bergerak) |
| Melawan arah (self) | Ya | Fusi OSM `oneway` + heading GPS (selisih sudut > 120°) — akurat |
| Melebihi kecepatan (self) | Ya | Kecepatan GPS vs OSM `maxspeed` + margin 5 km/jam — **akurat** |
| Menerobos lampu merah (self) | Ya | Status lampu merah + kendaraan masih melaju (≥ 10 km/jam) |
| Boncengan lebih dari satu | Ya | ≥ 3 orang terdeteksi menempel pada satu track sepeda motor |
| Sisanya (helm, pelat, lampu, sabuk, ponsel, dll.) | Belum (dikatalogkan + demo) | Butuh model khusus (helm/pelat) atau kamera kabin (sabuk/ponsel) |

> **Disclaimer akurasi.** Estimasi kecepatan **kendaraan lain** bersifat **perkiraan** (estimasi dari perubahan skala bounding-box + optical flow, dengan rentang error) dan **tidak** boleh diperlakukan setara dengan kecepatan GPS diri sendiri yang akurat. Hanya pelanggaran kecepatan **diri sendiri** yang berbasis pengukuran GPS terhadap batas resmi OSM.

# Detail Tiap Pasal dengan Sumber Terverifikasi

Bagian ini memuat rincian per pasal: bunyi pasal (sesuai `bunyi` dalam knowledge base), ancaman pidana, pasal kewajiban dasar yang dirujuk, serta sumber verifikasi. Bunyi pasal dikutip persis sebagaimana tersimpan agar konsisten dengan apa yang ditampilkan dan disegel sistem.

## Pasal 287 ayat (1) — Melawan arah & Melanggar marka/rambu

**Pelanggaran:** Melawan arah (`lawan-arus`) dan Melanggar marka/rambu (`langgar-marka`). Keduanya bertumpu pada pasal yang sama.

**Bunyi pasal.** "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang melanggar aturan perintah atau larangan yang dinyatakan dengan Rambu Lalu Lintas sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf a atau Marka Jalan sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf b dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah)."

**Ancaman pidana.** Pidana kurungan paling lama 2 (dua) bulan **atau** denda paling banyak Rp500.000,00. Sifatnya alternatif (kurungan ATAU denda).

**Pasal kewajiban dasar (yang dirujuk):**

- Pasal 106 ayat (4) huruf a — kewajiban pengemudi mematuhi rambu perintah atau rambu larangan (dasar larangan melawan arah, mis. rambu larangan masuk / jalan satu arah).
- Pasal 106 ayat (4) huruf b — kewajiban mematuhi marka jalan (mis. marka arah lajur).

**Pasal terkait:** Pasal 287 ayat (2) (pelanggaran APILL); Pasal 287 ayat (3) (pelanggaran aturan gerakan lalu lintas atau tata cara berhenti/parkir — kurungan 1 bulan atau denda Rp250.000); Pasal 310 (bila mengakibatkan kecelakaan lalu lintas).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://kumparan.com/info-otomotif/pasal-287-uu-lalu-lintas-isinya-apa-1z4eFyksUVL>
- <https://dishub.kedirikota.go.id/uu-no-22-tahun-2009-tentang-llaj-pasal-106-ayat-4/>
- <https://korlantas.polri.go.id/jangan-lawan-arus-di-jalan-ini-aturan-sanksi-tegas-dan-dendanya/>
- <https://www.hukumonline.com/berita/a/nekat-melawan-arus-ingat-nyawa-dan-sanksi-ini-lt5bcdd167c3710/>
- <https://www.hukumonline.com/klinik/a/kena-e-tilang-karena-melawan-arus-lalu-lintas-lt5e4571a25e585/>
- <https://tirto.id/isi-denda-tilang-slip-biru-sesuai-pasal-287-ayat-1-uu-lalu-lintas-ehsc>
- <https://dishub.malangkota.go.id/wp-content/uploads/sites/16/2016/05/Undang-Undang-No.-22-tahun-2009-Tentang-Lalulintas.pdf>

## Pasal 287 ayat (2) — Menerobos lampu merah

**Pelanggaran:** Menerobos lampu merah (`terobos-lampu-merah`).

**Bunyi pasal.** "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang melanggar aturan perintah atau larangan yang dinyatakan dengan Alat Pemberi Isyarat Lalu Lintas sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf c dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah)." Alat Pemberi Isyarat Lalu Lintas (APILL) mencakup lampu lalu lintas (lampu merah); Pasal 106 ayat (4) huruf c mewajibkan setiap pengemudi mematuhi APILL.

**Ancaman pidana.** Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00.

**Pasal kewajiban dasar & terkait:** Pasal 106 ayat (4) huruf c (kewajiban mematuhi APILL); Pasal 287 ayat (1) (rambu/marka); Pasal 1 angka 19 (definisi APILL); Pasal 104 ayat (1) (pengecualian dalam keadaan tertentu/darurat atas perintah petugas).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://peraturan.bpk.go.id/Download/27961/UU%20Nomor%2022%20Tahun%202009.pdf>
- <https://www.dpr.go.id/dokjdih/document/uu/UU_2009_22.pdf>
- <https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_22_Tahun_2009>
- <https://dishub.kedirikota.go.id/uu-no-22-tahun-2009-tentang-llaj-pasal-106-ayat-4/>
- <https://tirto.id/isi-denda-tilang-slip-biru-sesuai-pasal-287-ayat-1-uu-lalu-lintas-ehsc>
- <https://kumparan.com/info-otomotif/pasal-287-uu-lalu-lintas-isinya-apa-1z4eFyksUVL>

## Pasal 287 ayat (5) — Melebihi batas kecepatan

**Pelanggaran:** Melebihi batas kecepatan (`melebihi-kecepatan`).

**Bunyi pasal.** "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang melanggar aturan batas kecepatan paling tinggi atau paling rendah sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf g atau Pasal 115 huruf a dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah)."

**Ancaman pidana.** Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00.

**Pasal kewajiban dasar & terkait:** Pasal 106 ayat (4) huruf g (kewajiban mematuhi ketentuan kecepatan maksimal/minimal); Pasal 115 huruf a (larangan melebihi batas kecepatan tertinggi); Pasal 21 (dasar penetapan batas kecepatan secara nasional).

**Catatan implementasi.** Untuk subjek **diri sendiri**, dashAI membandingkan kecepatan GPS terhadap `maxspeed` OSM dengan margin 5 km/jam (akurat). Untuk **kendaraan lain**, kecepatan adalah **estimasi**.

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://pelayanan.jakarta.go.id/download/regulasi/undang-undang-nomor-22-tahun-2009-tentang-lalu-lintas-dan-angkutan-jalan.pdf>
- <https://dishub.malangkota.go.id/wp-content/uploads/sites/16/2016/05/Undang-Undang-No.-22-tahun-2009-Tentang-Lalulintas.pdf>
- <https://m.facebook.com/DivHumasPolri/photos/pasal-287-ayat-5-uullaj-no-22-th-2009-setiap-orang-yang-mengemudikan-kendaraan-b/586431204719073/>
- <https://pid.kepri.polri.go.id/hukum-mengemudikan-kendaraan-melebihi-batas-kecepatan/>

## Pasal 291 ayat (1) — Pengendara tanpa helm

**Pelanggaran:** Pengendara tanpa helm (`tanpa-helm`).

**Bunyi pasal.** "Setiap orang yang mengemudikan Sepeda Motor tidak mengenakan helm standar nasional Indonesia sebagaimana dimaksud dalam Pasal 106 ayat (8) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah)." Kewajiban dasarnya diatur dalam Pasal 106 ayat (8): "Setiap orang yang mengemudikan Sepeda Motor dan Penumpang Sepeda Motor wajib mengenakan helm yang memenuhi standar nasional Indonesia."

**Ancaman pidana.** Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00. Sanksi bersifat alternatif (kurungan ATAU denda).

**Pasal kewajiban dasar & terkait:** Pasal 106 ayat (8) (kewajiban helm SNI bagi pengemudi & penumpang); Pasal 291 ayat (2) (pengemudi yang membiarkan penumpang tanpa helm); Pasal 57 ayat (1) dan (2) (helm SNI sebagai perlengkapan wajib sepeda motor).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://www.hukumonline.com/klinik/a/undang--undang-yang-mengatur-penggunaan-helm-standar-kendaraan-roda-dua-cl4957/>
- <https://www.medcom.id/otomotif/tips-otomotif/Rkj1e4Qb-helm-wajib-digunakan-pengendara-motor-ini-dasar-hukum-dan-sanksinya>
- <https://otomotif.kompas.com/read/2023/12/07/101200015/tidak-menggunakan-helm-saat-naik-motor-bisa-kena-tilang-rp-250.000>
- <https://tribratanews.kepri.polri.go.id/2021/06/17/penggunaan-helm-standar-yang-diatur-dalam-uu-lalu-lintas-dan-angkutan-jalan-2/>
- <https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/penumpang-motor-nggak-pakai-helm-bisa-dipidana-pasal-291-ayat-2-/>

## Pasal 291 ayat (2) — Penumpang tanpa helm

**Pelanggaran:** Penumpang tanpa helm (`penumpang-tanpa-helm`).

**Bunyi pasal.** "Setiap orang yang mengemudikan Sepeda Motor yang membiarkan penumpangnya tidak mengenakan helm sebagaimana dimaksud dalam Pasal 106 ayat (8) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah)."

**Ancaman pidana.** Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00.

**Catatan subjek hukum.** Subjek yang dipidana adalah **pengemudi** yang membiarkan penumpangnya tidak berhelm, **bukan** penumpang itu sendiri.

**Pasal kewajiban dasar & terkait:** Pasal 106 ayat (8) (kewajiban helm SNI bagi pengemudi & penumpang); Pasal 291 ayat (1) (pengemudi sendiri tanpa helm); Pasal 57 ayat (2) (helm SNI sebagai perlengkapan wajib).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://www.hukumonline.com/klinik/a/undang--undang-yang-mengatur-penggunaan-helm-standar-kendaraan-roda-dua-cl4957/>
- <https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/penumpang-motor-nggak-pakai-helm-bisa-dipidana-pasal-291-ayat-2-/>
- <https://humas.polri.go.id/news/detail/2331476-kepatuhan-berkendara-pengendara-wajib-gunakan-helm-sesuai-uullaj-pasal-106-ayat-8>
- <https://otomotif.kompas.com/read/2021/09/13/141200515/pengendara-motor-tidak-pakai-helm-sni-bisa-didenda-rp-250.000-ini-aturannya>
- <https://pid.kepri.polri.go.id/penggunaan-helm-standar-yang-diatur-dalam-uu-lalu-lintas-dan-angkutan-jalan-2/>

## Pasal 292 (jo. Pasal 106 ayat (9)) — Boncengan lebih dari satu

**Pelanggaran:** Boncengan lebih dari satu (`boncengan-lebih`).

**Bunyi pasal.** Pasal 292: "Setiap orang yang mengemudikan Sepeda Motor tanpa kereta samping yang mengangkut Penumpang lebih dari 1 (satu) orang sebagaimana dimaksud dalam Pasal 106 ayat (9) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah)." Larangan dasar pada Pasal 106 ayat (9): "Setiap orang yang mengemudikan Sepeda Motor tanpa kereta samping dilarang membawa Penumpang lebih dari 1 (satu) orang."

**Ancaman pidana.** Pidana kurungan paling lama 1 (satu) bulan ATAU denda paling banyak Rp250.000,00.

**Catatan struktur.** Pasal 292 adalah **pasal tunggal tanpa pembagian ayat**; pada knowledge base, kolom `ayat` mencantumkan rujukan ke larangan di Pasal 106 ayat (9).

**Pasal kewajiban dasar & terkait:** Pasal 106 ayat (9) (larangan membawa > 1 penumpang pada motor tanpa kereta samping); Pasal 106 ayat (1) (kewajiban mengemudi dengan penuh konsentrasi); Pasal 291 (helm SNI — sering melengkapi penindakan "bonceng tiga").

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://www.basishukum.com/uu/22/2009/XX/292?m=d>
- <https://polreskudus.com/2024/11/28/jangan-boncengan-lebih-dari-satu-pasal-292/>
- <https://www.hukumonline.com/klinik/a/undang--undang-yang-mengatur-penggunaan-helm-standar-kendaraan-roda-dua-cl4957/>
- <https://otomotif.kompas.com/read/2024/02/05/111200015/bonceng-penumpang-motor-lebih-dari-1-orang-bisa-kena-denda-rp-250.000>
- <https://www.researchgate.net/publication/398323920_Implementasi_Pasal_106_Ayat_9_dan_Sanksi_Pasal_292_UU_LLAJ_terhadap_Pelanggaran_Bonceng_Tiga>
- <https://tribratanews.gunungkidul.jogja.polri.go.id/read/pasal-tilang-dan-daftar-denda-pelanggaran-lalu-lintas>

## Pasal 289 (jo. Pasal 106 ayat (6)) — Tanpa sabuk keselamatan

**Pelanggaran:** Tanpa sabuk keselamatan (`tanpa-sabuk`). Tier `cabin` — andal hanya dengan kamera kabin (driver monitoring).

**Bunyi pasal.** Pasal 289: "Setiap orang yang mengemudikan Kendaraan Bermotor atau Penumpang yang duduk di samping Pengemudi yang tidak mengenakan sabuk keselamatan sebagaimana dimaksud dalam Pasal 106 ayat (6) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah)." Kewajiban dasarnya, Pasal 106 ayat (6): "Setiap orang yang mengemudikan Kendaraan Bermotor beroda empat atau lebih di Jalan dan Penumpang yang duduk di sampingnya wajib mengenakan sabuk keselamatan."

**Ancaman pidana.** Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00. Sanksi bersifat alternatif.

**Catatan struktur.** Pasal 289 adalah pasal tunggal (tanpa pembagian ayat) yang merujuk kewajiban Pasal 106 ayat (6).

**Pasal kewajiban dasar & terkait:** Pasal 106 ayat (6) (kewajiban sabuk bagi pengemudi roda empat+ dan penumpang di sampingnya); Pasal 106 ayat (1) (mengemudi wajar & penuh konsentrasi); Pasal 57 ayat (2) dan (3) (sabuk sebagai persyaratan teknis kendaraan).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://www.hukumonline.com/klinik/a/aturan-sabuk-keselamatan-untuk-pengemudi-dan-penumpang-mobil-lt5d3a9d9aa4ce4/>
- <https://polrespangandaran.id/intelkam/mengupas-tuntas-kewajiban-pengendara-dan-penumpang-berdasarkan-uu-no-22-tahun-2009/>
- <https://polreskudus.com/2024/01/30/berkendara-roda-empat-ke-atas-wajib-menggunakan-sabuk-keselamatan/>
- <https://www.toyota.astra.co.id/toyota-connect/news/aturan-penggunaan-sabuk-pengaman-mobil-wajib-untuk-penumpang-depan-dan-ada-denda-jika-kamu-lalai>
- <https://peraturan.bpk.go.id/Details/38654/uu-no-22-tahun-2009>

## Pasal 283 (jo. Pasal 106 ayat (1)) — Bermain ponsel saat berkendara

**Pelanggaran:** Bermain ponsel saat berkendara (`main-hp`). Tier `cabin`.

**Bunyi pasal.** Pasal 283: "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan secara tidak wajar dan melakukan kegiatan lain atau dipengaruhi oleh suatu keadaan yang mengakibatkan gangguan konsentrasi dalam mengemudi di Jalan sebagaimana dimaksud dalam Pasal 106 ayat (1) dipidana dengan pidana kurungan paling lama 3 (tiga) bulan atau denda paling banyak Rp750.000,00 (tujuh ratus lima puluh ribu rupiah)." Pasal 106 ayat (1) mewajibkan mengemudi dengan wajar dan penuh konsentrasi. **Penjelasan** Pasal 106 ayat (1) secara eksplisit menyebut "menggunakan telepon" sebagai hal yang mengganggu konsentrasi — inilah dasar penjeratan penggunaan telepon genggam saat mengemudi melalui Pasal 283.

**Ancaman pidana.** Pidana kurungan paling lama 3 (tiga) bulan atau denda paling banyak Rp750.000,00. Sifat ancaman alternatif (kurungan ATAU denda). Ini adalah ancaman pidana **tertinggi** di antara seluruh pelanggaran dalam katalog dashAI.

**Catatan struktur.** Pasal 283 adalah pasal tunggal (tanpa ayat); knowledge base menuliskan dasar hukum sebagai "Pasal 283 jo. Pasal 106 ayat (1)".

**Pasal kewajiban dasar & terkait:** Pasal 106 ayat (1) (mengemudi wajar & penuh konsentrasi); Penjelasan Pasal 106 ayat (1) (definisi "penuh konsentrasi" yang menyebut "menggunakan telepon"); Pasal 310 (bila kelalaian akibat distraksi menyebabkan kecelakaan); Pasal 311 (mengemudi sengaja dengan cara membahayakan nyawa/barang).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://www.hukumonline.com/berita/a/penggunaan-telepon-dua-arah-saat-berkendara-ganggu-konsentrasi-lt5af55908c04be/>
- <https://jdih.sukoharjokab.go.id/berita/detail/benarkah-menggunakan-gps-saat-berkendara-bisa-dipidana>
- <https://m.tribunnews.com/nasional/2021/12/28/berkendara-sambil-bermain-ponsel-melanggar-uu-llaj-bisa-dipenjara-atau-didenda-ini-penjelasannya?page=all>
- <https://www.tribratakutim.com/berita-terkini/vigilansi-tanpa-distraksi-penegakan-pasal-283-uu-llaj-dalam-menjaga-konsentrasi-mudik-2026/188716.html>

## Pasal 280 (jo. Pasal 68 ayat (1)) — Tanpa pelat nomor sah

**Pelanggaran:** Tanpa pelat nomor sah (`tanpa-plat`).

**Bunyi pasal.** Pasal 280: "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang tidak dipasangi Tanda Nomor Kendaraan Bermotor yang ditetapkan oleh Kepolisian Negara Republik Indonesia sebagaimana dimaksud dalam Pasal 68 ayat (1) dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah)." Pasal 68 ayat (1): "Setiap Kendaraan Bermotor yang dioperasikan di Jalan wajib dilengkapi dengan Surat Tanda Nomor Kendaraan Bermotor dan Tanda Nomor Kendaraan Bermotor."

**Ancaman pidana.** Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00.

**Catatan struktur.** Pasal 280 adalah pasal tunggal (tanpa ayat) yang merujuk kewajiban Pasal 68 ayat (1).

**Pasal kewajiban dasar & terkait:** Pasal 68 ayat (1) (kewajiban STNK + TNKB); Pasal 64 ayat (1) (kewajiban registrasi kendaraan); PP No. 80 Tahun 2012 dan Perpol/Perkap tentang Registrasi & Identifikasi (spesifikasi TNKB yang sah); Pasal 288 ayat (1) (tidak dapat menunjukkan STNK — objek berbeda).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://peraturan.bpk.go.id/Download/27961/UU%20Nomor%2022%20Tahun%202009.pdf>
- <https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_22_Tahun_2009>
- <https://korlantas.polri.go.id/2026-06-05-operasi-patuh-2026-incar-pelat-nomor-tak-sesuai-aturan-ini-risikonya/>
- <https://humas.polri.go.id/news/detail/2411713-operasi-patuh-2026-incar-pelat-nomor-tak-sesuai-aturan-ini-risikonya>
- <https://www.hukumonline.com/klinik/a/tidak-pasang-pelat-nomor-karena-baut-copot--tetap-ditilang-lt5c6a634abd98d/>

## Pasal 293 ayat (1) (jo. Pasal 107 ayat (1)) — Tanpa lampu pada malam hari

**Pelanggaran:** Tanpa lampu pada malam hari (`tanpa-lampu-malam`).

**Bunyi pasal.** "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan tanpa menyalakan lampu utama pada malam hari dan kondisi tertentu sebagaimana dimaksud dalam Pasal 107 ayat (1) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah)."

**Ancaman pidana.** Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00.

**Pasal kewajiban dasar & terkait:** Pasal 107 ayat (1) (kewajiban menyalakan lampu utama pada malam hari & kondisi tertentu); Pasal 107 ayat (2) (kewajiban lampu utama sepeda motor pada siang hari); Pasal 293 ayat (2) (sanksi motor tanpa lampu siang).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://www.hukumonline.com/klinik/a/dasar-hukum-kewajiban-menyalakan-lampu-kendaraan-pada-siang-hari-lt52458947a935d/>
- <https://www.pn-tamianglayang.go.id/denda-tilang/>
- <https://pid.kepri.polri.go.id/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari/>
- <https://news.detik.com/berita/d-6220055/viral-pemotor-protes-ditilang-tak-nyalakan-lampu-utama-ini-aturannya>
- <https://www.cnnindonesia.com/otomotif/20220810173453-595-833000/lampu-utama-motor-mati-siang-hari-ditilang-berikut-aturannya>
- <https://dishub.malangkota.go.id/wp-content/uploads/sites/16/2016/05/Undang-Undang-No.-22-tahun-2009-Tentang-Lalulintas.pdf>

## Pasal 293 ayat (2) (jo. Pasal 107 ayat (2)) — Motor tanpa lampu di siang hari

**Pelanggaran:** Motor tanpa lampu di siang hari (`motor-lampu-siang`).

**Bunyi pasal.** Pasal 107 ayat (2): "Pengemudi Sepeda Motor selain mematuhi ketentuan sebagaimana dimaksud pada ayat (1) wajib menyalakan lampu utama pada siang hari." Pasal 293 ayat (2): "Setiap orang yang mengemudikan Sepeda Motor di Jalan tanpa menyalakan lampu utama pada siang hari sebagaimana dimaksud dalam Pasal 107 ayat (2) dipidana dengan pidana kurungan paling lama 15 (lima belas) hari atau denda paling banyak Rp100.000,00 (seratus ribu rupiah)."

**Ancaman pidana.** Pidana kurungan paling lama 15 (lima belas) hari atau denda paling banyak Rp100.000,00. Ini adalah ancaman pidana **teringan** dalam katalog (severity 1).

**Pasal kewajiban dasar & terkait:** Pasal 107 ayat (1) (lampu malam & kondisi tertentu); Pasal 107 ayat (2) (lampu utama motor siang hari); Pasal 293 ayat (1) (sanksi tanpa lampu malam).

**Sumber terverifikasi (3/3 konfirmasi):**

- <https://www.cnnindonesia.com/otomotif/20220810173453-595-833000/lampu-utama-motor-mati-siang-hari-ditilang-berikut-aturannya>
- <https://otomotif.kompas.com/read/2022/01/29/173200715/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari>
- <https://www.hukumonline.com/klinik/a/dasar-hukum-kewajiban-menyalakan-lampu-kendaraan-pada-siang-hari-lt52458947a935d/>
- <https://www.hukumonline.com/berita/a/menguji-konstitusionalitas-aturan-nyalakan-lampu-motor-siang-hari-lt5e3a2e97a09ce/>
- <https://pid.kepri.polri.go.id/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari/>

# Catatan: Peningkatan ke Pasal 310/311 bila Terjadi Kecelakaan

Pasal-pasal sanksi pelanggaran yang dipetakan di atas (Pasal 280, 283, 287, 289, 291, 292, 293) berlaku untuk pelanggaran **murni administratif/perilaku** yang **tidak** mengakibatkan kecelakaan. Bila perilaku yang sama menyebabkan **kecelakaan lalu lintas** dengan korban atau kerusakan, kualifikasi hukum **meningkat** ke ketentuan pidana yang jauh lebih berat, yaitu **Pasal 310** (kelalaian/kealpaan) dan/atau **Pasal 311** (kesengajaan membahayakan).

## Mengapa peningkatan ini relevan untuk dashAI

dashAI bersifat **dwi-subjek**: ia menindak pelanggar lain **dan** melindungi pemiliknya. Dalam skenario kecelakaan, bukti tersegel dashAI bisa menjadi:

- **Memberatkan** (jenis laporan `kecelakaan` / `tilang`): merekam perilaku pihak lain yang lalai/sengaja membahayakan sehingga relevan dengan Pasal 310/311.
- **Meringankan / ekskulpatori** (perlindungan pemilik): membuktikan pemilik berkendara wajar, dalam batas kecepatan (kecepatan GPS akurat), dan di arah yang sah (fusi OSM `oneway`) — bukti netral untuk menangkis fitnah "katanya-katanya".

Karena itu, pasal-pasal peningkatan telah dicatat sebagai `relatedArticles` pada beberapa entri knowledge base (mis. `lawan-arus` dan `main-hp` merujuk Pasal 310; `main-hp` juga merujuk Pasal 311).

## Garis besar Pasal 310 (kelalaian/kealpaan)

Pasal 310 menjerat pengemudi yang **karena kelalaiannya** mengakibatkan kecelakaan lalu lintas, dengan gradasi sanksi yang naik seiring tingkat keparahan akibat:

| Akibat kecelakaan | Garis besar ancaman (Pasal 310) |
|-------------------|---------------------------------|
| Kerusakan kendaraan dan/atau barang | Ancaman ringan (penjara/denda relatif kecil) |
| Korban luka ringan + kerusakan | Ancaman menengah |
| Korban luka berat | Penjara hingga 5 (lima) tahun dan/atau denda hingga Rp10.000.000,00 |
| Korban meninggal dunia | Penjara hingga 6 (enam) tahun dan/atau denda hingga Rp12.000.000,00 (Pasal 310 ayat (4)) |

Nilai pada baris "luka berat" dan "meninggal" konsisten dengan catatan `relatedArticles` pada entri `lawan-arus` di knowledge base, yang menyebut peningkatan ke Pasal 310: "pidana penjara hingga 6 tahun dan/atau denda hingga Rp12.000.000 (ayat 4, korban meninggal)".

## Garis besar Pasal 311 (kesengajaan membahayakan)

Pasal 311 menjerat pengemudi yang **dengan sengaja** mengemudikan kendaraan dengan cara atau keadaan yang **membahayakan** nyawa atau barang. Ancamannya lebih berat daripada Pasal 310 untuk akibat yang setara, karena unsur **kesengajaan** (bukan sekadar kelalaian). dashAI mencatat Pasal 311 sebagai pasal terkait pada `main-hp` (distraksi ponsel yang disengaja dapat dikualifikasikan sebagai mengemudi membahayakan).

> **Catatan penting.** Penentuan apakah suatu peristiwa termasuk "kecelakaan", tingkat keparahan korban, serta apakah unsurnya **kelalaian** (Pasal 310) atau **kesengajaan** (Pasal 311), adalah penilaian hukum yang **berada di luar kemampuan deteksi otomatis dashAI**. dashAI hanya menyediakan bukti tersegel; kualifikasi peningkatan ke Pasal 310/311 adalah kewenangan penyidik dan pengadilan. Sanksi dan nominal rinci Pasal 310/311 **tidak** termasuk dalam knowledge base sitasi yang diverifikasi 3-voter (yang diverifikasi adalah 12 pasal pelanggaran utama); garis besar di atas bersifat **indikatif** dan harus dikonfirmasi langsung ke teks UU 22/2009.

# Disclaimer (Indikatif, Bukan Nasihat Hukum)

1. **Bukan nasihat hukum.** Seluruh isi dokumen ini, termasuk pemetaan pelanggaran ke pasal, nominal denda, dan durasi kurungan, bersifat **indikatif** dan **edukatif**. Dokumen ini **bukan** nasihat hukum dan tidak menggantikan konsultasi dengan penasihat hukum yang berkompeten maupun keputusan pihak berwenang.

2. **Bukan dokumen resmi kepolisian.** dashAI adalah **demonstrasi teknologi**. Laporan PDF yang dihasilkannya **bukan** dokumen resmi kepolisian, bukan surat tilang resmi, dan tidak memiliki kekuatan eksekusi administratif. Sitasi yang ditampilkan bersifat indikatif.

3. **Tamper-evident, bukan tamper-proof.** Tanda tangan Ed25519 membuktikan bahwa payload bukti (termasuk *snapshot* hukum) **tidak berubah** sejak disegel server pada waktu tertera. Tanda tangan **tidak** membuktikan bahwa kamera benar-benar menyaksikan peristiwa fisik di dunia nyata (frame berasal dari klien). dashAI dengan jujur bersifat **tamper-evident**, **bukan tamper-proof**.

4. **Keterbatasan demo & akurasi.** Saat ini dashAI berjalan sebagai demo melalui kamera ponsel. Hanya sebagian pelanggaran yang dideteksi *live*. Estimasi kecepatan **kendaraan lain** adalah **perkiraan** dengan rentang error; hanya kecepatan **diri sendiri** (GPS vs OSM `maxspeed`) yang akurat. Deteksi tidak menjamin tertangkapnya seluruh pelanggaran maupun nihilnya hasil positif palsu.

5. **Privasi & PDP.** dashAI menerapkan *privacy-by-design*: **deteksi** wajah (bukan **pengenalan** identitas), blur secara default, dan penyimpanan lokal (IndexedDB) lebih dulu; server hanya menerima payload yang **secara eksplisit** Anda segel. Pendekatan ini selaras dengan semangat **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (PDP)**.

6. **Dinamika hukum.** UU dan peraturan pelaksana dapat berubah, demikian pula praktik penegakan. Nominal denda yang tercantum adalah ancaman **maksimum** menurut UU 22/2009 dan dapat berbeda dari denda yang benar-benar dijatuhkan. Selalu rujuk teks resmi UU 22/2009 dan peraturan terbaru.

7. **Tanggung jawab penggunaan.** Jangan mengoperasikan ponsel saat mengemudi. Gunakan dashAI dengan tanggung jawab; pengguna bertanggung jawab atas cara mereka memakai bukti yang dihasilkan.

# Daftar Sumber

## Sumber primer (teks resmi UU 22/2009)

- Database Peraturan BPK RI — UU Nomor 22 Tahun 2009 (PDF teks lengkap): <https://peraturan.bpk.go.id/Download/27961/UU%20Nomor%2022%20Tahun%202009.pdf>
- Halaman detail BPK RI — UU No. 22 Tahun 2009: <https://peraturan.bpk.go.id/Details/38654/uu-no-22-tahun-2009>
- JDIH DPR RI — UU 22/2009 (PDF): <https://www.dpr.go.id/dokjdih/document/uu/UU_2009_22.pdf>
- Wikisource — Undang-Undang Republik Indonesia Nomor 22 Tahun 2009: <https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_22_Tahun_2009>
- Salinan UU 22/2009 (Dishub Kota Malang, PDF): <https://dishub.malangkota.go.id/wp-content/uploads/sites/16/2016/05/Undang-Undang-No.-22-tahun-2009-Tentang-Lalulintas.pdf>
- Salinan UU 22/2009 (Pelayanan DKI Jakarta, PDF): <https://pelayanan.jakarta.go.id/download/regulasi/undang-undang-nomor-22-tahun-2009-tentang-lalu-lintas-dan-angkutan-jalan.pdf>

## Sumber resmi kepolisian / pemerintah

- Korlantas Polri — Operasi Patuh 2026 (pelat nomor): <https://korlantas.polri.go.id/2026-06-05-operasi-patuh-2026-incar-pelat-nomor-tak-sesuai-aturan-ini-risikonya/>
- Korlantas Polri — Larangan melawan arus & sanksi: <https://korlantas.polri.go.id/jangan-lawan-arus-di-jalan-ini-aturan-sanksi-tegas-dan-dendanya/>
- Humas Polri — Kewajiban helm (Pasal 106 ayat (8)): <https://humas.polri.go.id/news/detail/2331476-kepatuhan-berkendara-pengendara-wajib-gunakan-helm-sesuai-uullaj-pasal-106-ayat-8>
- Humas Polri — Operasi Patuh 2026 (pelat nomor): <https://humas.polri.go.id/news/detail/2411713-operasi-patuh-2026-incar-pelat-nomor-tak-sesuai-aturan-ini-risikonya>
- Tribrata News Kepri Polri — Penggunaan helm standar: <https://tribratanews.kepri.polri.go.id/2021/06/17/penggunaan-helm-standar-yang-diatur-dalam-uu-lalu-lintas-dan-angkutan-jalan-2/>
- PID Kepri Polri — Helm standar: <https://pid.kepri.polri.go.id/penggunaan-helm-standar-yang-diatur-dalam-uu-lalu-lintas-dan-angkutan-jalan-2/>
- PID Kepri Polri — Lampu utama motor siang hari: <https://pid.kepri.polri.go.id/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari/>
- PID Kepri Polri — Melebihi batas kecepatan: <https://pid.kepri.polri.go.id/hukum-mengemudikan-kendaraan-melebihi-batas-kecepatan/>
- Polres Kudus — Boncengan lebih dari satu (Pasal 292): <https://polreskudus.com/2024/11/28/jangan-boncengan-lebih-dari-satu-pasal-292/>
- Polres Kudus — Wajib sabuk keselamatan roda empat+: <https://polreskudus.com/2024/01/30/berkendara-roda-empat-ke-atas-wajib-menggunakan-sabuk-keselamatan/>
- Polres Pangandaran — Kewajiban pengendara & penumpang menurut UU 22/2009: <https://polrespangandaran.id/intelkam/mengupas-tuntas-kewajiban-pengendara-dan-penumpang-berdasarkan-uu-no-22-tahun-2009/>
- Tribrata Kutim — Penegakan Pasal 283 (distraksi ponsel): <https://www.tribratakutim.com/berita-terkini/vigilansi-tanpa-distraksi-penegakan-pasal-283-uu-llaj-dalam-menjaga-konsentrasi-mudik-2026/188716.html>
- Tribrata News Gunungkidul — Daftar pasal tilang & denda: <https://tribratanews.gunungkidul.jogja.polri.go.id/read/pasal-tilang-dan-daftar-denda-pelanggaran-lalu-lintas>
- Dishub Kota Kediri — UU 22/2009 Pasal 106 ayat (4): <https://dishub.kedirikota.go.id/uu-no-22-tahun-2009-tentang-llaj-pasal-106-ayat-4/>
- JDIH Kabupaten Sukoharjo — GPS/telepon saat berkendara: <https://jdih.sukoharjokab.go.id/berita/detail/benarkah-menggunakan-gps-saat-berkendara-bisa-dipidana>
- PN Tamiang Layang — Daftar denda tilang: <https://www.pn-tamianglayang.go.id/denda-tilang/>

## Sumber hukum mapan & media

- Hukumonline — Helm standar kendaraan roda dua: <https://www.hukumonline.com/klinik/a/undang--undang-yang-mengatur-penggunaan-helm-standar-kendaraan-roda-dua-cl4957/>
- Hukumonline — Melawan arus & sanksi: <https://www.hukumonline.com/berita/a/nekat-melawan-arus-ingat-nyawa-dan-sanksi-ini-lt5bcdd167c3710/>
- Hukumonline — E-tilang melawan arus: <https://www.hukumonline.com/klinik/a/kena-e-tilang-karena-melawan-arus-lalu-lintas-lt5e4571a25e585/>
- Hukumonline — Sabuk keselamatan pengemudi & penumpang: <https://www.hukumonline.com/klinik/a/aturan-sabuk-keselamatan-untuk-pengemudi-dan-penumpang-mobil-lt5d3a9d9aa4ce4/>
- Hukumonline — Telepon dua arah saat berkendara: <https://www.hukumonline.com/berita/a/penggunaan-telepon-dua-arah-saat-berkendara-ganggu-konsentrasi-lt5af55908c04be/>
- Hukumonline — Pelat nomor copot tetap ditilang: <https://www.hukumonline.com/klinik/a/tidak-pasang-pelat-nomor-karena-baut-copot--tetap-ditilang-lt5c6a634abd98d/>
- Hukumonline — Kewajiban lampu kendaraan siang hari: <https://www.hukumonline.com/klinik/a/dasar-hukum-kewajiban-menyalakan-lampu-kendaraan-pada-siang-hari-lt52458947a935d/>
- Hukumonline — Konstitusionalitas lampu motor siang hari: <https://www.hukumonline.com/berita/a/menguji-konstitusionalitas-aturan-nyalakan-lampu-motor-siang-hari-lt5e3a2e97a09ce/>
- Basis Hukum — Pasal 292 UU 22/2009: <https://www.basishukum.com/uu/22/2009/XX/292?m=d>
- Kompas Otomotif — Tidak pakai helm bisa kena tilang: <https://otomotif.kompas.com/read/2023/12/07/101200015/tidak-menggunakan-helm-saat-naik-motor-bisa-kena-tilang-rp-250.000>
- Kompas Otomotif — Penumpang motor tanpa helm SNI: <https://otomotif.kompas.com/read/2021/09/13/141200515/pengendara-motor-tidak-pakai-helm-sni-bisa-didenda-rp-250.000-ini-aturannya>
- Kompas Otomotif — Bonceng > 1 orang: <https://otomotif.kompas.com/read/2024/02/05/111200015/bonceng-penumpang-motor-lebih-dari-1-orang-bisa-kena-denda-rp-250.000>
- Kompas Otomotif — Lampu utama motor siang hari: <https://otomotif.kompas.com/read/2022/01/29/173200715/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari>
- CNN Indonesia — Lampu utama motor mati siang hari: <https://www.cnnindonesia.com/otomotif/20220810173453-595-833000/lampu-utama-motor-mati-siang-hari-ditilang-berikut-aturannya>
- Detik News — Tidak nyalakan lampu utama: <https://news.detik.com/berita/d-6220055/viral-pemotor-protes-ditilang-tak-nyalakan-lampu-utama-ini-aturannya>
- Detik Oto — Lawan arus & denda: <https://oto.detik.com/catatan-pengendara-motor/d-6043570/masih-nekat-lawan-arus-siap-siap-denda-rp-500-ribu>
- Kumparan — Isi Pasal 287 UU Lalu Lintas: <https://kumparan.com/info-otomotif/pasal-287-uu-lalu-lintas-isinya-apa-1z4eFyksUVL>
- Tirto — Denda tilang slip biru sesuai Pasal 287 ayat (1): <https://tirto.id/isi-denda-tilang-slip-biru-sesuai-pasal-287-ayat-1-uu-lalu-lintas-ehsc>
- Tribunnews — Berkendara sambil bermain ponsel: <https://m.tribunnews.com/nasional/2021/12/28/berkendara-sambil-bermain-ponsel-melanggar-uu-llaj-bisa-dipenjara-atau-didenda-ini-penjelasannya?page=all>
- Medcom — Dasar hukum & sanksi helm: <https://www.medcom.id/otomotif/tips-otomotif/Rkj1e4Qb-helm-wajib-digunakan-pengendara-motor-ini-dasar-hukum-dan-sanksinya>
- Daihatsu — Penumpang motor tanpa helm (Pasal 291 ayat (2)): <https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/penumpang-motor-nggak-pakai-helm-bisa-dipidana-pasal-291-ayat-2-/>
- Toyota Astra — Aturan sabuk pengaman: <https://www.toyota.astra.co.id/toyota-connect/news/aturan-penggunaan-sabuk-pengaman-mobil-wajib-untuk-penumpang-depan-dan-ada-denda-jika-kamu-lalai>
- Div Humas Polri (Facebook) — Pasal 287 ayat (5): <https://m.facebook.com/DivHumasPolri/photos/pasal-287-ayat-5-uullaj-no-22-th-2009-setiap-orang-yang-mengemudikan-kendaraan-b/586431204719073/>
- ResearchGate — Implementasi Pasal 106 ayat (9) & sanksi Pasal 292: <https://www.researchgate.net/publication/398323920_Implementasi_Pasal_106_Ayat_9_dan_Sanksi_Pasal_292_UU_LLAJ_terhadap_Pelanggaran_Bonceng_Tiga>
- Repository UNG — Implementasi Pasal 287 ayat (1) terhadap pelanggar marka: <https://repository.ung.ac.id/skripsi/show/1011416062/implementasi-pasal-287-ayat-1-undang-undang-nomor-22-tahun-2009-tentang-lalu-lintas-angkutan-jalan-terhadap-pelanggar-marka-jalan.html>
- Catatan Hukum — Salinan UU 22/2009: <https://www.catatanhukum.com/DOC-PUU/UU_No_22_Tahun_2009-Lalu_Lintas_Dan_Angkutan_Jalan/index.html>

## Artefak internal

- Knowledge base sitasi (digenerate, terverifikasi): [`lib/legal/citations.ts`](lib/legal/citations.ts)
- Katalog & taksonomi pelanggaran: [`lib/legal/catalog.ts`](lib/legal/catalog.ts)
- Mesin aturan deteksi: [`lib/violations/engine.ts`](lib/violations/engine.ts)
- Tipe domain & batas kriptografis (`EvidencePayload`, `LegalSnapshot`): [`lib/evidence/types.ts`](lib/evidence/types.ts)
- Artefak riset Phase-0 (verifikasi 3-voter, `legal_verified_count: 12`): [`docs/research/phase0-research.json`](docs/research/phase0-research.json)
