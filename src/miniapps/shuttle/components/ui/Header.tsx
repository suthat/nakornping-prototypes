"use client";

import { useSimStore } from "@/miniapps/shuttle/lib/store";
import { WEATHER } from "@/miniapps/shuttle/lib/types";

function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDayClock(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function rushPeriod(factor: number, inbound: number) {
  if (factor >= 1.4) {
    if (inbound > 0.6)
      return { label: "เร่งด่วนเช้า", dir: "ผู้โดยสารมุ่งเข้า รพ.", hot: true };
    if (inbound < 0.4)
      return { label: "เร่งด่วนเย็น", dir: "ผู้โดยสารออกสู่ลานจอด", hot: true };
    return { label: "ชั่วโมงเร่งด่วน", dir: "หนาแน่น", hot: true };
  }
  if (factor < 0.5) return { label: "ช่วงเงียบ", dir: "ผู้โดยสารบางตา", hot: false };
  return { label: "ช่วงปกติ", dir: "การเดินทางสมดุล", hot: false };
}

export function Header() {
  const stats = useSimStore((s) => s.stats);
  const running = useSimStore((s) => s.running);
  const weather = useSimStore((s) => s.config.weather);
  const rushOn = useSimStore((s) => s.config.rushHour);
  const wp = WEATHER[weather];
  const isRain = weather !== "clear";
  const period =
    stats && rushOn ? rushPeriod(stats.demandFactor, stats.inbound) : null;

  return (
    <div className="glass fade-up pointer-events-auto rounded-2xl px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f6df0] text-white shadow-lg shadow-blue-500/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6v6M16 6v6M2 12h20M5 18h14a2 2 0 0 0 2-2V8a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v8a2 2 0 0 0 2 2Z" />
            <circle cx="7" cy="18" r="1.6" fill="currentColor" />
            <circle cx="17" cy="18" r="1.6" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight tracking-tightish text-[#1c2530]">
            NKP Shuttle Simulation
          </h1>
          <p className="text-[11px] leading-tight text-[#5b6675]">
            รพ.นครพิงค์ · จำลองเส้นทางรถรับส่งลานจอด
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-[var(--line)] pt-2.5">
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
          className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
          style={{
            background: isRain ? "rgba(47,109,240,0.12)" : "rgba(28,37,48,0.06)",
            color: isRain ? "#2f6df0" : "#5b6675",
          }}
        >
          {wp.label}
        </span>
        <div className="mono text-[12px] font-semibold text-[#1c2530]">
          {stats ? fmtClock(stats.simTime) : "00:00"}
        </div>
      </div>
      {period && stats && (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-[#1c2530]/[0.04] px-2.5 py-2">
          <div className="mono flex items-baseline gap-1">
            <span className="text-[15px] font-semibold leading-none text-[#1c2530]">
              {fmtDayClock(stats.dayMinutes)}
            </span>
            <span className="text-[9px] text-[#8893a3]">น.</span>
          </div>
          <div className="h-7 w-px bg-[var(--line)]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[11px] font-semibold"
                style={{ color: period.hot ? "#ec5b54" : "#3a4452" }}
              >
                {period.label}
              </span>
              <span
                className="mono rounded-full px-1.5 text-[9px] font-semibold"
                style={{
                  background: period.hot
                    ? "rgba(236,91,84,0.12)"
                    : "rgba(28,37,48,0.06)",
                  color: period.hot ? "#ec5b54" : "#5b6675",
                }}
              >
                ×{stats.demandFactor.toFixed(1)}
              </span>
            </div>
            <div className="truncate text-[10px] text-[#8893a3]">{period.dir}</div>
          </div>
        </div>
      )}
      {isRain && (
        <p className="mt-2 text-[10.5px] leading-snug text-[#5b6675]">
          ฝนตก: ผู้โดยสาร +{Math.round((wp.demandMult - 1) * 100)}% ·
          รถช้าลง {Math.round((1 - wp.speedMult) * 100)}% · คนหลบเข้าตึก/ใต้หลังคา
        </p>
      )}
    </div>
  );
}
