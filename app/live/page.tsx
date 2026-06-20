import { Suspense } from "react";
import { LiveClient } from "@/components/live-client";

export const metadata = {
  title: "Live · dashAI",
  description:
    "Pemindaian pelanggaran lalu lintas langsung dari kamera, dengan analisis CV di perangkat dan penyegelan bukti kriptografis.",
};

// The live view is entirely client-driven (camera, CV models, sensors). The
// server shell stays minimal and defers the heavy work to <LiveClient/>, which
// is wrapped in Suspense so any internal lazy boundaries (search params, dynamic
// imports inside the CV pipeline) have a fallback.
export default function LivePage() {
  return (
    <Suspense fallback={<LiveFallback />}>
      <LiveClient />
    </Suspense>
  );
}

function LiveFallback() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-7xl items-center justify-center px-4">
      <p className="label">Memuat antarmuka live…</p>
    </div>
  );
}
