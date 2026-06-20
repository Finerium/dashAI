import type { ViolationKey } from "@/lib/evidence/types";

export type CitationConfidence = "high" | "medium" | "low" | "pending";

export interface Citation {
  /** The governing statute. */
  uu: string;
  pasal: string;
  ayat?: string;
  /** Article text (bunyi pasal). */
  bunyi: string;
  /** Sanction summary (ancaman pidana). */
  sanksi: string;
  dendaMaxRupiah?: number;
  kurunganMax?: string;
  relatedArticles?: string[];
  confidence: CitationConfidence;
  /** True when confirmed by the dashAI 3-voter adversarial citation check. */
  verified?: boolean;
  sources?: string[];
}

/**
 * Legal knowledge base for UU 22/2009 (LLAJ). GENERATED from the verified output
 * of the dashAI Phase-0 research workflow (per-citation 3-voter adversarial
 * verification against official/established Indonesian legal sources). Do not
 * hand-edit — re-run the research workflow and regenerate.
 */
export const CITATIONS: Record<ViolationKey, Citation> = {
  "lawan-arus": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 287",
    "ayat": "ayat (1)",
    "bunyi": "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang melanggar aturan perintah atau larangan yang dinyatakan dengan Rambu Lalu Lintas sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf a atau Marka Jalan sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf b dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).",
    "sanksi": "Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah). Sifatnya alternatif (kurungan ATAU denda).",
    "dendaMaxRupiah": 500000,
    "kurunganMax": "2 bulan",
    "relatedArticles": [
      "Pasal 106 ayat (4) huruf a - kewajiban pengemudi mematuhi rambu perintah atau rambu larangan (dasar larangan melawan arah, mis. rambu larangan masuk / jalan satu arah)",
      "Pasal 106 ayat (4) huruf b - kewajiban mematuhi marka jalan (mis. marka arah lajur)",
      "Pasal 287 ayat (2) - pelanggaran terhadap Alat Pemberi Isyarat Lalu Lintas (kurungan max 2 bulan / denda max Rp500.000)",
      "Pasal 310 - jika mengakibatkan kecelakaan lalu lintas (luka ringan/berat/meninggal): pidana penjara hingga 6 tahun dan/atau denda hingga Rp12.000.000 (ayat 4, korban meninggal)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://kumparan.com/info-otomotif/pasal-287-uu-lalu-lintas-isinya-apa-1z4eFyksUVL",
      "https://dishub.kedirikota.go.id/uu-no-22-tahun-2009-tentang-llaj-pasal-106-ayat-4/",
      "https://korlantas.polri.go.id/jangan-lawan-arus-di-jalan-ini-aturan-sanksi-tegas-dan-dendanya/",
      "https://www.hukumonline.com/berita/a/nekat-melawan-arus-ingat-nyawa-dan-sanksi-ini-lt5bcdd167c3710/",
      "https://oto.detik.com/catatan-pengendara-motor/d-6043570/masih-nekat-lawan-arus-siap-siap-denda-rp-500-ribu",
      "https://dishub.malangkota.go.id/wp-content/uploads/sites/16/2016/05/Undang-Undang-No.-22-tahun-2009-Tentang-Lalulintas.pdf"
    ]
  },
  "tanpa-helm": {
    "uu": "Undang-Undang No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (LLAJ)",
    "pasal": "Pasal 291",
    "ayat": "ayat (1)",
    "bunyi": "Setiap orang yang mengemudikan Sepeda Motor tidak mengenakan helm standar nasional Indonesia sebagaimana dimaksud dalam Pasal 106 ayat (8) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah).’ Kewajiban dasarnya diatur dalam Pasal 106 ayat (8): ’Setiap orang yang mengemudikan Sepeda Motor dan Penumpang Sepeda Motor wajib mengenakan helm yang memenuhi standar nasional Indonesia.",
    "sanksi": "Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00. (Sanksi bersifat alternatif: kurungan ATAU denda.)",
    "dendaMaxRupiah": 250000,
    "kurunganMax": "1 bulan",
    "relatedArticles": [
      "Pasal 106 ayat (8) UU 22/2009 - kewajiban pengemudi dan penumpang sepeda motor mengenakan helm SNI (norma yang dirujuk)",
      "Pasal 291 ayat (2) UU 22/2009 - pengemudi yang membiarkan penumpangnya tidak mengenakan helm: kurungan maks 1 bulan atau denda maks Rp250.000,00",
      "Pasal 57 ayat (1) dan ayat (2) UU 22/2009 - helm SNI sebagai perlengkapan wajib sepeda motor"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://www.hukumonline.com/klinik/a/undang--undang-yang-mengatur-penggunaan-helm-standar-kendaraan-roda-dua-cl4957/",
      "https://www.medcom.id/otomotif/tips-otomotif/Rkj1e4Qb-helm-wajib-digunakan-pengendara-motor-ini-dasar-hukum-dan-sanksinya",
      "https://otomotif.kompas.com/read/2023/12/07/101200015/tidak-menggunakan-helm-saat-naik-motor-bisa-kena-tilang-rp-250.000",
      "https://tribratanews.kepri.polri.go.id/2021/06/17/penggunaan-helm-standar-yang-diatur-dalam-uu-lalu-lintas-dan-angkutan-jalan-2/",
      "https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/penumpang-motor-nggak-pakai-helm-bisa-dipidana-pasal-291-ayat-2-/"
    ]
  },
  "penumpang-tanpa-helm": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 291",
    "ayat": "ayat (2)",
    "bunyi": "Setiap orang yang mengemudikan Sepeda Motor yang membiarkan penumpangnya tidak mengenakan helm sebagaimana dimaksud dalam Pasal 106 ayat (8) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah).",
    "sanksi": "Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah). Catatan: subjek hukum yang dipidana adalah PENGEMUDI yang membiarkan penumpangnya tidak berhelm (bukan penumpang itu sendiri).",
    "dendaMaxRupiah": 250000,
    "kurunganMax": "1 bulan",
    "relatedArticles": [
      "Pasal 106 ayat (8) UU 22/2009 - kewajiban dasar: pengemudi dan penumpang Sepeda Motor wajib mengenakan helm yang memenuhi Standar Nasional Indonesia (SNI)",
      "Pasal 291 ayat (1) UU 22/2009 - sanksi untuk PENGEMUDI sepeda motor yang sendiri tidak mengenakan helm SNI (kurungan maks 1 bulan / denda maks Rp250.000)",
      "Pasal 57 ayat (2) UU 22/2009 - helm SNI termasuk perlengkapan wajib sepeda motor"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://www.hukumonline.com/klinik/a/undang--undang-yang-mengatur-penggunaan-helm-standar-kendaraan-roda-dua-cl4957/",
      "https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/penumpang-motor-nggak-pakai-helm-bisa-dipidana-pasal-291-ayat-2-/",
      "https://humas.polri.go.id/news/detail/2331476-kepatuhan-berkendara-pengendara-wajib-gunakan-helm-sesuai-uullaj-pasal-106-ayat-8",
      "https://otomotif.kompas.com/read/2021/09/13/141200515/pengendara-motor-tidak-pakai-helm-sni-bisa-didenda-rp-250.000-ini-aturannya",
      "https://pid.kepri.polri.go.id/penggunaan-helm-standar-yang-diatur-dalam-uu-lalu-lintas-dan-angkutan-jalan-2/"
    ]
  },
  "terobos-lampu-merah": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (LLAJ)",
    "pasal": "Pasal 287",
    "ayat": "ayat (2)",
    "bunyi": "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang melanggar aturan perintah atau larangan yang dinyatakan dengan Alat Pemberi Isyarat Lalu Lintas sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf c dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).’ Alat Pemberi Isyarat Lalu Lintas (APILL) mencakup lampu lalu lintas (lampu merah). Pasal 106 ayat (4) huruf c mewajibkan setiap pengemudi kendaraan bermotor di jalan untuk mematuhi Alat Pemberi Isyarat Lalu Lintas.",
    "sanksi": "Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).",
    "dendaMaxRupiah": 500000,
    "kurunganMax": "2 bulan",
    "relatedArticles": [
      "Pasal 106 ayat (4) huruf c UU 22/2009 (kewajiban pengemudi mematuhi Alat Pemberi Isyarat Lalu Lintas/APILL)",
      "Pasal 287 ayat (1) UU 22/2009 (pelanggaran rambu/marka lalu lintas: kurungan maks 2 bulan atau denda maks Rp500.000)",
      "Pasal 1 angka 19 UU 22/2009 (definisi Alat Pemberi Isyarat Lalu Lintas)",
      "Pasal 104 ayat (1) UU 22/2009 (pengecualian dalam keadaan tertentu/darurat atas perintah petugas)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://peraturan.bpk.go.id/Download/27961/UU%20Nomor%2022%20Tahun%202009.pdf",
      "https://www.dpr.go.id/dokjdih/document/uu/UU_2009_22.pdf",
      "https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_22_Tahun_2009",
      "https://dishub.kedirikota.go.id/uu-no-22-tahun-2009-tentang-llaj-pasal-106-ayat-4/",
      "https://tirto.id/isi-denda-tilang-slip-biru-sesuai-pasal-287-ayat-1-uu-lalu-lintas-ehsc",
      "https://kumparan.com/info-otomotif/pasal-287-uu-lalu-lintas-isinya-apa-1z4eFyksUVL"
    ]
  },
  "langgar-marka": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 287",
    "ayat": "ayat (1)",
    "bunyi": "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang melanggar aturan perintah atau larangan yang dinyatakan dengan Rambu Lalu Lintas sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf a atau Marka Jalan sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf b dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).",
    "sanksi": "Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).",
    "dendaMaxRupiah": 500000,
    "kurunganMax": "2 bulan",
    "relatedArticles": [
      "Pasal 106 ayat (4) huruf a UU 22/2009 (kewajiban mematuhi rambu perintah atau rambu larangan)",
      "Pasal 106 ayat (4) huruf b UU 22/2009 (kewajiban mematuhi marka jalan)",
      "Pasal 287 ayat (2) UU 22/2009 (melanggar Alat Pemberi Isyarat Lalu Lintas / APILL - kurungan 2 bulan atau denda Rp500.000)",
      "Pasal 287 ayat (3) UU 22/2009 (melanggar aturan gerakan lalu lintas atau tata cara berhenti dan parkir - kurungan 1 bulan atau denda Rp250.000)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://kumparan.com/info-otomotif/pasal-287-uu-lalu-lintas-isinya-apa-1z4eFyksUVL",
      "https://www.hukumonline.com/klinik/a/kena-e-tilang-karena-melawan-arus-lalu-lintas-lt5e4571a25e585/",
      "https://tirto.id/isi-denda-tilang-slip-biru-sesuai-pasal-287-ayat-1-uu-lalu-lintas-ehsc",
      "https://dishub.kedirikota.go.id/uu-no-22-tahun-2009-tentang-llaj-pasal-106-ayat-4/",
      "https://repository.ung.ac.id/skripsi/show/1011416062/implementasi-pasal-287-ayat-1-undang-undang-nomor-22-tahun-2009-tentang-lalu-lintas-angkutan-jalan-terhadap-pelanggar-marka-jalan.html",
      "https://www.catatanhukum.com/DOC-PUU/UU_No_22_Tahun_2009-Lalu_Lintas_Dan_Angkutan_Jalan/index.html"
    ]
  },
  "boncengan-lebih": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 292",
    "ayat": "ayat (9)",
    "bunyi": "Pasal 292: ’Setiap orang yang mengemudikan Sepeda Motor tanpa kereta samping yang mengangkut Penumpang lebih dari 1 (satu) orang sebagaimana dimaksud dalam Pasal 106 ayat (9) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah).’ | Larangan dasar di Pasal 106 ayat (9): ’Setiap orang yang mengemudikan Sepeda Motor tanpa kereta samping dilarang membawa Penumpang lebih dari 1 (satu) orang.",
    "sanksi": "Pidana kurungan paling lama 1 (satu) bulan ATAU denda paling banyak Rp250.000,00 (alternatif/kumulatif-alternatif).",
    "dendaMaxRupiah": 250000,
    "kurunganMax": "1 (satu) bulan",
    "relatedArticles": [
      "Pasal 106 ayat (9) UU 22/2009 - larangan dasar membawa lebih dari 1 penumpang pada sepeda motor tanpa kereta samping",
      "Pasal 106 ayat (1) - kewajiban mengemudi dengan penuh konsentrasi",
      "Pasal 291 - sanksi tidak mengenakan helm SNI (sering melengkapi penindakan bonceng tiga)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://www.basishukum.com/uu/22/2009/XX/292?m=d",
      "https://polreskudus.com/2024/11/28/jangan-boncengan-lebih-dari-satu-pasal-292/",
      "https://www.hukumonline.com/klinik/a/undang--undang-yang-mengatur-penggunaan-helm-standar-kendaraan-roda-dua-cl4957/",
      "https://otomotif.kompas.com/read/2024/02/05/111200015/bonceng-penumpang-motor-lebih-dari-1-orang-bisa-kena-denda-rp-250.000",
      "https://www.researchgate.net/publication/398323920_Implementasi_Pasal_106_Ayat_9_dan_Sanksi_Pasal_292_UU_LLAJ_terhadap_Pelanggaran_Bonceng_Tiga",
      "https://tribratanews.gunungkidul.jogja.polri.go.id/read/pasal-tilang-dan-daftar-denda-pelanggaran-lalu-lintas"
    ]
  },
  "melebihi-kecepatan": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 287",
    "ayat": "ayat (5)",
    "bunyi": "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang melanggar aturan batas kecepatan paling tinggi atau paling rendah sebagaimana dimaksud dalam Pasal 106 ayat (4) huruf g atau Pasal 115 huruf a dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).",
    "sanksi": "Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).",
    "dendaMaxRupiah": 500000,
    "kurunganMax": "2 bulan",
    "relatedArticles": [
      "Pasal 106 ayat (4) huruf g - kewajiban mematuhi ketentuan kecepatan maksimal atau minimal",
      "Pasal 115 huruf a - larangan mengemudikan kendaraan melebihi batas kecepatan paling tinggi yang diperbolehkan",
      "Pasal 21 - setiap jalan memiliki batas kecepatan paling tinggi yang ditetapkan secara nasional (dasar penetapan batas kecepatan)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://pelayanan.jakarta.go.id/download/regulasi/undang-undang-nomor-22-tahun-2009-tentang-lalu-lintas-dan-angkutan-jalan.pdf",
      "https://dishub.malangkota.go.id/wp-content/uploads/sites/16/2016/05/Undang-Undang-No.-22-tahun-2009-Tentang-Lalulintas.pdf",
      "https://m.facebook.com/DivHumasPolri/photos/pasal-287-ayat-5-uullaj-no-22-th-2009-setiap-orang-yang-mengemudikan-kendaraan-b/586431204719073/",
      "https://pid.kepri.polri.go.id/hukum-mengemudikan-kendaraan-melebihi-batas-kecepatan/"
    ]
  },
  "tanpa-sabuk": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 289",
    "ayat": "ayat (6)",
    "bunyi": "Pasal 289: ’Setiap orang yang mengemudikan Kendaraan Bermotor atau Penumpang yang duduk di samping Pengemudi yang tidak mengenakan sabuk keselamatan sebagaimana dimaksud dalam Pasal 106 ayat (6) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah).’ Kewajiban dasarnya, Pasal 106 ayat (6): ’Setiap orang yang mengemudikan Kendaraan Bermotor beroda empat atau lebih di Jalan dan Penumpang yang duduk di sampingnya wajib mengenakan sabuk keselamatan.",
    "sanksi": "Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah). Sanksi bersifat alternatif (kurungan ATAU denda).",
    "dendaMaxRupiah": 25000000,
    "kurunganMax": "1 (satu) bulan",
    "relatedArticles": [
      "Pasal 106 ayat (6) UU 22/2009 - kewajiban pengemudi kendaraan beroda empat atau lebih dan penumpang di sampingnya mengenakan sabuk keselamatan (pasal kewajiban yang dirujuk Pasal 289)",
      "Pasal 106 ayat (1) UU 22/2009 - kewajiban mengemudikan kendaraan dengan wajar dan penuh konsentrasi",
      "Pasal 57 ayat (2) dan (3) UU 22/2009 - sabuk keselamatan sebagai bagian perlengkapan/persyaratan teknis kendaraan bermotor"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://www.hukumonline.com/klinik/a/aturan-sabuk-keselamatan-untuk-pengemudi-dan-penumpang-mobil-lt5d3a9d9aa4ce4/",
      "https://polrespangandaran.id/intelkam/mengupas-tuntas-kewajiban-pengendara-dan-penumpang-berdasarkan-uu-no-22-tahun-2009/",
      "https://polreskudus.com/2024/01/30/berkendara-roda-empat-ke-atas-wajib-menggunakan-sabuk-keselamatan/",
      "https://www.toyota.astra.co.id/toyota-connect/news/aturan-penggunaan-sabuk-pengaman-mobil-wajib-untuk-penumpang-depan-dan-ada-denda-jika-kamu-lalai",
      "https://peraturan.bpk.go.id/Details/38654/uu-no-22-tahun-2009"
    ]
  },
  "main-hp": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (LLAJ)",
    "pasal": "Pasal 283",
    "ayat": "ayat (1)",
    "bunyi": "Pasal 283: ’Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan secara tidak wajar dan melakukan kegiatan lain atau dipengaruhi oleh suatu keadaan yang mengakibatkan gangguan konsentrasi dalam mengemudi di Jalan sebagaimana dimaksud dalam Pasal 106 ayat (1) dipidana dengan pidana kurungan paling lama 3 (tiga) bulan atau denda paling banyak Rp750.000,00 (tujuh ratus lima puluh ribu rupiah).’ | Pasal 106 ayat (1): ’Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan wajib mengemudikan kendaraannya dengan wajar dan penuh konsentrasi.’ | Penjelasan Pasal 106 ayat (1) menegaskan bahwa yang dimaksud ’penuh konsentrasi’ adalah mengemudi dengan penuh perhatian dan tidak terganggu perhatiannya karena sakit, lelah, mengantuk, menggunakan telepon atau menonton televisi/video yang terpasang di kendaraan, atau meminum minuman beralkohol/obat-obatan. Penggunaan telepon genggam saat mengemudi karena itu termasuk perbuatan yang mengakibatkan gangguan konsentrasi dan dijerat Pasal 283.",
    "sanksi": "Pidana kurungan paling lama 3 (tiga) bulan atau denda paling banyak Rp750.000,00 (tujuh ratus lima puluh ribu rupiah). Sifat ancaman bersifat alternatif (kurungan ATAU denda).",
    "dendaMaxRupiah": 750000,
    "kurunganMax": "3 bulan",
    "relatedArticles": [
      "Pasal 106 ayat (1) UU 22/2009 - kewajiban mengemudi dengan wajar dan penuh konsentrasi (norma yang dilanggar)",
      "Penjelasan Pasal 106 ayat (1) - definisi 'penuh konsentrasi' yang secara eksplisit menyebut 'menggunakan telepon' sebagai pengganggu konsentrasi",
      "Pasal 310 UU 22/2009 - jika kelalaian (termasuk akibat distraksi telepon) menyebabkan kecelakaan lalu lintas dengan kerusakan, luka, atau korban meninggal (ancaman lebih berat)",
      "Pasal 311 UU 22/2009 - mengemudikan kendaraan secara sengaja dengan cara membahayakan nyawa/barang"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://www.hukumonline.com/berita/a/penggunaan-telepon-dua-arah-saat-berkendara-ganggu-konsentrasi-lt5af55908c04be/",
      "https://jdih.sukoharjokab.go.id/berita/detail/benarkah-menggunakan-gps-saat-berkendara-bisa-dipidana",
      "https://m.tribunnews.com/nasional/2021/12/28/berkendara-sambil-bermain-ponsel-melanggar-uu-llaj-bisa-dipenjara-atau-didenda-ini-penjelasannya?page=all",
      "https://www.tribratakutim.com/berita-terkini/vigilansi-tanpa-distraksi-penegakan-pasal-283-uu-llaj-dalam-menjaga-konsentrasi-mudik-2026/188716.html"
    ]
  },
  "tanpa-plat": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (LLAJ)",
    "pasal": "Pasal 280",
    "ayat": "ayat (1)",
    "bunyi": "Pasal 280: ’Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan yang tidak dipasangi Tanda Nomor Kendaraan Bermotor yang ditetapkan oleh Kepolisian Negara Republik Indonesia sebagaimana dimaksud dalam Pasal 68 ayat (1) dipidana dengan pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).’ Pasal yang dirujuk, Pasal 68 ayat (1): ’Setiap Kendaraan Bermotor yang dioperasikan di Jalan wajib dilengkapi dengan Surat Tanda Nomor Kendaraan Bermotor dan Tanda Nomor Kendaraan Bermotor.",
    "sanksi": "Pidana kurungan paling lama 2 (dua) bulan atau denda paling banyak Rp500.000,00 (lima ratus ribu rupiah).",
    "dendaMaxRupiah": 500000,
    "kurunganMax": "2 bulan (paling lama dua bulan)",
    "relatedArticles": [
      "Pasal 68 ayat (1) UU 22/2009 - kewajiban setiap Kendaraan Bermotor yang dioperasikan di jalan dilengkapi STNK dan TNKB (norma yang dirujuk Pasal 280)",
      "Pasal 64 ayat (1) UU 22/2009 - kewajiban registrasi Kendaraan Bermotor",
      "Pasal 39 PP No. 80 Tahun 2012 dan Perpol/Perkap tentang Registrasi dan Identifikasi Kendaraan Bermotor - spesifikasi bentuk, ukuran, bahan, warna, dan cara pemasangan TNKB yang sah",
      "Pasal 288 ayat (1) UU 22/2009 - tidak dapat menunjukkan STNK (pelanggaran terkait namun berbeda objek)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://peraturan.bpk.go.id/Download/27961/UU%20Nomor%2022%20Tahun%202009.pdf (Database peraturan resmi BPK RI - teks lengkap UU 22/2009)",
      "https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_22_Tahun_2009 (Wikisource - teks lengkap, diverifikasi untuk Pasal 68 ayat (1))",
      "https://korlantas.polri.go.id/2026-06-05-operasi-patuh-2026-incar-pelat-nomor-tak-sesuai-aturan-ini-risikonya/ (Korlantas Polri - sumber resmi penegakan)",
      "https://humas.polri.go.id/news/detail/2411713-operasi-patuh-2026-incar-pelat-nomor-tak-sesuai-aturan-ini-risikonya (Humas Polri - sumber resmi)",
      "https://www.hukumonline.com/klinik/a/tidak-pasang-pelat-nomor-karena-baut-copot--tetap-ditilang-lt5c6a634abd98d/ (Hukumonline - database hukum mapan, analisis Pasal 280 & 68)"
    ]
  },
  "tanpa-lampu-malam": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 293",
    "ayat": "ayat (1)",
    "bunyi": "Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan tanpa menyalakan lampu utama pada malam hari dan kondisi tertentu sebagaimana dimaksud dalam Pasal 107 ayat (1) dipidana dengan pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah).",
    "sanksi": "Pidana kurungan paling lama 1 (satu) bulan atau denda paling banyak Rp250.000,00 (dua ratus lima puluh ribu rupiah).",
    "dendaMaxRupiah": 250000,
    "kurunganMax": "1 bulan",
    "relatedArticles": [
      "Pasal 107 ayat (1) UU 22/2009 - kewajiban: Pengemudi Kendaraan Bermotor wajib menyalakan lampu utama Kendaraan Bermotor yang digunakan di Jalan pada malam hari dan pada kondisi tertentu (ini adalah pasal kewajiban yang dirujuk/jo. oleh Pasal 293 ayat (1))",
      "Pasal 107 ayat (2) UU 22/2009 - kewajiban pengemudi Sepeda Motor menyalakan lampu utama pada siang hari",
      "Pasal 293 ayat (2) UU 22/2009 - sanksi tidak menyalakan lampu utama pada siang hari (Sepeda Motor): kurungan paling lama 15 (lima belas) hari atau denda paling banyak Rp100.000,00, jo. Pasal 107 ayat (2)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://www.hukumonline.com/klinik/a/dasar-hukum-kewajiban-menyalakan-lampu-kendaraan-pada-siang-hari-lt52458947a935d/",
      "https://www.pn-tamianglayang.go.id/denda-tilang/",
      "https://pid.kepri.polri.go.id/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari/",
      "https://news.detik.com/berita/d-6220055/viral-pemotor-protes-ditilang-tak-nyalakan-lampu-utama-ini-aturannya",
      "https://www.cnnindonesia.com/otomotif/20220810173453-595-833000/lampu-utama-motor-mati-siang-hari-ditilang-berikut-aturannya",
      "https://dishub.malangkota.go.id/wp-content/uploads/sites/16/2016/05/Undang-Undang-No.-22-tahun-2009-Tentang-Lalulintas.pdf"
    ]
  },
  "motor-lampu-siang": {
    "uu": "Undang-Undang Republik Indonesia Nomor 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (UU LLAJ)",
    "pasal": "Pasal 293",
    "ayat": "ayat (2)",
    "bunyi": "Pasal 107 ayat (2): ’Pengemudi Sepeda Motor selain mematuhi ketentuan sebagaimana dimaksud pada ayat (1) wajib menyalakan lampu utama pada siang hari.’ Pasal 293 ayat (2): ’Setiap orang yang mengemudikan Sepeda Motor di Jalan tanpa menyalakan lampu utama pada siang hari sebagaimana dimaksud dalam Pasal 107 ayat (2) dipidana dengan pidana kurungan paling lama 15 (lima belas) hari atau denda paling banyak Rp100.000,00 (seratus ribu rupiah).",
    "sanksi": "Pidana kurungan paling lama 15 (lima belas) hari atau denda paling banyak Rp100.000,00 (seratus ribu rupiah) — Pasal 293 ayat (2)",
    "dendaMaxRupiah": 100000,
    "kurunganMax": "15 hari",
    "relatedArticles": [
      "Pasal 107 ayat (1) UU No. 22 Tahun 2009 - kewajiban menyalakan lampu pada malam hari dan kondisi tertentu (dasar kewajiban ayat 2)",
      "Pasal 107 ayat (2) UU No. 22 Tahun 2009 - kewajiban sepeda motor menyalakan lampu utama pada siang hari",
      "Pasal 293 ayat (1) UU No. 22 Tahun 2009 - sanksi tidak menyalakan lampu utama pada malam hari/kondisi tertentu (kurungan maks 1 bulan atau denda maks Rp250.000,00)"
    ],
    "confidence": "high",
    "verified": true,
    "sources": [
      "https://www.cnnindonesia.com/otomotif/20220810173453-595-833000/lampu-utama-motor-mati-siang-hari-ditilang-berikut-aturannya",
      "https://otomotif.kompas.com/read/2022/01/29/173200715/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari",
      "https://www.hukumonline.com/klinik/a/dasar-hukum-kewajiban-menyalakan-lampu-kendaraan-pada-siang-hari-lt52458947a935d/",
      "https://www.hukumonline.com/berita/a/menguji-konstitusionalitas-aturan-nyalakan-lampu-motor-siang-hari-lt5e3a2e97a09ce/",
      "https://pid.kepri.polri.go.id/aturan-sepeda-motor-wajib-menyalakan-lampu-utama-di-siang-hari/"
    ]
  }
};

export function citationFor(key: ViolationKey): Citation {
  return CITATIONS[key];
}
