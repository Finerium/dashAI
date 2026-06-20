import { Suspense } from "react";
import { CornerBrackets } from "@/components/ui";
import { VerifyClient } from "@/components/verify-client";

export const metadata = {
  title: "Verifikasi Segel — dashAI",
  description:
    "Verifikasi tanda tangan Ed25519 dan integritas laporan bukti dashAI, sepenuhnya di sisi peramban.",
};

/**
 * /verify — server shell. The actual verifier reads ?d= via useSearchParams
 * and runs client-side crypto, so it must live in a "use client" island
 * wrapped in <Suspense> (App Router requirement for useSearchParams).
 */
export default function VerifyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Suspense fallback={<VerifyFallback />}>
        <VerifyClient />
      </Suspense>
    </main>
  );
}

/** Inert skeleton shown while the client island hydrates. */
function VerifyFallback() {
  return (
    <div className="hud-frame relative bg-ink-2/50 p-8" aria-busy="true">
      <CornerBrackets tone="neutral" />
      <p className="label">Verifikator</p>
      <p className="mono mt-3 text-sm text-dim">Memuat modul verifikasi…</p>
    </div>
  );
}
