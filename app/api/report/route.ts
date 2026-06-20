import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { ReportDocument } from "@/lib/report/ReportDocument";
import { getServerKey } from "@/lib/crypto/keys";
import type { ReportKind, SealedEvidence } from "@/lib/evidence/types";

export const runtime = "nodejs";

/**
 * Render a signed evidence report to PDF. The verification data travels *inside*
 * the document (QR + URL encode the full sealed envelope), so verification is
 * self-contained and needs no database lookup — tamper-evidence without state.
 */
export async function POST(req: Request) {
  let sealed: SealedEvidence;
  let kind: ReportKind | undefined;
  try {
    const body = (await req.json()) as { sealed: SealedEvidence; kind?: ReportKind };
    sealed = body.sealed;
    kind = body.kind;
  } catch {
    return Response.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  if (!sealed?.payload || !sealed?.signature) {
    return Response.json({ error: "Envelope tidak lengkap." }, { status: 400 });
  }

  const reportKind: ReportKind =
    kind ?? (sealed.payload.subject === "self" ? "coaching" : "tilang");
  const origin = new URL(req.url).origin;
  const encoded = Buffer.from(JSON.stringify(sealed)).toString("base64url");
  const verifyUrl = `${origin}/verify?d=${encoded}`;

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    /* QR is best-effort; the URL is also printed in the PDF */
  }

  const { isDev } = await getServerKey();
  const element = ReportDocument({
    sealed,
    kind: reportKind,
    qrDataUrl,
    verifyUrl,
    isDev,
  }) as unknown as Parameters<typeof renderToBuffer>[0];

  const buffer = await renderToBuffer(element);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dashAI-${reportKind}-${sealed.payload.eventId}.pdf"`,
    },
  });
}
