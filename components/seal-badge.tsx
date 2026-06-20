import { cn } from "@/lib/utils";

/** Evidentiary seal state for the badge mark. */
type SealState = "sealed" | "unsealed" | "valid" | "tampered";

interface SealBadgeProps {
  state: SealState;
  size?: "sm" | "md";
}

const CAPTION: Record<SealState, string> = {
  sealed: "TERSEGEL",
  valid: "VALID",
  unsealed: "BELUM SEGEL",
  tampered: "RUSAK",
};

/** Visual tone per state: green = trustworthy, red = compromised, dim = inert. */
function toneFor(state: SealState): "verified" | "signal" | "neutral" {
  if (state === "sealed" || state === "valid") return "verified";
  if (state === "tampered") return "signal";
  return "neutral";
}

const STROKE: Record<"verified" | "signal" | "neutral", string> = {
  verified: "var(--color-verified)",
  signal: "var(--color-signal)",
  neutral: "var(--color-dim)",
};

const TEXT: Record<"verified" | "signal" | "neutral", string> = {
  verified: "text-verified",
  signal: "text-signal",
  neutral: "text-dim",
};

/**
 * A hexagonal evidence seal mark with a tiny mono caption.
 * Server component — purely presentational, no hooks or browser APIs.
 */
export function SealBadge({ state, size = "sm" }: SealBadgeProps) {
  const tone = toneFor(state);
  const stroke = STROKE[tone];
  const isTampered = state === "tampered";
  const px = size === "md" ? 28 : 20;

  return (
    <span
      className={cn("inline-flex flex-col items-center gap-1", TEXT[tone])}
      role="img"
      aria-label={`Status segel: ${CAPTION[state]}`}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cn(isTampered && "pulse-signal")}
      >
        {/* Hexagon shield outline */}
        <path
          d="M12 1.7 21 6.85v10.3L12 22.3 3 17.15V6.85L12 1.7Z"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
          fill={tone === "neutral" ? "none" : `color-mix(in srgb, ${stroke} 10%, transparent)`}
        />
        {isTampered ? (
          // X for tampered evidence
          <path
            d="m8.5 8.5 7 7M15.5 8.5l-7 7"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        ) : tone === "verified" ? (
          // Check for sealed/valid
          <path
            d="m8 12 2.8 2.8L16 9.4"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // Hollow dot for unsealed/inert
          <circle cx={12} cy={12} r={2.4} stroke={stroke} strokeWidth={1.5} />
        )}
      </svg>
      <span
        className={cn(
          "mono uppercase leading-none tracking-[0.14em]",
          size === "md" ? "text-[0.6rem]" : "text-[0.55rem]",
        )}
      >
        {CAPTION[state]}
      </span>
    </span>
  );
}
