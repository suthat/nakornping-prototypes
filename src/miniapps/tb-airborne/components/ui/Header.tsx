"use client";

import { useSimStore } from "@/miniapps/tb-airborne/lib/store";
import { WEATHER, ScenarioKind } from "@/miniapps/tb-airborne/lib/types";
import { ZONES } from "@/miniapps/tb-airborne/lib/layout";

const SCENARIO_LABEL: Record<ScenarioKind, string> = {
  active_move: "Active + เคลื่อนที่",
  active_no_move: "Active + ไม่เคลื่อนที่",
  fast_track: "Fast track → TB",
};

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

export function Header() {
  const stats = useSimStore((s) => s.stats);
  const running = useSimStore((s) => s.running);
  const weather = useSimStore((s) => s.config.weather);
  const scenario = useSimStore((s) => s.config.scenario);
  const zoning = useSimStore((s) => s.config.zoning);
  const opdScreening = useSimStore((s) => s.config.opdScreening);
  const wp = WEATHER[weather];
  const isRain = weather !== "clear";

  return (
    <div className="glass fade-up pointer-events-auto w-[300px] rounded-xl px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#059669] text-white shadow-md shadow-emerald-500/25">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
            <circle cx="12" cy="14" r="2" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[13px] font-semibold leading-tight tracking-tightish text-[#1c2530]">
            TB Airborne · รพ.นครพิงค์
          </h1>
          <p className="truncate text-[10px] leading-tight text-[#8893a3]">
            Wells-Riley · คลินิกวัณโรค
          </p>
        </div>
        {stats && (
          <div className="mono shrink-0 text-right leading-none">
            <div className="text-[13px] font-semibold text-[#1c2530]">
              {fmtDayClock(stats.dayMinutes)}
              <span className="ml-0.5 text-[8px] font-normal text-[#8893a3]">
                น.
              </span>
            </div>
            <div className="mt-0.5 text-[9px] text-[#8893a3]">
              {fmtClock(stats.simTime)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-(--line) pt-2">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-500" : "bg-amber-400"}`}
        />
        <span className="text-[10px] font-medium text-[#5b6675]">
          {running ? "จำลอง" : "หยุด"}
        </span>
        <span className="rounded-full bg-[#059669]/10 px-1.5 py-px text-[9px] font-semibold text-[#059669]">
          {SCENARIO_LABEL[scenario]}
        </span>
        <span className="rounded-full bg-[#1c2530]/6 px-1.5 py-px text-[9px] font-medium text-[#5b6675]">
          {zoning === "zoned" ? "แบ่งโzoน" : "ไม่แบ่งโzoน"}
        </span>
        {opdScreening && (
          <span className="rounded-full bg-[#2f6df0]/10 px-1.5 py-px text-[9px] font-semibold text-[#2f6df0]">
            OPD→TB
          </span>
        )}
        <span
          className="rounded-full px-1.5 py-px text-[9px] font-semibold"
          style={{
            background: isRain ? "rgba(5,150,105,0.12)" : "rgba(28,37,48,0.06)",
            color: isRain ? "#059669" : "#5b6675",
          }}
        >
          {wp.label}
        </span>
      </div>

      {stats && (
        <div className="mt-1.5 truncate text-[9.5px] leading-snug text-[#8893a3]">
          <span className="font-semibold text-[#3a4452]">
            {stats.periodLabel}
          </span>
          <span className="mono ml-1 text-[#059669]">
            ×{stats.crowdFactor.toFixed(1)}
          </span>
          <span className="mx-1.5 text-[#c5cdd8]">·</span>
          {stats.totalAgents} คน
          <span className="mx-1.5 text-[#c5cdd8]">·</span>
          เสี่ยง {ZONES[stats.peakZoneId]?.code ?? "—"}
          {stats.atOpd > 0 && (
            <span className="ml-1 text-[#2f6df0]">OPD {stats.atOpd}</span>
          )}
          {stats.atCafeteria > 0 && (
            <span className="ml-1 text-[#f0a341]">
              FOOD {stats.atCafeteria}
            </span>
          )}
          {stats.atRestroom > 0 && (
            <span className="ml-1 text-[#38bdf8]">WC {stats.atRestroom}</span>
          )}
        </div>
      )}
    </div>
  );
}
