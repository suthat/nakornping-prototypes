"use client";

import { useState } from "react";
import { CollapseButton } from "@/miniapps/shuttle/components/ui/CollapseButton";
import { CAFETERIA_ID, RECEPTION_ID, ZONES } from "@/miniapps/tb-airborne/lib/layout";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";

function Sparkline({ data, color = "#059669" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="h-8" />;
  const max = Math.max(...data, 0.01);
  const w = 230;
  const h = 32;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = h - (v / max) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="tb-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#tb-spark)" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
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
    <div className="rounded-lg bg-white/55 px-2.5 py-2">
      <div className="text-[10px] font-medium text-[#5b6675]">{label}</div>
      <div
        className="mono mt-0.5 text-[16px] font-semibold leading-none tracking-tightish"
        style={{ color: accent ?? "#1c2530" }}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[9.5px] leading-snug text-[#8893a3]">{sub}</div>}
    </div>
  );
}

export function StatsPanel() {
  const stats = useSimStore((s) => s.stats);
  const zoneStats = useSimStore((s) => s.zoneStats);
  const opdScreening = useSimStore((s) => s.config.opdScreening);
  const selected = useSimStore((s) => s.selectedZone);
  const setSelected = useSimStore((s) => s.setSelectedZone);
  const [infectHist, setInfectHist] = useState<number[]>([]);
  const [riskHist, setRiskHist] = useState<number[]>([]);
  const [trackedSimTime, setTrackedSimTime] = useState<number | null>(null);
  const [open, setOpen] = useState(true);

  if (stats && stats.simTime !== trackedSimTime) {
    setTrackedSimTime(stats.simTime);
    setInfectHist((h) => {
      const next = [...h, stats.infected];
      return next.length > 80 ? next.slice(-80) : next;
    });
    setRiskHist((h) => {
      const next = [...h, stats.peakRisk];
      return next.length > 80 ? next.slice(-80) : next;
    });
  } else if (!stats && trackedSimTime !== null) {
    setTrackedSimTime(null);
    setInfectHist([]);
    setRiskHist([]);
  }

  if (!stats) {
    return (
      <div className="glass fade-up pointer-events-auto w-full rounded-xl p-3">
        <p className="text-[11px] text-[#5b6675]">กำลังเริ่มการจำลอง…</p>
      </div>
    );
  }

  const sel = selected != null ? zoneStats[selected] : null;
  const selDef = selected != null ? ZONES[selected] : null;

  const zoneRiskRows = (() => {
    const sorted = zoneStats
      .filter((z) => ZONES[z.id].kind !== "walkway")
      .sort((a, b) => b.riskIndex - a.riskIndex);
    let limit = 5;
    if (opdScreening) limit--;
    if (stats && (stats.atCafeteria >= 8 || stats.periodLabel.includes("เที่ยง"))) {
      limit--;
    }
    const rows = sorted.slice(0, limit);
    if (opdScreening) {
      const opdRow = zoneStats[RECEPTION_ID];
      if (opdRow && !rows.some((z) => z.id === RECEPTION_ID)) {
        rows.push(opdRow);
      }
    }
    if (
      stats &&
      (stats.atCafeteria >= 8 || stats.periodLabel.includes("เที่ยง"))
    ) {
      const foodRow = zoneStats[CAFETERIA_ID];
      if (foodRow && !rows.some((z) => z.id === CAFETERIA_ID)) {
        rows.push(foodRow);
      }
    }
    return rows;
  })();

  return (
    <div
      className={`glass fade-up pointer-events-auto flex w-full flex-col rounded-xl p-3 ${
        open ? "h-full min-h-0" : "h-auto self-start"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-[12px] font-semibold tracking-tightish text-[#1c2530]">
          การแพร่เชื้อ
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="mono rounded-full bg-[#ec5b54]/10 px-1.5 py-px text-[9px] font-semibold text-[#ec5b54]">
            +{stats.newInfectionsRate}/ชม.
          </span>
          <CollapseButton open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {!open && (
        <div className="mono mt-2 shrink-0 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-[#5b6675]">
          <span>
            ติดเชื้อ <b className="text-[#ec5b54]">{stats.infected}</b>
          </span>
          <span>
            เดินทาง <b className="text-[#2f6df0]">{stats.inTransit}</b>
          </span>
          <span>
            โรงอาหาร <b className="text-[#f0a341]">{stats.atCafeteria}</b>
          </span>
          <span>
            รวม <b>{stats.totalAgents}</b> คน
          </span>
        </div>
      )}

      {open && (
        <div
          className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5"
          onWheel={(e) => e.stopPropagation()}
        >
          <div>
            <div className="text-[10px] font-medium text-[#5b6675]">
              ผู้ติดเชื้อรอง (secondary)
            </div>
            <div className="mt-0.5 flex items-end gap-1.5">
              <span className="mono text-[22px] font-semibold leading-none text-[#ec5b54]">
                {stats.secondaryInfected}
              </span>
              <span className="mb-0.5 text-[9.5px] leading-snug text-[#8893a3]">
                ใน รพ. · ออก/ส่งต่อ {stats.leavingHospital}
              </span>
            </div>
            <Sparkline data={infectHist} color="#ec5b54" />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Stat label="สัมผัส (exposed)" value={`${stats.exposed}`} accent="#f0a341" />
            <Stat label="ติดเชื้อ (infected)" value={`${stats.infected}`} accent="#ec5b54" />
            <Stat
              label="ในคลินิก TB"
              value={`${stats.infectedInClinic}`}
              sub="secondary ในคลินิก"
            />
            <Stat
              label="นอกคลินิก"
              value={`${stats.infectedOutside}`}
              sub="รวม transit"
              accent={stats.infectedOutside > 0 ? "#ec5b54" : undefined}
            />
            <Stat
              label="ติดระหว่างเดินทาง"
              value={`${stats.transitInfections}`}
              accent={stats.transitInfections > 0 ? "#9333ea" : undefined}
            />
            <Stat
              label="กำลังเดินทาง"
              value={`${stats.inTransit}`}
              sub={`ผู้เยี่ยม/คนทั่วไป ${stats.visitors} · ออก ${stats.leavingHospital}`}
              accent="#2f6df0"
            />
            <Stat
              label="ที่โรงอาหาร"
              value={`${stats.atCafeteria}`}
              sub={stats.periodLabel.includes("เที่ยง") ? "ช่วง peak กินข้าว" : "ขณะนี้"}
              accent={stats.atCafeteria > 0 ? "#f0a341" : undefined}
            />
            <Stat
              label="ที่ห้องน้ำ"
              value={`${stats.atRestroom}`}
              sub={
                stats.peakRestroomRisk > 0.2
                  ? `WC เสี่ยงสูง ${ZONES[stats.peakRestroomZoneId]?.code ?? "—"}`
                  : "ทุกตึก · จุดเสี่ยง aerosol"
              }
              accent={stats.atRestroom > 0 || stats.peakRestroomRisk > 0.35 ? "#38bdf8" : undefined}
            />
            <Stat
              label="ที่ OPD"
              value={`${stats.atOpd}`}
              sub={`รอ IDEN ${stats.waitingAtOpd} · ส่ง TB ${stats.opdToTbTransit}`}
              accent={stats.atOpd > 0 ? "#2f6df0" : undefined}
            />
            <Stat
              label="Active ซ่อน OPD"
              value={`${stats.hiddenActiveAtOpd}`}
              sub={`รอ IDEN ${stats.waitingAtOpd} คน`}
              accent={stats.hiddenActiveAtOpd > 0 ? "#f0a341" : undefined}
            />
            <Stat
              label="Active ข้ามโซน"
              value={`${stats.activeCrossings}`}
              sub="ครั้งสะสม"
            />
          </div>

          {/* Zone risk bars */}
          <div className="rounded-lg bg-white/55 px-2.5 py-2">
            <div className="text-[10px] font-medium text-[#5b6675]">
              ความเสี่ยง quanta ต่อโซน
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              {zoneRiskRows.map((z) => {
                  const def = ZONES[z.id];
                  const isOpdPinned = opdScreening && z.id === RECEPTION_ID;
                  const isFoodPinned =
                    z.id === CAFETERIA_ID &&
                    (stats.atCafeteria >= 8 || stats.periodLabel.includes("เที่ยง"));
                  const c =
                    z.riskIndex < 0.25
                      ? "#22a06b"
                      : z.riskIndex < 0.55
                        ? "#f0a341"
                        : "#ec5b54";
                  return (
                    <button
                      key={z.id}
                      onClick={() => setSelected(z.id)}
                      className="flex items-center gap-2 text-left"
                    >
                      <span
                        className="mono w-10 shrink-0 text-[10px] font-semibold"
                        style={{
                          color: isOpdPinned
                            ? "#2f6df0"
                            : isFoodPinned
                              ? "#ec5b54"
                              : "#3a4452",
                        }}
                      >
                        {def.code}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1c2530]/8">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(z.riskIndex, 1) * 100}%`,
                            background: c,
                          }}
                        />
                      </div>
                      <span className="mono w-8 text-right text-[9px] text-[#8893a3]">
                        {z.occupants}
                      </span>
                    </button>
                  );
                })}
            </div>
            <Sparkline data={riskHist} />
          </div>

          <div className="rounded-lg bg-white/55 px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#5b6675]">
                Exposure dose เฉลี่ย
              </span>
              <span className="mono text-[11px] font-semibold text-[#9333ea]">
                {stats.avgExposure.toFixed(2)}
              </span>
            </div>
            <div className="mono mt-0.5 text-[9px] text-[#8893a3]">
              Wells-Riley: P ≈ 1 − e^(−D) · threshold {1.35} quanta·h/m³
            </div>
          </div>

          {sel && selDef && (
            <div className="rounded-lg border border-[#059669]/25 bg-[#059669]/6 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#1c2530]">
                  {selDef.code} · {selDef.name}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[10px] text-[#5b6675] hover:text-[#1c2530]"
                >
                  ✕
                </button>
              </div>
              <div className="mono mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-[#3a4452]">
                <span>
                  คนในโซน: <b>{sel.occupants}</b>
                </span>
                <span>
                  แพร่เชื้อ: <b>{sel.infectious}</b>
                </span>
                <span>
                  Quanta: <b>{sel.quantaConc.toFixed(2)}</b>
                </span>
                <span>
                  ติดเชื้อสะสม: <b style={{ color: sel.newInfections ? "#ec5b54" : undefined }}>{sel.newInfections}</b>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
