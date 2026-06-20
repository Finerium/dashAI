import { NextResponse } from "next/server";
import { verifySealed } from "@/lib/crypto/verify";
import { getServerKey } from "@/lib/crypto/keys";
import type { SealedEvidence } from "@/lib/evidence/types";

export const runtime = "nodejs";

/** Server-side verification convenience endpoint. The /verify page also verifies
 * client-side using /api/public-key, so trust never depends on this route. */
export async function POST(req: Request) {
  let sealed: SealedEvidence;
  try {
    sealed = ((await req.json()) as { sealed: SealedEvidence }).sealed;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  if (!sealed?.signature || !sealed?.payload) {
    return NextResponse.json({ error: "Envelope tidak lengkap." }, { status: 400 });
  }
  const { pubHex } = await getServerKey();
  const result = await verifySealed(sealed, pubHex);
  return NextResponse.json(result);
}
