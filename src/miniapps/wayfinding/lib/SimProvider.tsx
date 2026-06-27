"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { Simulation } from "./simulation";
import { useSimStore } from "./store";
import { DEFAULT_CONFIG } from "./types";

const SimContext = createContext<Simulation | null>(null);

export function SimProvider({ children }: { children: React.ReactNode }) {
  const simRef = useRef<Simulation | null>(null);
  if (!simRef.current) {
    simRef.current = new Simulation(DEFAULT_CONFIG);
  }
  const config = useSimStore((s) => s.config);
  const resetToken = useSimStore((s) => s.resetToken);

  useEffect(() => {
    simRef.current?.applyConfig(config);
  }, [config]);

  useEffect(() => {
    if (resetToken > 0) {
      simRef.current?.reset(useSimStore.getState().config);
    }
  }, [resetToken]);

  return (
    <SimContext.Provider value={simRef.current}>{children}</SimContext.Provider>
  );
}

export function useSim(): Simulation {
  const sim = useContext(SimContext);
  if (!sim) throw new Error("useSim must be used within SimProvider");
  return sim;
}
