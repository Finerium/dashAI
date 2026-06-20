"use client";

import { create } from "zustand";
import type { GeoPoint, RoadContext, ViolationEvent } from "@/lib/evidence/types";
import type { PipelineStatus } from "@/lib/cv/pipeline";

export type LiveStatus = "idle" | "starting" | "running" | "error";

interface SessionState {
  status: LiveStatus;
  statusMessage: string;
  pipeline: PipelineStatus;
  fps: number;
  detectionCount: number;
  events: ViolationEvent[];
  geo: GeoPoint | null;
  road: RoadContext | null;
  egoSpeedKmh: number | null;

  setStatus: (status: LiveStatus, message?: string) => void;
  setPipeline: (p: PipelineStatus) => void;
  setFps: (fps: number) => void;
  setDetectionCount: (n: number) => void;
  setGeo: (geo: GeoPoint | null, road: RoadContext | null, ego: number | null) => void;
  addEvent: (e: ViolationEvent) => void;
  updateEvent: (id: string, patch: Partial<ViolationEvent>) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  status: "idle",
  statusMessage: "",
  pipeline: { object: false, face: false, pose: false },
  fps: 0,
  detectionCount: 0,
  events: [],
  geo: null,
  road: null,
  egoSpeedKmh: null,

  setStatus: (status, message = "") => set({ status, statusMessage: message }),
  setPipeline: (pipeline) => set({ pipeline }),
  setFps: (fps) => set({ fps }),
  setDetectionCount: (detectionCount) => set({ detectionCount }),
  setGeo: (geo, road, egoSpeedKmh) => set({ geo, road, egoSpeedKmh }),
  addEvent: (e) => set((s) => ({ events: [e, ...s.events] })),
  updateEvent: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  reset: () =>
    set({
      status: "idle",
      statusMessage: "",
      fps: 0,
      detectionCount: 0,
      events: [],
    }),
}));
