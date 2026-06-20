"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/live", label: "Live" },
  { href: "/review", label: "Bukti" },
  { href: "/verify", label: "Verifikasi" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-7 w-7 place-items-center border border-amber/60">
            <span className="h-2 w-2 bg-amber transition-transform group-hover:scale-125" />
            <span className="pointer-events-none absolute -left-px -top-px h-1.5 w-1.5 border-l border-t border-amber" />
            <span className="pointer-events-none absolute -bottom-px -right-px h-1.5 w-1.5 border-b border-r border-amber" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            dash<span className="text-amber">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors",
                  active ? "text-fg" : "text-dim hover:text-muted",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-amber" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
