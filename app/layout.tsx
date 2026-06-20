import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const display = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "dashAI — Saksi Mata Digital",
  description:
    "Dashcam ber-AI yang mendeteksi pelanggaran lalu lintas secara real-time, mengutip UU LLAJ, dan menyegel bukti secara kriptografis (tamper-evident). Melindungi pengendara dari fitnah & tilang palsu.",
  applicationName: "dashAI",
  manifest: "/manifest.webmanifest",
  keywords: ["dashcam", "ETLE", "computer vision", "tilang", "tamper-evident", "Indonesia"],
  authors: [{ name: "dashAI" }],
  openGraph: {
    title: "dashAI — Saksi Mata Digital",
    description:
      "Bukti pelanggaran lalu lintas real-time, tersitasi UU, dan tertandatangani kriptografis.",
    type: "website",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${display.variable} ${mono.variable} h-full`}>
      <body className="min-h-dvh flex flex-col antialiased">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-amber focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-fg"
        >
          Lewati ke konten
        </a>
        <SiteHeader />
        <main id="konten" tabIndex={-1} className="flex-1 flex flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
