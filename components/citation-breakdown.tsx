import { BadgeCheck, ShieldAlert, Scale, ExternalLink } from "lucide-react";
import { CornerBrackets, Tag, DataRow } from "@/components/ui";
import { VIOLATION_CATALOG } from "@/lib/legal/catalog";
import { citationFor } from "@/lib/legal/citations";
import type { ViolationKey } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

/**
 * Forensic legal panel: maps a violation key to its catalog metadata and the
 * verified UU 22/2009 citation, rendered as a sealed-evidence dossier.
 * Pure server component (no hooks / browser APIs).
 */
export function CitationBreakdown({
  violation,
  confidence,
  compact = false,
}: {
  violation: ViolationKey;
  confidence?: number;
  compact?: boolean;
}) {
  const meta = VIOLATION_CATALOG[violation];
  const cite = citationFor(violation);

  // Prefer an explicit numeric confidence; otherwise echo the citation grade.
  const confLabel =
    typeof confidence === "number"
      ? `${Math.round(confidence * 100)}%`
      : cite.confidence.toUpperCase();

  const pasalValue = cite.ayat ? `${cite.pasal} ${cite.ayat}` : cite.pasal;

  return (
    <article className="hud-frame relative bg-ink-2/60 p-5">
      <CornerBrackets tone={cite.verified ? "verified" : "amber"} />

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-balance text-lg font-semibold leading-tight text-fg sm:text-xl">
            {meta.labelId}
          </h3>
          <p className="mt-0.5 text-xs text-dim">{meta.labelEn}</p>
        </div>
        {cite.verified ? (
          <Tag tone="verified" className="shrink-0">
            <BadgeCheck size={12} strokeWidth={1.5} aria-hidden />
            TERVERIFIKASI {confLabel}
          </Tag>
        ) : (
          <Tag tone="amber" className="shrink-0">
            <ShieldAlert size={12} strokeWidth={1.5} aria-hidden />
            BELUM TERVERIFIKASI {confLabel}
          </Tag>
        )}
      </header>

      {/* Statute reference */}
      <div className={cn("mt-4", compact && "border-t border-line pt-3")}>
        {!compact && <DataRow label="Undang-undang" value={cite.uu} />}
        <DataRow label="Pasal" value={pasalValue} />
      </div>

      {/* Full article text (bunyi pasal) */}
      {!compact && (
        <blockquote className="mt-4 border-l-2 border-amber pl-3 text-sm italic leading-relaxed text-muted">
          {cite.bunyi}
        </blockquote>
      )}

      {/* Sanction */}
      <div className="mt-4">
        <DataRow label="Ancaman / sanksi" value={cite.sanksi} tone="signal" />
        {!compact &&
          (typeof cite.dendaMaxRupiah === "number" || cite.kurunganMax) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {typeof cite.dendaMaxRupiah === "number" && (
                <Tag tone="signal">
                  <Scale size={12} strokeWidth={1.5} aria-hidden />
                  Denda maks Rp{cite.dendaMaxRupiah.toLocaleString("id-ID")}
                </Tag>
              )}
              {cite.kurunganMax && (
                <Tag tone="signal">Kurungan maks {cite.kurunganMax}</Tag>
              )}
            </div>
          )}
      </div>

      {/* Detection basis */}
      {!compact && (
        <div className="mt-4">
          <p className="label mb-1">Dasar deteksi</p>
          <p className="text-xs leading-relaxed text-dim">{meta.detectionBasis}</p>
        </div>
      )}

      {/* Related articles */}
      {!compact && cite.relatedArticles && cite.relatedArticles.length > 0 && (
        <div className="mt-4">
          <p className="label mb-1.5">Pasal terkait</p>
          <ul className="space-y-1">
            {cite.relatedArticles.map((art, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs leading-relaxed text-muted"
              >
                <span className="mono text-dim" aria-hidden>
                  &rsaquo;
                </span>
                <span>{art}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verified sources */}
      {!compact && cite.sources && cite.sources.length > 0 && (
        <details className="group mt-4 border-t border-line pt-3">
          <summary className="label cursor-pointer list-none text-dim transition-colors hover:text-amber">
            Sumber terverifikasi ({cite.sources.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {cite.sources.map((src, i) => (
              <li key={i}>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono inline-flex max-w-full items-start gap-1.5 text-xs text-dim underline decoration-line-strong underline-offset-2 transition-colors hover:text-amber"
                >
                  <ExternalLink
                    size={11}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">{src}</span>
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
