import type { FaceBox } from "./types";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

/**
 * MediaPipe BlazeFace short-range face detector. dashAI does face DETECTION
 * only (locating faces to crop + blur) — never recognition. This is the
 * privacy-by-design boundary: we never match a face to an identity.
 */
export class FaceDetectorCV {
  private detector: import("@mediapipe/tasks-vision").FaceDetector | null = null;
  ready = false;

  async load(): Promise<void> {
    if (this.ready) return;
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    this.detector = await vision.FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.5,
    });
    this.ready = true;
  }

  detect(input: HTMLVideoElement, tsMs: number): FaceBox[] {
    if (!this.detector) return [];
    const w = input.videoWidth;
    const h = input.videoHeight;
    if (!w || !h) return [];
    const res = this.detector.detectForVideo(input, tsMs);
    return (res.detections ?? []).map((d) => {
      const b = d.boundingBox!;
      return {
        score: d.categories?.[0]?.score ?? 1,
        bbox: { x: b.originX / w, y: b.originY / h, w: b.width / w, h: b.height / h },
      };
    });
  }

  dispose(): void {
    this.detector?.close();
    this.detector = null;
    this.ready = false;
  }
}
