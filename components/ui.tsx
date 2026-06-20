import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "signal" | "amber" | "verified" | "neutral";

const TONE_TEXT: Record<Tone, string> = {
  signal: "text-signal",
  amber: "text-amber",
  verified: "text-verified",
  neutral: "text-muted",
};

const TONE_BORDER: Record<Tone, string> = {
  signal: "border-signal/40",
  amber: "border-amber/40",
  verified: "border-verified/40",
  neutral: "border-line",
};

/** Four HUD L-brackets around a relatively-positioned container. */
export function CornerBrackets({ tone = "amber" }: { tone?: Tone }) {
  const color =
    tone === "signal"
      ? "var(--color-signal)"
      : tone === "verified"
        ? "var(--color-verified)"
        : tone === "neutral"
          ? "var(--color-line-strong)"
          : "var(--color-amber)";
  const base = "pointer-events-none absolute h-3.5 w-3.5";
  return (
    <>
      <span className={cn(base, "left-0 top-0 border-l-2 border-t-2")} style={{ borderColor: color }} />
      <span className={cn(base, "right-0 top-0 border-r-2 border-t-2")} style={{ borderColor: color }} />
      <span className={cn(base, "bottom-0 left-0 border-b-2 border-l-2")} style={{ borderColor: color }} />
      <span className={cn(base, "bottom-0 right-0 border-b-2 border-r-2")} style={{ borderColor: color }} />
    </>
  );
}

export function StatusDot({ tone = "verified", pulse = false }: { tone?: Tone; pulse?: boolean }) {
  const bg =
    tone === "signal"
      ? "bg-signal"
      : tone === "amber"
        ? "bg-amber"
        : tone === "verified"
          ? "bg-verified"
          : "bg-dim";
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", bg, "pulse-signal")} />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", bg)} />
    </span>
  );
}

export function Tag({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]",
        "font-[family-name:var(--font-jb)]",
        TONE_TEXT[tone],
        TONE_BORDER[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DataRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-0">
      <span className="label shrink-0">{label}</span>
      <span className={cn("mono text-right text-sm", tone ? TONE_TEXT[tone] : "text-fg")}>{value}</span>
    </div>
  );
}

export function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="mono text-xs text-amber">{index}</span>
      <span className="h-px flex-1 bg-line" />
      <span className="label">{children}</span>
    </div>
  );
}

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" = "primary",
  className?: string,
): string {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 h-11 text-sm font-semibold tracking-wide transition-all duration-150 select-none";
  const variants = {
    primary: "bg-amber text-ink hover:bg-amber/85 active:scale-[0.98]",
    secondary:
      "border border-line-strong text-fg hover:border-amber hover:text-amber bg-surface/40",
    ghost: "text-muted hover:text-fg",
  };
  return cn(base, variants[variant], className);
}
