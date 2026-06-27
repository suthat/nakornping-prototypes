"use client";

import { useSimStore } from "@/miniapps/wayfinding/lib/store";
import { SystemView } from "@/miniapps/wayfinding/lib/types";

const TABS: { key: SystemView; num: string; label: string; desc: string }[] = [
  { key: "traffic", num: "1", label: "Human Traffic", desc: "กระแสคน · การรอ · ชีวิต" },
  { key: "insights", num: "2", label: "Insights", desc: "ทำไมคนถึงหลง" },
  { key: "solutions", num: "3", label: "Solutions", desc: "ทางออกการนำทาง" },
];

export function SystemTabs() {
  const active = useSimStore((s) => s.activeSystem);
  const setActive = useSimStore((s) => s.setActiveSystem);

  return (
    <div className="glass fade-up pointer-events-auto rounded-2xl p-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {TABS.map((t) => {
          const on = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all"
              style={{
                background: on ? "#e0732f" : "transparent",
                boxShadow: on ? "0 8px 18px -10px rgba(224,115,47,0.6)" : "none",
              }}
            >
              <span
                className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
                style={{
                  background: on ? "rgba(255,255,255,0.25)" : "rgba(28,37,48,0.06)",
                  color: on ? "#fff" : "#8893a3",
                }}
              >
                {t.num}
              </span>
              <span className="min-w-0">
                <span
                  className="block truncate text-[11.5px] font-semibold leading-tight"
                  style={{ color: on ? "#fff" : "#3a4452" }}
                >
                  {t.label}
                </span>
                <span
                  className="block truncate text-[9px] leading-tight"
                  style={{ color: on ? "rgba(255,255,255,0.85)" : "#8893a3" }}
                >
                  {t.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
