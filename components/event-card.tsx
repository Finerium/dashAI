import Link from "next/link";

import { CornerBrackets, Tag } from "@/components/ui";
import { SceneThumb } from "@/components/scene-frame";
import { SealBadge } from "@/components/seal-badge";
import { VIOLATION_CATALOG } from "@/lib/legal/catalog";
import type { ViolationEvent } from "@/lib/evidence/types";
import { cn, fmtTime, clamp } from "@/lib/utils";

interface EventCardProps {
  event: ViolationEvent;
  href?: string;
}

/**
 * A clickable evidence summary card. Server component (no hooks): becomes a
 * link when `href` is supplied, otherwise renders as a plain article.
 */
export function EventCard({ event, href }: EventCardProps) {
  const meta = VIOLATION_CATALOG[event.violation];
  const isOther = event.subject === "other";
  const confidence = clamp(event.confidence, 0, 1);
  const confidencePct = Math.round(confidence * 100);

  const card = (
    <article
      className={cn(
        "group relative flex gap-3 border border-line bg-surface/40 p-3 transition-all duration-150",
        "hover:-translate-y-0.5 hover:border-amber",
      )}
    >
      <CornerBrackets tone="neutral" />

      {/* Left — scene thumbnail */}
      <div className="relative shrink-0">
        <SceneThumb event={event} className="h-20 w-28 rounded-none" />
      </div>

      {/* Right — violation details */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate pr-1 text-sm font-semibold text-fg">
            {meta.labelId}
          </h3>
          {/* Seal badge top-right */}
          <div className="shrink-0">
            <SealBadge state={event.sealed ? "sealed" : "unsealed"} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tag tone={isOther ? "signal" : "amber"}>
            {isOther ? "PIHAK LAIN" : "DIRI SENDIRI"}
          </Tag>
          <time className="mono text-[0.7rem] text-dim" dateTime={new Date(event.capturedAt).toISOString()}>
            {fmtTime(event.capturedAt)}
          </time>
        </div>

        {/* Confidence bar */}
        <div className="flex items-center gap-2">
          <span className="label shrink-0">YAKIN</span>
          <span className="relative h-1 flex-1 overflow-hidden bg-ink-2" aria-hidden="true">
            <span
              className={cn(
                "absolute inset-y-0 left-0",
                isOther ? "bg-signal" : "bg-amber",
              )}
              style={{ width: `${confidencePct}%` }}
            />
          </span>
          <span className="mono text-[0.7rem] text-muted tabular-nums">{confidencePct}%</span>
        </div>

        {event.plateText ? (
          <div className="mono text-xs tracking-[0.12em] text-fg blur-[3px] select-none">{event.plateText}</div>
        ) : null}
      </div>
    </article>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      aria-label={`Lihat bukti: ${meta.labelId} (${isOther ? "pihak lain" : "diri sendiri"})`}
      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
    >
      {card}
    </Link>
  );
}

export type { EventCardProps };
