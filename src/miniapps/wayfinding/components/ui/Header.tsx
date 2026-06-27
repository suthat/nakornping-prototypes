"use client";

import { useSimStore } from "@/miniapps/wayfinding/lib/store";
import { WEATHER } from "@/miniapps/wayfinding/lib/types";

function fmtDayClock(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function Header() {
  const stats = useSimStore((s) => s.stats);
  const running = useSimStore((s) => s.running);
  const weather = useSimStore((s) => s.config.weather);
  const wp = WEATHER[weather];
  const isRain = weather !== "clear";
  const hot = stats ? stats.crowdFactor >= 1.4 : false;

  return (
    <div className="glass fade-up pointer-events-auto rounded-2xl px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0732f] text-white shadow-lg shadow-orange-500/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z" />
            <circle cx="12" cy="11" r="2.2" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold leading-tight tracking-tightish text-[#1c2530]">
            NKP Wayfinding & Human Traffic
          </h1>
          <p className="truncate text-[11px] leading-tight text-[#5b6675]">
            รพ.นครพิงค์ · ชีวิตคนใน รพ. ไม่ใช่แค่ A→B
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-[var(--line)] pt-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              running ? "bg-emerald-500" : "bg-amber-400"
            }`}
            style={{
              boxShadow: running
                ? "0 0 0 3px rgba(16,185,129,0.18)"
                : "0 0 0 3px rgba(245,158,11,0.18)",
            }}
          />
          <span className="text-[11px] font-medium text-[#5b6675]">
            {running ? "กำลังจำลอง" : "หยุดชั่วคราว"}
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
          style={{
            background: isRain ? "rgba(47,109,240,0.12)" : "rgba(28,37,48,0.06)",
            color: isRain ? "#2f6df0" : "#5b6675",
          }}
        >
          {wp.label}
        </span>
        <div className="mono ml-auto flex items-baseline gap-1">
          <span className="text-[14px] font-semibold leading-none text-[#1c2530]">
            {stats ? fmtDayClock(stats.dayMinutes) : "07:00"}
          </span>
          <span className="text-[9px] text-[#8893a3]">น.</span>
        </div>
      </div>
      {stats && (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-[#1c2530]/[0.04] px-2.5 py-2">
          <span
            className="text-[11px] font-semibold"
            style={{ color: hot ? "#ec5b54" : "#3a4452" }}
          >
            {stats.periodLabel}
          </span>
          <span
            className="mono rounded-full px-1.5 text-[9px] font-semibold"
            style={{
              background: hot ? "rgba(236,91,84,0.12)" : "rgba(28,37,48,0.06)",
              color: hot ? "#ec5b54" : "#5b6675",
            }}
          >
            ×{stats.crowdFactor.toFixed(1)}
          </span>
          <span className="mono ml-auto text-[11px] text-[#5b6675]">
            ในพื้นที่ {stats.totalAgents} คน
          </span>
        </div>
      )}
    </div>
  );
}
