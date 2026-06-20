import type { ObjectDetector, RawDetection } from "./types";
import { TRAFFIC_CLASSES } from "./types";

/**
 * COCO-SSD object detector (TensorFlow.js). Weights load from the TF Hub CDN at
 * runtime — nothing is bundled, so deployment is a static export. The interface
 * is {@link ObjectDetector} so this can later be swapped for a YOLOv8 ONNX
 * backend without touching the pipeline.
 */
export class CocoDetector implements ObjectDetector {
  private model: import("@tensorflow-models/coco-ssd").ObjectDetection | null = null;
  ready = false;

  async load(): Promise<void> {
    if (this.ready) return;
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    try {
      await tf.setBackend("webgl");
    } catch {
      // fall back to whatever backend registered (cpu/wasm)
    }
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    this.model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    this.ready = true;
  }

  async detect(
    input: HTMLVideoElement | HTMLCanvasElement,
  ): Promise<RawDetection[]> {
    if (!this.model) return [];
    const w =
      input instanceof HTMLVideoElement ? input.videoWidth : input.width;
    const h =
      input instanceof HTMLVideoElement ? input.videoHeight : input.height;
    if (!w || !h) return [];

    const preds = await this.model.detect(input, 20, 0.45);
    return preds
      .filter((p) => TRAFFIC_CLASSES.has(p.class))
      .map((p) => ({
        cls: p.class,
        score: p.score,
        bbox: {
          x: p.bbox[0] / w,
          y: p.bbox[1] / h,
          w: p.bbox[2] / w,
          h: p.bbox[3] / h,
        },
      }));
  }

  dispose(): void {
    this.model?.dispose?.();
    this.model = null;
    this.ready = false;
  }
}
