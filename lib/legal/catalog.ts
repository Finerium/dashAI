import type { Subject, ViolationKey } from "@/lib/evidence/types";

/** How reliably a dashcam can detect a violation from the road-facing camera. */
export type DetectionTier = "core" | "secondary" | "cabin";

export interface ViolationMeta {
  key: ViolationKey;
  labelId: string; // Bahasa Indonesia
  labelEn: string;
  /** One-line description of the behaviour. */
  blurb: string;
  /** Which subjects this can apply to. */
  subjects: Subject[];
  tier: DetectionTier;
  /** Plain-language description of the CV/sensor signal used to detect it. */
  detectionBasis: string;
  /** Needs the cabin-facing camera (driver monitoring) to be reliable. */
  requiresCabinCam: boolean;
  severity: 1 | 2 | 3; // 1 = ringan, 3 = berat
}

/**
 * The full violation taxonomy. The engine is a pluggable rule set keyed by
 * these entries — adding a new violation is: add a meta entry, a citation, and
 * a detector rule.
 */
export const VIOLATION_CATALOG: Record<ViolationKey, ViolationMeta> = {
  "lawan-arus": {
    key: "lawan-arus",
    labelId: "Melawan arah",
    labelEn: "Wrong-way driving",
    blurb: "Kendaraan bergerak melawan arah arus lalu lintas yang sah.",
    subjects: ["other", "self"],
    tier: "core",
    detectionBasis:
      "Fusi OSM `oneway` + heading GPS (untuk diri sendiri) dan analisis arah gerak objek terhadap arus dominan di frame (untuk kendaraan lain).",
    requiresCabinCam: false,
    severity: 3,
  },
  "tanpa-helm": {
    key: "tanpa-helm",
    labelId: "Pengendara tanpa helm",
    labelEn: "Rider without helmet",
    blurb: "Pengendara sepeda motor tidak mengenakan helm.",
    subjects: ["other"],
    tier: "core",
    detectionBasis:
      "Deteksi pengendara motor, lalu klasifikasi region kepala (helm / tanpa helm) pada bounding-box pengendara.",
    requiresCabinCam: false,
    severity: 2,
  },
  "penumpang-tanpa-helm": {
    key: "penumpang-tanpa-helm",
    labelId: "Penumpang tanpa helm",
    labelEn: "Passenger without helmet",
    blurb: "Penumpang sepeda motor tidak mengenakan helm.",
    subjects: ["other"],
    tier: "secondary",
    detectionBasis: "Deteksi penumpang kedua pada motor + klasifikasi region kepala.",
    requiresCabinCam: false,
    severity: 2,
  },
  "terobos-lampu-merah": {
    key: "terobos-lampu-merah",
    labelId: "Menerobos lampu merah",
    labelEn: "Red-light running",
    blurb: "Kendaraan melintasi persimpangan saat lampu lalu lintas merah.",
    subjects: ["other", "self"],
    tier: "core",
    detectionBasis:
      "Deteksi traffic light + klasifikasi warna (merah) digabung dengan lintasan kendaraan melewati garis henti.",
    requiresCabinCam: false,
    severity: 3,
  },
  "langgar-marka": {
    key: "langgar-marka",
    labelId: "Melanggar marka/rambu",
    labelEn: "Lane/road-marking violation",
    blurb: "Kendaraan melanggar marka jalan atau rambu (mis. garis utuh).",
    subjects: ["other", "self"],
    tier: "secondary",
    detectionBasis: "Deteksi lajur (lane) + perpotongan lintasan kendaraan dengan marka utuh.",
    requiresCabinCam: false,
    severity: 2,
  },
  "boncengan-lebih": {
    key: "boncengan-lebih",
    labelId: "Boncengan lebih dari satu",
    labelEn: "Motorcycle overcapacity",
    blurb: "Sepeda motor mengangkut lebih dari satu penumpang.",
    subjects: ["other"],
    tier: "core",
    detectionBasis: "Jumlah orang yang menempel pada satu track sepeda motor > 2.",
    requiresCabinCam: false,
    severity: 2,
  },
  "melebihi-kecepatan": {
    key: "melebihi-kecepatan",
    labelId: "Melebihi batas kecepatan",
    labelEn: "Speeding",
    blurb: "Kecepatan melebihi batas legal pada ruas jalan.",
    subjects: ["other", "self"],
    tier: "core",
    detectionBasis:
      "Diri sendiri: kecepatan GPS vs OSM `maxspeed` (akurat). Kendaraan lain: estimasi dari perubahan skala bounding-box + optical flow (dengan rentang error).",
    requiresCabinCam: false,
    severity: 3,
  },
  "tanpa-sabuk": {
    key: "tanpa-sabuk",
    labelId: "Tanpa sabuk keselamatan",
    labelEn: "No seatbelt",
    blurb: "Pengemudi/penumpang mobil tidak mengenakan sabuk keselamatan.",
    subjects: ["self"],
    tier: "cabin",
    detectionBasis: "Kamera kabin (driver monitoring): deteksi diagonal sabuk pada torso.",
    requiresCabinCam: true,
    severity: 2,
  },
  "main-hp": {
    key: "main-hp",
    labelId: "Bermain ponsel saat berkendara",
    labelEn: "Phone use while driving",
    blurb: "Mengemudi sambil menggunakan telepon genggam.",
    subjects: ["self"],
    tier: "cabin",
    detectionBasis: "Kamera kabin: pose tangan-ke-telinga / objek ponsel dekat wajah.",
    requiresCabinCam: true,
    severity: 3,
  },
  "tanpa-plat": {
    key: "tanpa-plat",
    labelId: "Tanpa pelat nomor sah",
    labelEn: "No / invalid plate",
    blurb: "Kendaraan tidak memasang Tanda Nomor Kendaraan Bermotor yang sah.",
    subjects: ["other"],
    tier: "secondary",
    detectionBasis: "Deteksi region pelat pada kendaraan + kegagalan OCR pelat valid.",
    requiresCabinCam: false,
    severity: 2,
  },
  "tanpa-lampu-malam": {
    key: "tanpa-lampu-malam",
    labelId: "Tanpa lampu pada malam hari",
    labelEn: "No lights at night",
    blurb: "Kendaraan tidak menyalakan lampu utama pada malam hari.",
    subjects: ["other", "self"],
    tier: "secondary",
    detectionBasis: "Estimasi kecerahan ambient (malam) + tidak adanya sumber cahaya pada region lampu kendaraan.",
    requiresCabinCam: false,
    severity: 2,
  },
  "motor-lampu-siang": {
    key: "motor-lampu-siang",
    labelId: "Motor tanpa lampu di siang hari",
    labelEn: "Motorcycle without daytime lights",
    blurb: "Sepeda motor tidak menyalakan lampu utama pada siang hari.",
    subjects: ["other"],
    tier: "secondary",
    detectionBasis: "Deteksi motor + tidak adanya sumber cahaya pada region lampu depan.",
    requiresCabinCam: false,
    severity: 1,
  },
};

export const ALL_VIOLATIONS = Object.values(VIOLATION_CATALOG);

export function violationsForSubject(subject: Subject): ViolationMeta[] {
  return ALL_VIOLATIONS.filter((v) => v.subjects.includes(subject));
}
