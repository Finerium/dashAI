import * as ed from "@noble/ed25519";
import { hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import type { SealedEvidence, VerificationResult } from "@/lib/evidence/types";
import { canonicalize, sha256HexOfString } from "./canonical";

/**
 * Verify a sealed evidence envelope against a published public key.
 *
 * Runs unchanged in the browser and on the server (uses @noble/ed25519, which
 * relies on the Web Crypto SHA-512 — available in both). Two independent
 * checks must pass: (1) the canonical hash matches, proving the payload was not
 * edited; (2) the Ed25519 signature is valid for that payload under the key.
 */
export async function verifySealed(
  sealed: SealedEvidence,
  publicKeyHex: string,
): Promise<VerificationResult> {
  const canon = canonicalize(sealed.payload);
  const recomputedHash = sha256HexOfString(canon);
  const hashMatches = recomputedHash === sealed.payloadHash;

  let signatureValid = false;
  try {
    signatureValid = await ed.verifyAsync(
      hexToBytes(sealed.signature),
      utf8ToBytes(canon),
      hexToBytes(publicKeyHex),
    );
  } catch {
    signatureValid = false;
  }

  const valid = hashMatches && signatureValid;
  const reason = valid
    ? "Tanda tangan sah dan isi laporan utuh (tidak diubah sejak disegel)."
    : !hashMatches
      ? "Hash payload tidak cocok — isi laporan telah diubah setelah disegel."
      : "Tanda tangan Ed25519 tidak valid untuk kunci publik ini.";

  return {
    valid,
    reason,
    hashMatches,
    signatureValid,
    publicKeyId: sealed.publicKeyId,
    checkedAt: Date.now(),
  };
}
