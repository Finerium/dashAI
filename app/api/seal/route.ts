import { NextResponse } from "next/server";
import { sealPayload } from "@/lib/crypto/sign";
import { buildPayload } from "@/lib/evidence/payload";
import type { ViolationEvent } from "@/lib/evidence/types";

export const runtime = "nodejs";

interface SealBody {
  event?: ViolationEvent;
  mediaHashes?: { frame?: string; faceCrop?: string; plateCrop?: string };
  device?: { userAgent?: string; platform?: string };
}

/**
 * Seal an evidence payload. The client sends the event; the server stamps the
 * authoritative time, attaches the legal citation, and signs. The signature
 * proves the payload is unchanged since sealing — it does NOT attest the camera
 * witnessed reality (see /verify + the threat model).
 */
export async function POST(req: Request) {
  let body: SealBody;
  try {
    body = (await req.json()) as SealBody;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const event = body.event;
  if (!event?.id || !event?.violation || !event?.subject || !event?.capturedAt) {
    return NextResponse.json(
      { error: "Event tidak lengkap (butuh id, violation, subject, capturedAt)." },
      { status: 400 },
    );
  }

  const sealedAt = Date.now();
  const payload = buildPayload(event, sealedAt, {
    mediaHashes: body.mediaHashes,
    device: body.device,
  });
  const sealed = await sealPayload(payload);
  return NextResponse.json(sealed);
}
