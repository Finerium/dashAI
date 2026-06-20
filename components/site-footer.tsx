import Link from "next/link";
import { ShieldCheck, EyeOff, FlaskConical } from "lucide-react";
import { Tag } from "@/components/ui";

/**
 * Global site footer for dashAI.
 * Server component (no hooks / browser APIs). Forensic-evidence-terminal look:
 * near-black surface, hairline rules, monospace data, semantic accents.
 *
 * NOTE: #hukum / #privasi anchors do not yet exist on the landing page, so the
 * "Hukum & Privasi" links fall back to "/" as the task spec instructs.
 */

type FooterLink = { href: string; label: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Produk",
    links: [
      { href: "/live", label: "Live" },
      { href: "/review", label: "Bukti" },
      { href: "/verify", label: "Verifikasi" },
    ],
  },
  {
    title: "Hukum & Privasi",
    links: [
      { href: "/", label: "Dasar hukum" },
      { href: "/", label: "Privasi" },
    ],
  },
  {
    title: "Sumber",
    links: [
      { href: "https://github.com/Finerium/dashAI", label: "GitHub", external: true },
      { href: "https://github.com/Finerium/dashAI/blob/main/LICENSE", label: "Lisensi Apache-2.0", external: true },
    ],
  },
];

// Short, honest disclaimers — what dashAI is and is NOT.
const DISCLAIMERS: { icon: typeof ShieldCheck; text: string }[] = [
  {
    icon: ShieldCheck,
    text: "Tamper-evident, bukan tamper-proof — membuktikan integritas sejak bukti disegel.",
  },
  {
    icon: EyeOff,
    text: "Privacy-by-design — deteksi & blur otomatis, bukan pengenalan identitas.",
  },
  {
    icon: FlaskConical,
    text: "Ini demo teknologi, bukan dokumen resmi kepolisian.",
  },
];

const linkClass =
  "inline-flex items-center text-sm text-dim transition-colors hover:text-amber focus-visible:text-amber";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink-2" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer situs dashAI
      </h2>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand + tagline + honest disclaimers */}
          <div className="max-w-sm">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="relative grid h-7 w-7 place-items-center border border-amber/60">
                <span className="h-2 w-2 bg-amber transition-transform group-hover:scale-125" />
                <span className="pointer-events-none absolute -left-px -top-px h-1.5 w-1.5 border-l border-t border-amber" />
                <span className="pointer-events-none absolute -bottom-px -right-px h-1.5 w-1.5 border-b border-r border-amber" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                dash<span className="text-amber">AI</span>
              </span>
            </Link>

            <p className="mt-4 text-sm text-muted">
              Saksi mata digital yang netral &amp; tertandatangani.
            </p>

            <ul className="mt-5 space-y-2.5">
              {DISCLAIMERS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-xs leading-relaxed text-dim">
                  <Icon
                    aria-hidden
                    strokeWidth={1.5}
                    className="mt-px h-3.5 w-3.5 shrink-0 text-muted"
                  />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="label mb-3">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={linkClass}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-xs text-dim">© 2026 dashAI</p>
          <p className="text-xs text-muted">
            Dibangun untuk keselamatan jalan Indonesia.
          </p>
          <Tag tone="neutral" className="self-start sm:self-auto">
            build · demo
          </Tag>
        </div>
      </div>
    </footer>
  );
}
