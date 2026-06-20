import { NextResponse } from "next/server";
import { getPublicKeyInfo } from "@/lib/crypto/keys";

export const runtime = "nodejs";

/** Publishes dashAI's Ed25519 public key so anyone can verify a sealed report
 * without trusting the dashAI UI. */
export async function GET() {
  const info = await getPublicKeyInfo();
  return NextResponse.json(info, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
