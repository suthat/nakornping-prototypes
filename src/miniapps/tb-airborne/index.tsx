"use client";

import dynamic from "next/dynamic";
import { SimProvider } from "@/miniapps/tb-airborne/lib/SimProvider";
import { Header } from "@/miniapps/tb-airborne/components/ui/Header";
import { ConfigPanel } from "@/miniapps/tb-airborne/components/ui/ConfigPanel";
import { StatsPanel } from "@/miniapps/tb-airborne/components/ui/StatsPanel";
import { Legend } from "@/miniapps/tb-airborne/components/ui/Legend";

const Scene = dynamic(
  () =>
    import("@/miniapps/tb-airborne/components/Scene").then((m) => m.Scene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-[13px] font-medium text-[#5b6675]">
          กำลังโหลดฉากจำลอง 3 มิติ…
        </div>
      </div>
    ),
  }
);

export function TbAirborneApp() {
  return (
    <SimProvider>
      <main className="relative h-screen w-screen overflow-hidden">
        <div className="absolute inset-0">
          <Scene />
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex min-h-0 flex-1 items-stretch gap-4">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
              <Header />
              <ConfigPanel />
            </div>
            <div className="flex h-full min-h-0 w-[290px] shrink-0 flex-col">
              <StatsPanel />
            </div>
          </div>
          <div className="flex shrink-0 gap-4">
            <div className="flex min-w-0 flex-1 justify-center">
              <Legend />
            </div>
            <div className="w-[290px] shrink-0" aria-hidden="true" />
          </div>
        </div>
      </main>
    </SimProvider>
  );
}

export default TbAirborneApp;
