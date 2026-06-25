"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useSim } from "@/miniapps/tb-airborne/lib/SimProvider";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";

export function SimDriver() {
  const sim = useSim();
  const statAccum = useRef(0);

  useFrame((_, delta) => {
    const { running, config } = useSimStore.getState();
    const dt = Math.min(delta, 0.1);
    if (running) {
      sim.step(dt * config.simSpeed);
    }
    statAccum.current += delta;
    if (statAccum.current >= 0.2) {
      statAccum.current = 0;
      useSimStore
        .getState()
        .setStats(sim.getStats(), sim.getZoneSnapshots());
    }
  });

  return null;
}
