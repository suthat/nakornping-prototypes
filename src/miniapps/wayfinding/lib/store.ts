import { create } from "zustand";
import {
  DEFAULT_CONFIG,
  NavSolution,
  SimConfig,
  SimStats,
  SystemView,
} from "./types";

interface SimState {
  config: SimConfig;
  running: boolean;
  stats: SimStats | null;
  activeSystem: SystemView;
  selectedNode: number | null;
  resetToken: number;
  setConfig: (patch: Partial<SimConfig>) => void;
  setSolution: (key: NavSolution, on: boolean) => void;
  setRunning: (v: boolean) => void;
  toggleRunning: () => void;
  reset: () => void;
  setStats: (stats: SimStats) => void;
  setActiveSystem: (s: SystemView) => void;
  setSelectedNode: (id: number | null) => void;
}

export const useSimStore = create<SimState>((set) => ({
  config: { ...DEFAULT_CONFIG, solutions: { ...DEFAULT_CONFIG.solutions } },
  running: true,
  stats: null,
  activeSystem: "traffic",
  selectedNode: null,
  resetToken: 0,
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  setSolution: (key, on) =>
    set((s) => ({
      config: { ...s.config, solutions: { ...s.config.solutions, [key]: on } },
    })),
  setRunning: (v) => set({ running: v }),
  toggleRunning: () => set((s) => ({ running: !s.running })),
  reset: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  setStats: (stats) => set({ stats }),
  setActiveSystem: (activeSystem) => set({ activeSystem }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
}));
