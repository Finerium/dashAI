import * as ed from "@noble/ed25519";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

/**
 * Server-side signing key management.
 *
 * Production: set `DASHAI_SIGNING_KEY` to a 32-byte hex Ed25519 seed (the one
 * secret dashAI needs — see README). It is read here and never leaves the
 * server. The matching public key is published via /api/public-key so anyone
 * can verify a report without trusting dashAI's UI.
 *
 * Development: if the env var is missing/invalid, a fixed, clearly-marked DEV
 * key is used so the app runs out of the box. DEV-sealed evidence is labelled
 * `dev-…` and must never be treated as authoritative.
 */
const DEV_KEY_HEX =
  "4f3edf983ac636a65a842ce7c78d9aa706d3b113b37e858da3a7d0a2c7c6b3f1";

interface ServerKey {
  priv: Uint8Array;
  pubHex: string;
  keyId: string;
  isDev: boolean;
}

let cached: ServerKey | null = null;

export async function getServerKey(): Promise<ServerKey> {
  if (cached) return cached;
  const envHex = process.env.DASHAI_SIGNING_KEY?.trim();
  const isValid = !!envHex && /^[0-9a-fA-F]{64}$/.test(envHex);
  const priv = hexToBytes(isValid ? (envHex as string) : DEV_KEY_HEX);
  const pub = await ed.getPublicKeyAsync(priv);
  const pubHex = bytesToHex(pub);
  cached = {
    priv,
    pubHex,
    keyId: (isValid ? "prod-" : "dev-") + pubHex.slice(0, 16),
    isDev: !isValid,
  };
  return cached;
}

/** Public-key descriptor safe to expose to clients. */
export async function getPublicKeyInfo(): Promise<{
  publicKeyHex: string;
  keyId: string;
  algorithm: "Ed25519";
  isDev: boolean;
}> {
  const { pubHex, keyId, isDev } = await getServerKey();
  return { publicKeyHex: pubHex, keyId, algorithm: "Ed25519", isDev };
}
