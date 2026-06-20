import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

/**
 * Deterministic JSON serialization with recursively sorted object keys.
 *
 * Two semantically-equal payloads must serialise to byte-identical strings so
 * that the hash + signature are stable across client and server. `undefined`
 * values are dropped (they are not representable in JSON anyway).
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    const src = v as Record<string, unknown>;
    return Object.keys(src)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        if (src[k] !== undefined) acc[k] = sortDeep(src[k]);
        return acc;
      }, {});
  }
  return v;
}

export function sha256HexOfString(s: string): string {
  return bytesToHex(sha256(utf8ToBytes(s)));
}

export function sha256HexOfBytes(b: Uint8Array): string {
  return bytesToHex(sha256(b));
}
