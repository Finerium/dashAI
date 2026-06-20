import type { BBox, Detection } from "@/lib/evidence/types";

/** A raw, untracked detection straight from a model (normalised bbox). */
export interface RawDetection {
  cls: string;
  score: number;
  bbox: BBox;
}

export interface FaceBox {
  bbox: BBox;
  score: number;
}

export interface PoseKeypoint {
  x: number;
  y: number;
  score: number;
}

export interface PoseSkeleton {
  keypoints: PoseKeypoint[];
}

/** Everything the renderer and violation engine need for one frame. */
export interface FrameAnalysis {
  width: number;
  height: number;
  ts: number;
  detections: Detection[];
  faces: FaceBox[];
  poses: PoseSkeleton[];
  /** Mean optical-flow-ish heading of all tracks (dominant traffic flow). */
  dominantFlow: { vx: number; vy: number } | null;
}

/** Common interface so the object detector can be swapped (coco-ssd → YOLO). */
export interface ObjectDetector {
  readonly ready: boolean;
  load(): Promise<void>;
  detect(
    input: HTMLVideoElement | HTMLCanvasElement,
  ): Promise<RawDetection[]>;
  dispose(): void;
}

/** COCO classes relevant to traffic enforcement. */
export const TRAFFIC_CLASSES = new Set([
  "car",
  "motorcycle",
  "bus",
  "truck",
  "bicycle",
  "person",
  "traffic light",
]);

export const VEHICLE_CLASSES = new Set(["car", "motorcycle", "bus", "truck", "bicycle"]);
