"use client";

import dynamic from "next/dynamic";
import {
  SCENE_LOADING_LABELS,
  SceneLoadingOverlay,
} from "@/components/scene/SceneLoadingOverlay";

const HubScene = dynamic(
  () => import("./HubScene").then((m) => m.HubScene),
  {
    ssr: false,
    loading: () => (
      <SceneLoadingOverlay label={SCENE_LOADING_LABELS.hub} />
    ),
  }
);

export function HubApp() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <HubScene />
      </div>

      <div className="pointer-events-none absolute inset-0 p-4 sm:p-6">
        <header className="glass fade-up pointer-events-auto max-w-sm rounded-2xl px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8893a3]">
            NKP Simulation
          </p>
          <h1 className="mt-1 text-[17px] font-semibold tracking-tightish text-[#1c2530]">
            เลือกการจำลอง
          </h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#5b6675]">
            คลิกแผ่น 3 มิติด้านล่าง — ลากเพื่อหมุนมุมมอง
          </p>
        </header>
      </div>
    </main>
  );
}

export default HubApp;
