import "server-only";
import * as ed from "@noble/ed25519";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import type { EvidencePayload, SealedEvidence } from "@/lib/evidence/types";
import { canonicalize, sha256HexOfString } from "./canonical";
import { getServerKey } from "./keys";

/**
 * Seal an evidence payload: canonicalise → hash → Ed25519 sign.
 *
 * What this proves: the returned payload was sealed by this dashAI instance at
 * `payload.sealedAt` and has not been altered since.
 * What it does NOT prove: that the camera witnessed physical reality. See the
 * threat model — dashAI is tamper-EVIDENT, not tamper-proof.
 */
export async function sealPayload(
  payload: EvidencePayload,
): Promise<SealedEvidence> {
  const { priv, keyId } = await getServerKey();
  const canon = canonicalize(payload);
  const payloadHash = sha256HexOfString(canon);
  const sig = await ed.signAsync(utf8ToBytes(canon), priv);
  return {
    payload,
    algorithm: "Ed25519",
    publicKeyId: keyId,
    payloadHash,
    signature: bytesToHex(sig),
    sealedAt: payload.sealedAt,
  };
}
