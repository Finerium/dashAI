import type { FrameAnalysis } from "./types";
import { CocoDetector } from "./detector";
import { FaceDetectorCV } from "./face";
import { PoseDetectorCV } from "./pose";
import { IouTracker } from "./tracker";

export interface PipelineOptions {
  faces: boolean;
  poses: boolean;
}

export interface PipelineStatus {
  object: boolean;
  face: boolean;
  pose: boolean;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Orchestrates per-frame analysis: object detection → tracking, plus optional
 * face and pose models. Every secondary model is wrapped so a load/inference
 * failure degrades gracefully (the live view keeps running with whatever models
 * succeeded) — a hard requirement for unpredictable mobile browsers.
 */
export class CVPipeline {
  private readonly detector = new CocoDetector();
  private readonly faceCV = new FaceDetectorCV();
  private readonly poseCV = new PoseDetectorCV();
  private readonly tracker = new IouTracker();
  readonly status: PipelineStatus = { object: false, face: false, pose: false };

  constructor(private readonly opts: PipelineOptions = { faces: true, poses: true }) {}

  async load(onProgress?: (s: PipelineStatus) => void): Promise<void> {
    await this.detector.load();
    this.status.object = true;
    onProgress?.({ ...this.status });

    if (this.opts.faces) {
      try {
        await this.faceCV.load();
        this.status.face = true;
      } catch {
        /* faces optional */
      }
      onProgress?.({ ...this.status });
    }
    if (this.opts.poses) {
      try {
        await this.poseCV.load();
        this.status.pose = true;
      } catch {
        /* poses optional */
      }
      onProgress?.({ ...this.status });
    }
  }

  async analyze(video: HTMLVideoElement, tsMs: number): Promise<FrameAnalysis> {
    const width = video.videoWidth;
    const height = video.videoHeight;

    const raws = this.status.object ? await this.detector.detect(video) : [];
    const detections = this.tracker.update(raws, tsMs);

    let faces: FrameAnalysis["faces"] = [];
    if (this.status.face) {
      try {
        faces = this.faceCV.detect(video, tsMs);
      } catch {
        faces = [];
      }
    }

    let poses: FrameAnalysis["poses"] = [];
    if (this.status.pose) {
      try {
        poses = this.poseCV.detect(video, tsMs);
      } catch {
        poses = [];
      }
    }

    const moving = detections.filter(
      (d) => d.vx !== undefined && d.vy !== undefined,
    );
    const dominantFlow = moving.length
      ? { vx: mean(moving.map((d) => d.vx!)), vy: mean(moving.map((d) => d.vy!)) }
      : null;

    return { width, height, ts: tsMs, detections, faces, poses, dominantFlow };
  }

  dispose(): void {
    this.detector.dispose();
    this.faceCV.dispose();
    this.poseCV.dispose();
    this.tracker.reset();
  }
}
