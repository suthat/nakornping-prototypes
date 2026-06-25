"use client";

import { useEffect, useRef, useState } from "react";
import { STOPS } from "@/miniapps/shuttle/lib/layout";
import { useSimStore } from "@/miniapps/shuttle/lib/store";
import { CollapseButton } from "./CollapseButton";

function fmtWait(sec: number) {
  if (sec < 60) return `${Math.round(sec)} วิ`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")} น.`;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-10" />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 230;
  const h = 40;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f6df0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2f6df0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke="#2f6df0" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white/55 px-3 py-2.5">
      <div className="text-[10.5px] font-medium text-[#5b6675]">{label}</div>
      <div
        className="mono mt-0.5 text-[18px] font-semibold leading-none tracking-tightish"
        style={{ color: accent ?? "#1c2530" }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[10px] text-[#8893a3]">{sub}</div>}
    </div>
  );
}

export function StatsPanel() {
  const stats = useSimStore((s) => s.stats);
  const stopStats = useSimStore((s) => s.stopStats);
  const selected = useSimStore((s) => s.selectedStop);
  const setSelected = useSimStore((s) => s.setSelectedStop);
  const histRef = useRef<number[]>([]);
  const [, force] = useState(0);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!stats) return;
    histRef.current.push(stats.avgWait);
    if (histRef.current.length > 80) histRef.current.shift();
    force((n) => n + 1);
  }, [stats]);

  if (!stats) {
    return (
      <div className="glass fade-up pointer-events-auto w-[280px] rounded-2xl p-4">
        <p className="text-[12px] text-[#5b6675]">กำลังเริ่มการจำลอง…</p>
      </div>
    );
  }

  const load = stats.loadFactor;
  const overloaded = load > 1;
  const loadColor = load < 0.85 ? "#22a06b" : load < 1 ? "#f0a341" : "#ec5b54";
  const sel = selected != null ? stopStats[selected] : null;
  const selDef = selected != null ? STOPS[selected] : null;

  return (
    <div className="glass fade-up pointer-events-auto flex w-[280px] flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold tracking-tightish text-[#1c2530]">
          สถิติแบบเรียลไทม์
        </h2>
        <div className="flex items-center gap-2">
          <span className="mono rounded-full bg-[#2f6df0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2f6df0]">
            {stats.throughput} คน/นาที
          </span>
          <CollapseButton open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {!open && (
        <div className="mono flex items-center justify-between text-[11px] text-[#5b6675]">
          <span>
            รอเฉลี่ย{" "}
            <b className="text-[#1c2530]">{fmtWait(stats.avgWait)}</b>
          </span>
          <span>
            คนรอ <b className="text-[#1c2530]">{stats.totalWaiting}</b>
          </span>
          <span style={{ color: loadColor }}>ภาระ {(load * 100).toFixed(0)}%</span>
        </div>
      )}

      {open && (
      <>
      {/* เวลารอ */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-medium text-[#5b6675]">
            เวลารอเฉลี่ย (จากผู้ที่ขึ้นรถแล้ว)
          </span>
        </div>
        <div className="mt-0.5 flex items-end gap-2">
          <span className="mono text-[26px] font-semibold leading-none tracking-tightish text-[#1c2530]">
            {fmtWait(stats.avgWait)}
          </span>
          <span className="mb-0.5 text-[11px] text-[#8893a3]">
            ทฤษฎี ≈ {fmtWait(stats.theoreticalWait)}
          </span>
        </div>
        <Sparkline data={histRef.current} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="เวลารอ P90" value={fmtWait(stats.p90Wait)} />
        <Stat label="เวลารอสูงสุด" value={fmtWait(stats.maxWait)} accent={stats.maxWait > 180 ? "#ec5b54" : undefined} />
        <Stat label="คนรอทั้งระบบ" value={`${stats.totalWaiting}`} sub="คน ณ ขณะนี้" />
        <Stat label="ผู้โดยสารบนรถ" value={`${stats.onboard}`} sub={`ใช้ที่นั่ง ${Math.round(stats.seatUtil * 100)}%`} />
        <Stat label="ระยะห่างรถ (headway)" value={fmtWait(stats.headway)} />
        <Stat label="คนตกรถสะสม" value={`${stats.leftBehind}`} accent={stats.leftBehind > 0 ? "#ec5b54" : undefined} sub="ครั้งที่รอรอบถัดไป" />
      </div>

      {/* Load factor */}
      <div className="rounded-xl bg-white/55 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#5b6675]">
            ภาระระบบ (demand / capacity)
          </span>
          <span className="mono text-[12px] font-semibold" style={{ color: loadColor }}>
            {(load * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1c2530]/8">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(load, 1.5) / 1.5 * 100}%`,
              background: loadColor,
            }}
          />
        </div>
        <div className="mono mt-1.5 flex justify-between text-[9.5px] text-[#8893a3]">
          <span>รับเข้า {stats.demandPerMin} คน/นาที</span>
          <span>ความจุ ≈ {Math.round(stats.capacityPerMin)} คน/นาที</span>
        </div>
        {overloaded && (
          <p className="mt-1.5 text-[10px] font-medium text-[#ec5b54]">
            ⚠ ความต้องการเกินความจุ — คิวและเวลารอจะพุ่งขึ้นต่อเนื่อง
          </p>
        )}
      </div>

      {/* การจราจรหน้า รพ. */}
      {(() => {
        const tl = stats.trafficLevel;
        const tColor = tl < 0.3 ? "#22a06b" : tl < 0.6 ? "#f0a341" : "#ec5b54";
        const tLabel = tl < 0.3 ? "โล่ง" : tl < 0.6 ? "หนาแน่น" : "ติดขัด";
        return (
          <div className="rounded-xl bg-white/55 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5b6675]">
                การจราจรหน้า รพ.
              </span>
              <span className="text-[12px] font-semibold" style={{ color: tColor }}>
                {tLabel}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1c2530]/8">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round(tl * 100)}%`, background: tColor }}
              />
            </div>
            <div className="mono mt-1.5 text-[9.5px] text-[#8893a3]">
              รถ shuttle ช้าลงสูงสุด ~{Math.round(tl * 92)}% ในโซนหน้าอาคาร
            </div>
          </div>
        );
      })()}

      {/* รายละเอียดป้ายที่เลือก */}
      {sel && selDef && (
        <div className="rounded-xl border border-[#2f6df0]/25 bg-[#2f6df0]/[0.06] px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#1c2530]">
              {selDef.code} · {selDef.name}
            </span>
            <button
              onClick={() => setSelected(null)}
              className="text-[11px] text-[#5b6675] hover:text-[#1c2530]"
            >
              ✕
            </button>
          </div>
          <div className="mono mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#3a4452]">
            <span>คิวตอนนี้: <b>{sel.queue}</b></span>
            <span>รอนานสุด: <b>{fmtWait(sel.oldestWait)}</b></span>
            <span>ส่งแล้ว: <b>{sel.served}</b></span>
            <span>ตกรถ: <b style={{ color: sel.leftBehind ? "#ec5b54" : undefined }}>{sel.leftBehind}</b></span>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
