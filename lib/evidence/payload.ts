import type { EvidencePayload, MediaHashes, ViolationEvent } from "./types";
import { citationFor } from "@/lib/legal/citations";

/**
 * Construct the canonical {@link EvidencePayload} that the server signs.
 *
 * `sealedAt` is stamped by the server (authoritative time) — never trusted from
 * the client. The legal snapshot is resolved from the citation KB at seal time
 * so the report reflects the exact statute version in effect.
 */
export function buildPayload(
  event: Pick<
    ViolationEvent,
    | "id"
    | "violation"
    | "subject"
    | "capturedAt"
    | "confidence"
    | "vehicleClass"
    | "plateText"
    | "egoSpeedKmh"
    | "otherSpeedKmh"
    | "speedLimitKmh"
    | "location"
    | "road"
  >,
  sealedAt: number,
  opts?: { mediaHashes?: MediaHashes; device?: { userAgent?: string; platform?: string } },
): EvidencePayload {
  const cite = citationFor(event.violation);
  return {
    schema: "dashai.evidence.v1",
    eventId: event.id,
    violation: event.violation,
    subject: event.subject,
    capturedAt: event.capturedAt,
    sealedAt,
    confidence: event.confidence,
    vehicleClass: event.vehicleClass,
    plateText: event.plateText ?? null,
    egoSpeedKmh: event.egoSpeedKmh ?? null,
    otherSpeedKmh: event.otherSpeedKmh ?? null,
    speedLimitKmh: event.speedLimitKmh ?? null,
    location: event.location ?? null,
    road: event.road ?? null,
    mediaHashes: opts?.mediaHashes ?? {},
    legal: { uu: cite.uu, pasal: cite.pasal, ayat: cite.ayat, sanksi: cite.sanksi },
    device: opts?.device,
  };
}
