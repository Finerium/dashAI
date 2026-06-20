/**
 * dashAI — core domain types.
 *
 * The evidence pipeline turns raw camera frames into immutable, signed
 * evidence. Everything downstream (viewer, reports, verification) is built on
 * the types in this file. The cryptographic boundary is {@link EvidencePayload}:
 * the *exact* JSON that the server signs. Anything outside the payload is
 * presentation only and carries no evidentiary weight.
 */

/** Who committed the violation, relative to the dashAI owner. */
export type Subject = "other" | "self";

/** The catalog of violations dashAI can reason about. */
export type ViolationKey =
  | "lawan-arus"
  | "tanpa-helm"
  | "penumpang-tanpa-helm"
  | "terobos-lampu-merah"
  | "langgar-marka"
  | "boncengan-lebih"
  | "melebihi-kecepatan"
  | "tanpa-sabuk"
  | "main-hp"
  | "tanpa-plat"
  | "tanpa-lampu-malam"
  | "motor-lampu-siang";

/** A single GPS sample. `speedMps` and `headingDeg` come straight from the
 * Geolocation API and may be null on devices that do not report them. */
export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  speedMps?: number | null;
  headingDeg?: number | null;
  timestamp: number;
}

/** Road context resolved from OpenStreetMap for the current GPS point. */
export interface RoadContext {
  name?: string;
  oneway?: boolean;
  /** Legal direction of travel as an OSM way bearing (degrees), if known. */
  bearingDeg?: number | null;
  maxspeedKmh?: number | null;
}

/** Normalised bounding box (all components in 0..1 of frame dimensions). */
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A tracked object in a single frame. */
export interface Detection {
  /** Stable track id across frames. */
  id: string;
  /** COCO class label, e.g. "car" | "motorcycle" | "person" | "traffic light". */
  cls: string;
  score: number;
  bbox: BBox;
  /** Per-frame velocity in normalised units/second (set by the tracker). */
  vx?: number;
  vy?: number;
  /** Frames this track has been alive — used to gate noisy single-frame hits. */
  age?: number;
}

/**
 * A confirmed violation, as produced on the client. Media fields hold object
 * URLs / data URLs while in memory; once sealed they are referenced by hash.
 */
export interface ViolationEvent {
  id: string;
  violation: ViolationKey;
  subject: Subject;
  /** 0..1 — the engine's confidence the violation actually occurred. */
  confidence: number;
  capturedAt: number;

  // ---- evidence media (client-side blobs / data URLs) ----
  frame?: string; // full annotated frame
  faceCrop?: string; // cropped face (always blurred in the UI)
  plateCrop?: string;
  plateText?: string | null;
  vehicleClass?: string;

  // ---- measurements ----
  egoSpeedKmh?: number | null; // accurate (GPS)
  otherSpeedKmh?: number | null; // estimated, with error
  speedLimitKmh?: number | null; // OSM maxspeed
  location?: GeoPoint | null;
  road?: RoadContext | null;
  bbox?: BBox;

  notes?: string;
  /** True once this event has been sealed by the server. */
  sealed?: boolean;
  seal?: SealedEvidence;
  /** Synthetic scene key — present only on curated demo events. */
  scene?: SceneType;
  /** Marks curated demonstration data (never treated as real evidence). */
  demo?: boolean;
}

/** Synthetic backdrop used to render curated demo events in the viewer. */
export type SceneType =
  | "street-day"
  | "street-night"
  | "intersection"
  | "highway"
  | "alley";

/** sha-256 hashes of the media bytes, so the signed payload commits to the
 * imagery without bloating the signature with megabytes of base64. */
export interface MediaHashes {
  frame?: string;
  faceCrop?: string;
  plateCrop?: string;
}

/** The legal citation snapshot embedded into the signed payload. */
export interface LegalSnapshot {
  uu: string;
  pasal: string;
  ayat?: string;
  sanksi: string;
}

/**
 * THE cryptographic boundary. These exact fields, serialised canonically
 * (see lib/crypto/canonical.ts), are what the server signs. The signature
 * proves this payload was sealed by dashAI at `sealedAt` and is unchanged —
 * it does NOT prove the camera witnessed physical reality.
 */
export interface EvidencePayload {
  schema: "dashai.evidence.v1";
  eventId: string;
  violation: ViolationKey;
  subject: Subject;
  capturedAt: number;
  sealedAt: number; // server-stamped, authoritative
  confidence: number;
  vehicleClass?: string;
  plateText?: string | null;
  egoSpeedKmh?: number | null;
  otherSpeedKmh?: number | null;
  speedLimitKmh?: number | null;
  location?: GeoPoint | null;
  road?: RoadContext | null;
  mediaHashes: MediaHashes;
  legal: LegalSnapshot;
  device?: { userAgent?: string; platform?: string };
}

/** The signed envelope returned by /api/seal and embedded in reports. */
export interface SealedEvidence {
  payload: EvidencePayload;
  algorithm: "Ed25519";
  publicKeyId: string;
  /** hex sha-256 of the canonical payload. */
  payloadHash: string;
  /** base64url Ed25519 signature over the canonical payload bytes. */
  signature: string;
  sealedAt: number;
}

/** Result of verifying a {@link SealedEvidence}. */
export interface VerificationResult {
  valid: boolean;
  reason: string;
  hashMatches: boolean;
  signatureValid: boolean;
  publicKeyId: string;
  checkedAt: number;
}

export type ReportKind = "tilang" | "kecelakaan" | "coaching";
