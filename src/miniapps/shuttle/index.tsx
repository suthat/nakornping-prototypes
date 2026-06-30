"use client";

import dynamic from "next/dynamic";
import {
  SCENE_LOADING_LABELS,
  SceneLoadingOverlay,
} from "@/components/scene/SceneLoadingOverlay";
import { SimProvider } from "@/miniapps/shuttle/lib/SimProvider";
import { Header } from "@/miniapps/shuttle/components/ui/Header";
import { ConfigPanel } from "@/miniapps/shuttle/components/ui/ConfigPanel";
import { StatsPanel } from "@/miniapps/shuttle/components/ui/StatsPanel";
import { Legend } from "@/miniapps/shuttle/components/ui/Legend";

const Scene = dynamic(
  () =>
    import("@/miniapps/shuttle/components/Scene").then((m) => m.Scene),
  {
    ssr: false,
    loading: () => (
      <SceneLoadingOverlay label={SCENE_LOADING_LABELS.simulation} />
    ),
  }
);

export function ShuttleApp() {
  return (
    <SimProvider>
      <main className="relative h-screen w-screen overflow-hidden">
        <div className="absolute inset-0">
          <Scene />
        </div>

        <div className="pointer-events-none absolute inset-0 p-4 sm:p-5">
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-4">
                <Header />
                <ConfigPanel />
              </div>
              <StatsPanel />
            </div>
            <div className="flex justify-center">
              <Legend />
            </div>
          </div>
        </div>
      </main>
    </SimProvider>
  );
}

export default ShuttleApp;
