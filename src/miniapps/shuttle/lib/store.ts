import { create } from "zustand";
import { DEFAULT_CONFIG, SimConfig, SimStats, StopSnapshot } from "./types";

interface SimState {
  config: SimConfig;
  running: boolean;
  stats: SimStats | null;
  stopStats: StopSnapshot[];
  selectedStop: number | null;
  resetToken: number;
  setConfig: (patch: Partial<SimConfig>) => void;
  setRunning: (v: boolean) => void;
  toggleRunning: () => void;
  reset: () => void;
  setStats: (stats: SimStats, stops: StopSnapshot[]) => void;
  setSelectedStop: (id: number | null) => void;
}

export const useSimStore = create<SimState>((set) => ({
  config: { ...DEFAULT_CONFIG },
  running: true,
  stats: null,
  stopStats: [],
  selectedStop: null,
  resetToken: 0,
  setConfig: (patch) =>
    set((s) => ({ config: { ...s.config, ...patch } })),
  setRunning: (v) => set({ running: v }),
  toggleRunning: () => set((s) => ({ running: !s.running })),
  reset: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  setStats: (stats, stops) => set({ stats, stopStats: stops }),
  setSelectedStop: (id) => set({ selectedStop: id }),
}));
