/**
 * Collision / hard-braking detection from the DeviceMotion API.
 *
 * A sudden spike in linear acceleration magnitude is a strong proxy for an
 * impact or emergency braking event — dashAI uses it to auto-trigger an
 * accident-evidence capture so the surrounding footage is sealed even if the
 * driver cannot touch the phone.
 */
export interface MotionEvent {
  /** Peak g-force magnitude observed (1 g ≈ 9.81 m/s²). */
  peakG: number;
  kind: "impact" | "hard-brake";
  at: number;
}

const G = 9.81;
// Thresholds tuned from literature: hard braking ~0.6–0.8 g, a real crash
// produces multi-g spikes. We debounce so one event isn't reported repeatedly.
const HARD_BRAKE_G = 0.75;
const IMPACT_G = 2.5;
const DEBOUNCE_MS = 3000;

export function isMotionAvailable(): boolean {
  return typeof window !== "undefined" && "DeviceMotionEvent" in window;
}

/** iOS 13+ gates motion behind an explicit user gesture + permission. */
export async function requestMotionPermission(): Promise<boolean> {
  if (!isMotionAvailable()) return false;
  const anyEvt = DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  if (typeof anyEvt.requestPermission === "function") {
    try {
      return (await anyEvt.requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  return true; // non-iOS: no explicit permission needed
}

export function startMotionDetection(onEvent: (e: MotionEvent) => void): () => void {
  if (!isMotionAvailable()) return () => {};
  let lastFired = 0;

  const handler = (ev: DeviceMotionEvent) => {
    const a = ev.acceleration ?? ev.accelerationIncludingGravity;
    if (!a) return;
    const ax = a.x ?? 0;
    const ay = a.y ?? 0;
    const az = a.z ?? 0;
    // When falling back to accelerationIncludingGravity, subtract 1 g baseline.
    const includesGravity = !ev.acceleration;
    const mag = Math.sqrt(ax * ax + ay * ay + az * az) / G;
    const net = includesGravity ? Math.abs(mag - 1) : mag;

    const now = Date.now();
    if (net >= HARD_BRAKE_G && now - lastFired > DEBOUNCE_MS) {
      lastFired = now;
      onEvent({
        peakG: Number(net.toFixed(2)),
        kind: net >= IMPACT_G ? "impact" : "hard-brake",
        at: now,
      });
    }
  };

  window.addEventListener("devicemotion", handler);
  return () => window.removeEventListener("devicemotion", handler);
}
