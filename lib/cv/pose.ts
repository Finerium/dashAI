import type { PoseSkeleton } from "./types";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

/**
 * MediaPipe Pose Landmarker — produces the human skeleton ("garis manusia")
 * drawn over detected people. Landmarks are already normalised to 0..1.
 */
export class PoseDetectorCV {
  private landmarker: import("@mediapipe/tasks-vision").PoseLandmarker | null = null;
  ready = false;

  async load(): Promise<void> {
    if (this.ready) return;
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    this.landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 4,
      minPoseDetectionConfidence: 0.5,
    });
    this.ready = true;
  }

  detect(input: HTMLVideoElement, tsMs: number): PoseSkeleton[] {
    if (!this.landmarker) return [];
    const res = this.landmarker.detectForVideo(input, tsMs);
    return (res.landmarks ?? []).map((person) => ({
      keypoints: person.map((lm) => ({
        x: lm.x,
        y: lm.y,
        score: lm.visibility ?? 1,
      })),
    }));
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.ready = false;
  }
}

/** MediaPipe Pose connection pairs (indices) for drawing the skeleton. */
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // arms + shoulders
  [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], [24, 26], [26, 28], // legs
  [27, 31], [28, 32], // feet
  [0, 11], [0, 12], // head to shoulders (approx)
];
