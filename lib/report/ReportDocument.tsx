import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportKind, SealedEvidence } from "@/lib/evidence/types";
import { VIOLATION_CATALOG } from "@/lib/legal/catalog";
import { fmtTime } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    paddingTop: 64,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#111111",
    lineHeight: 1.45,
  },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 18, letterSpacing: 1 },
  brandSub: { fontFamily: "Helvetica", fontSize: 8, color: "#444" },
  rule: { borderBottomWidth: 1.5, borderBottomColor: "#111", marginTop: 6, marginBottom: 14 },
  docTitle: { fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 2 },
  classification: { fontFamily: "Helvetica", fontSize: 8, color: "#333", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 14, marginBottom: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#bbb", paddingVertical: 3 },
  cellLabel: { width: "34%", fontFamily: "Helvetica-Bold", fontSize: 9 },
  cellValue: { width: "66%", fontSize: 9.5 },
  para: { fontSize: 9.5, marginBottom: 4, textAlign: "justify" },
  sealBox: { flexDirection: "row", marginTop: 8, borderWidth: 1, borderColor: "#111", padding: 10 },
  sealLeft: { width: "70%", paddingRight: 10 },
  sealRight: { width: "30%", alignItems: "center", justifyContent: "center", borderLeftWidth: 0.5, borderLeftColor: "#bbb", paddingLeft: 8 },
  mono: { fontFamily: "Courier", fontSize: 7.5, color: "#222" },
  qr: { width: 96, height: 96 },
  qrCaption: { fontFamily: "Helvetica", fontSize: 6.5, color: "#444", marginTop: 4, textAlign: "center" },
  footer: { position: "absolute", bottom: 28, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: "#bbb", paddingTop: 6 },
  footerText: { fontFamily: "Helvetica", fontSize: 7, color: "#555" },
  disclaimer: { fontFamily: "Helvetica", fontSize: 7.5, color: "#555", marginTop: 10, textAlign: "justify" },
});

const KIND_META: Record<ReportKind, { title: string; recipient: string; legalHeading: string }> = {
  tilang: {
    title: "LAPORAN BUKTI PELANGGARAN LALU LINTAS",
    recipient: "Ditujukan kepada: Kepolisian Republik Indonesia / Sistem ETLE",
    legalHeading: "Dasar Hukum",
  },
  kecelakaan: {
    title: "LAPORAN BUKTI KEJADIAN / KECELAKAAN",
    recipient: "Ditujukan kepada: Kepolisian / Perusahaan Asuransi",
    legalHeading: "Konteks Hukum & Pengukuran",
  },
  coaching: {
    title: "LAPORAN PEMBINAAN MENGEMUDI MANDIRI",
    recipient: "Dokumen pribadi pemilik dashAI (tidak untuk pelaporan).",
    legalHeading: "Catatan Keselamatan & Rujukan Aturan",
  },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

const rupiah = (n?: number) =>
  n != null ? "Rp" + n.toLocaleString("id-ID") : "—";

export interface ReportProps {
  sealed: SealedEvidence;
  kind: ReportKind;
  qrDataUrl: string;
  verifyUrl: string;
  isDev: boolean;
}

export function ReportDocument({ sealed, kind, qrDataUrl, verifyUrl, isDev }: ReportProps) {
  const p = sealed.payload;
  const meta = KIND_META[kind];
  const cat = VIOLATION_CATALOG[p.violation];
  const docId = `DASHAI-${kind.toUpperCase()}-${p.eventId}`.slice(0, 64);

  return (
    <Document
      title={`dashAI ${meta.title}`}
      author="dashAI"
      subject={cat?.labelId ?? p.violation}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>dashAI</Text>
            <Text style={styles.brandSub}>Saksi mata digital yang netral &amp; tertandatangani</Text>
          </View>
          <Text style={styles.brandSub}>{docId}</Text>
        </View>
        <View style={styles.rule} />

        <Text style={styles.docTitle}>{meta.title}</Text>
        <Text style={styles.classification}>
          Dokumen bukti — tertandatangani kriptografis (Ed25519) · {meta.recipient}
        </Text>

        <Text style={styles.h2}>1. Ringkasan Pelanggaran</Text>
        <Row label="Jenis pelanggaran" value={`${cat?.labelId ?? p.violation} (${cat?.labelEn ?? ""})`} />
        <Row label="Subjek" value={p.subject === "self" ? "Pemilik dashAI (self)" : "Pihak lain"} />
        <Row label="Tingkat keyakinan deteksi" value={`${Math.round(p.confidence * 100)}%`} />
        <Row label="Waktu kejadian" value={fmtTime(p.capturedAt)} />
        <Row label="Waktu disegel (server)" value={fmtTime(p.sealedAt)} />

        <Text style={styles.h2}>2. Identitas &amp; Pengukuran</Text>
        <Row label="Pelat nomor" value={p.plateText ?? "Tidak terbaca / tidak ada"} />
        <Row label="Kelas kendaraan" value={p.vehicleClass ?? "—"} />
        <Row label="Kecepatan pemilik (GPS, akurat)" value={p.egoSpeedKmh != null ? `${p.egoSpeedKmh} km/jam` : "—"} />
        <Row label="Kecepatan pihak lain (estimasi)" value={p.otherSpeedKmh != null ? `± ${p.otherSpeedKmh} km/jam (estimasi)` : "—"} />
        <Row label="Batas kecepatan (OSM)" value={p.speedLimitKmh != null ? `${p.speedLimitKmh} km/jam` : "—"} />
        <Row label="Ruas jalan" value={p.road?.name ?? "—"} />
        <Row label="Koordinat" value={p.location ? `${p.location.lat.toFixed(5)}, ${p.location.lng.toFixed(5)}` : "—"} />

        <Text style={styles.h2}>3. {meta.legalHeading}</Text>
        <Row label="Undang-undang" value={p.legal.uu} />
        <Row label="Pasal" value={`${p.legal.pasal}${p.legal.ayat ? " " + p.legal.ayat : ""}`} />
        <Text style={[styles.para, { marginTop: 6 }]}>“{citeBunyi(p.legal.pasal)}”</Text>
        <Row label="Ancaman / sanksi" value={p.legal.sanksi} />

        <Text style={styles.h2}>4. Integritas Kriptografi</Text>
        <View style={styles.sealBox}>
          <View style={styles.sealLeft}>
            <Row label="Algoritma" value={`${sealed.algorithm} (EdDSA)`} />
            <Row label="Key ID" value={sealed.publicKeyId} />
            <View style={{ marginTop: 4 }}>
              <Text style={styles.cellLabel}>SHA-256 payload</Text>
              <Text style={styles.mono}>{sealed.payloadHash}</Text>
            </View>
            <View style={{ marginTop: 4 }}>
              <Text style={styles.cellLabel}>Tanda tangan (Ed25519)</Text>
              <Text style={styles.mono}>{sealed.signature}</Text>
            </View>
          </View>
          <View style={styles.sealRight}>
            {qrDataUrl ? <Image style={styles.qr} src={qrDataUrl} /> : null}
            <Text style={styles.qrCaption}>Pindai untuk verifikasi independen</Text>
          </View>
        </View>
        <Text style={styles.mono}>{verifyUrl}</Text>

        <Text style={styles.disclaimer}>
          Catatan integritas: tanda tangan di atas membuktikan bahwa isi laporan ini tidak berubah sejak
          disegel oleh server dashAI pada waktu tertera (tamper-evident). Tanda tangan TIDAK membuktikan
          bahwa kamera benar-benar menyaksikan peristiwa di dunia nyata. Penilaian akhir tetap pada pihak
          berwenang. {isDev ? "DOKUMEN INI DIBUAT DENGAN KUNCI PENGEMBANGAN (DEV) DAN TIDAK SAH." : ""}
          {kind === "coaching"
            ? " Laporan pembinaan ini bersifat pribadi dan bukan dokumen penegakan hukum."
            : ""}
        </Text>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>dashAI · Tamper-evident evidence · CONFIDENTIAL</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// The full article text lives in the citation KB; we pass only the snapshot in
// the signed payload, so re-derive a readable line here for presentation.
function citeBunyi(pasal: string): string {
  // Presentation-only; the authoritative text is in the signed legal snapshot.
  return `Lihat ${pasal} UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan.`;
}
