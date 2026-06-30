"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  SCENE_LOADING_LABELS,
  SceneLoadingOverlay,
} from "@/components/scene/SceneLoadingOverlay";
import { MINI_APPS } from "@/lib/miniapps";

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
            คลิกแผ่น 3 มิติด้านล่าง หรือเลือกจากรายการ — ลากเพื่อหมุนมุมมอง
          </p>
        </header>

        <nav
          aria-label="รายการ mini app"
          className="glass fade-up pointer-events-auto absolute right-4 top-4 w-[220px] rounded-2xl p-3 sm:right-6 sm:top-6"
          style={{ animationDelay: "0.08s" }}
        >
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8893a3]">
            {MINI_APPS.length} การจำลอง
          </p>
          <ul className="flex flex-col gap-1.5">
            {MINI_APPS.map((app) => (
              <li key={app.id}>
                <Link
                  href={app.href}
                  className="group flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/70"
                >
                  <span
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: app.color }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[#1c2530] group-hover:text-[#2f6df0]">
                      {app.title}
                    </span>
                    <span className="mt-0.5 block text-[10.5px] leading-snug text-[#8893a3]">
                      {app.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}

export default HubApp;
