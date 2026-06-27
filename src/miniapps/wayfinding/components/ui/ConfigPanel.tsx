"use client";

import { useState } from "react";
import { useSimStore } from "@/miniapps/wayfinding/lib/store";
import {
  DEFAULT_CONFIG,
  NAV_SOLUTION_META,
  NAV_SOLUTIONS,
  SimConfig,
  WeatherKind,
} from "@/miniapps/wayfinding/lib/types";
import { CollapseButton } from "./CollapseButton";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? "#e0732f" : "rgba(28,37,48,0.18)" }}
    >
      <span
        className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? "20px" : "2px" }}
      />
    </button>
  );
}

interface SliderDef {
  key: keyof SimConfig;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  pct?: boolean;
}

function Slider({ def }: { def: SliderDef }) {
  const value = useSimStore((s) => s.config[def.key]) as number;
  const setConfig = useSimStore((s) => s.setConfig);
  const display = def.pct ? Math.round(value * 100) : value;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[12px] font-medium text-[#3a4452]">{def.label}</label>
        <span className="mono text-[12px] font-semibold text-[#1c2530]">
          {display}
          <span className="ml-1 text-[10px] font-normal text-[#8893a3]">{def.unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="mt-2"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) =>
          setConfig({ [def.key]: Number(e.target.value) } as Partial<SimConfig>)
        }
      />
    </div>
  );
}

const WEATHER_OPTS: { key: WeatherKind; label: string }[] = [
  { key: "clear", label: "แดด" },
  { key: "rain", label: "ฝนปรอย" },
  { key: "storm", label: "ฝนหนัก" },
];

function WeatherPicker() {
  const weather = useSimStore((s) => s.config.weather);
  const setConfig = useSimStore((s) => s.setConfig);
  return (
    <div>
      <label className="text-[12px] font-medium text-[#3a4452]">สภาพอากาศ</label>
      <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-xl bg-[#1c2530]/[0.05] p-1">
        {WEATHER_OPTS.map((o) => {
          const active = weather === o.key;
          return (
            <button
              key={o.key}
              onClick={() => setConfig({ weather: o.key })}
              className={`rounded-lg py-2 text-[10.5px] font-medium transition-all ${
                active ? "bg-white text-[#e0732f] shadow-sm" : "text-[#7c879a] hover:text-[#3a4452]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[#1c2530]/[0.04] p-3">
      <div>
        <div className="text-[12px] font-medium text-[#3a4452]">{title}</div>
        <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function TrafficConfig() {
  const timeOfDay = useSimStore((s) => s.config.timeOfDay);
  const setConfig = useSimStore((s) => s.setConfig);
  return (
    <>
      <WeatherPicker />
      <ToggleRow
        title="จำลองช่วงเวลาในวัน"
        desc="เช้าแน่น (เจาะเลือด/เวชระเบียน) · เที่ยงคนออกกินข้าว"
        checked={timeOfDay}
        onChange={(v) => setConfig({ timeOfDay: v })}
      />
      <Slider def={{ key: "arrivalRate", label: "คนเข้า รพ.", unit: "คน/ชม.", min: 100, max: 1200, step: 20 }} />
      <Slider def={{ key: "maxCrowd", label: "คนสูงสุดในฉาก", unit: "คน", min: 200, max: 1500, step: 50 }} />
      <Slider def={{ key: "peakIntensity", label: "ความแรงพีคตามเวลา", unit: "เท่า", min: 0.5, max: 2, step: 0.1 }} />
      <Slider def={{ key: "elderRatio", label: "สัดส่วนผู้สูงอายุ", unit: "%", min: 0, max: 0.7, step: 0.05, pct: true }} />
      <Slider def={{ key: "caregiverRatio", label: "สัดส่วนญาติ/ผู้ดูแล", unit: "%", min: 0, max: 0.7, step: 0.05, pct: true }} />
      <Slider def={{ key: "mobilityImpairedRatio", label: "ผู้ใช้วีลแชร์/ไม้เท้า", unit: "%", min: 0, max: 0.5, step: 0.02, pct: true }} />
      <Slider def={{ key: "lifeNeeds", label: "ความต้องการชีวิต (ห้องน้ำ/กิน/แวะ)", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "simSpeed", label: "เร่งเวลา", unit: "เท่า", min: 1, max: 12, step: 1 }} />
    </>
  );
}

function InsightsConfig() {
  return (
    <>
      <div className="rounded-xl bg-[#e0732f]/[0.08] p-3 text-[10.5px] leading-relaxed text-[#7a4a22]">
        จุดปัญหาจริงของ รพ.นครพิงค์: <b>คัดกรอง · เวชระเบียน · ประชาสัมพันธ์ · โถง OPD</b>{" "}
        และ <b>การข้ามตึก/หาห้องในแผนก</b> — ปรับหลักการด้านล่างเพื่อดูว่าแต่ละสาเหตุดันอัตราหลงอย่างไร
      </div>
      <Slider def={{ key: "sequenceConfusion", label: "สับสนลำดับ (คัดกรอง→เวชระเบียน)", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "junctionComplexity", label: "ความซับซ้อนจุดตัด (ข้ามตึก/โถง)", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "floorConfusion", label: "หลงชั้น/ลิฟต์ (ในแผนก)", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "signageQuality", label: "คุณภาพป้ายพื้นฐาน", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "landmarkSalience", label: "ความเด่นของจุดสังเกต", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "crowdBlindness", label: "ความแออัดบังการมองป้าย", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "askPropensity", label: "แนวโน้มยอมถามทาง", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <div className="rounded-xl bg-[#1c2530]/[0.04] p-3 text-[10px] leading-snug text-[#8893a3]">
        จุดสีบนแผนที่ = จุดตัดสินใจ · วงสีแดง/ส้ม = ความถี่ที่คนเลี้ยวผิด ·
        เส้นจุดแดง = ร่องรอยคนหลง · ดูแผง &ldquo;หลงเพราะอะไร + จุดไหน&rdquo; ด้านขวา
      </div>
    </>
  );
}

const COST_TIER: { label: string; color: string }[] = [
  { label: "—", color: "#8893a3" },
  { label: "ลงทุนต่ำมาก", color: "#22a06b" },
  { label: "ลงทุนต่ำ", color: "#65a30d" },
  { label: "ลงทุนปานกลาง", color: "#f0a341" },
  { label: "ลงทุนสูง", color: "#e0732f" },
  { label: "ลงทุนสูงมาก", color: "#ec5b54" },
];

function CostBadge({ level }: { level: number }) {
  const t = COST_TIER[level] ?? COST_TIER[3];
  return (
    <span
      title={`ระดับการลงทุน ${level} จาก 5`}
      className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold"
      style={{ background: `${t.color}22`, color: t.color }}
    >
      <span className="flex items-center gap-[1.5px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="h-[6px] w-[3px] rounded-full"
            style={{ background: i <= level ? t.color : "rgba(28,37,48,0.16)" }}
          />
        ))}
      </span>
      {t.label}
    </span>
  );
}

function SolutionsConfig() {
  const solutions = useSimStore((s) => s.config.solutions);
  const setSolution = useSimStore((s) => s.setSolution);
  return (
    <>
      <div className="rounded-xl bg-[#1c2530]/[0.04] p-3 text-[10.5px] leading-snug text-[#5b6675]">
        เปิด/ผสมโซลูชันเพื่อเทียบผล — แถบสีข้างชื่อคือ{" "}
        <b>ระดับการลงทุน</b> (ลงทุนต่ำมาก → สูงมาก). เป้าหมายคือดันประสิทธิผลให้สูง
        โดยใช้ต้นทุนน้อย ดูคะแนนเทียบที่แผงสถิติด้านขวา
      </div>
      {NAV_SOLUTIONS.map((key) => {
        const meta = NAV_SOLUTION_META[key];
        return (
          <div
            key={key}
            className="flex items-start justify-between gap-3 rounded-xl bg-[#1c2530]/[0.04] p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] font-medium text-[#3a4452]">{meta.label}</span>
                <CostBadge level={meta.costLevel} />
              </div>
              <div className="mt-0.5 text-[9.5px] leading-snug text-[#8893a3]">{meta.note}</div>
            </div>
            <Toggle checked={solutions[key]} onChange={(v) => setSolution(key, v)} />
          </div>
        );
      })}
      <div className="border-t border-[var(--line)] pt-3" />
      <Slider def={{ key: "signageCoverage", label: "ความครอบคลุมป้าย/เส้นสี/แผนที่", unit: "%", min: 0.1, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "volunteerCount", label: "จำนวนจิตอาสา", unit: "คน", min: 0, max: 24, step: 1 }} />
      <Slider def={{ key: "digitalAdoption", label: "อัตราใช้ QR/Kiosk ของผู้ป่วย", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "beaconCoverage", label: "ความครอบคลุม iBeacon", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
      <Slider def={{ key: "lineAdoption", label: "ผู้ป่วยผูกบัญชี LINE รพ.", unit: "%", min: 0, max: 1, step: 0.05, pct: true }} />
    </>
  );
}

export function ConfigPanel() {
  const running = useSimStore((s) => s.running);
  const toggle = useSimStore((s) => s.toggleRunning);
  const reset = useSimStore((s) => s.reset);
  const setConfig = useSimStore((s) => s.setConfig);
  const activeSystem = useSimStore((s) => s.activeSystem);
  const [open, setOpen] = useState(true);

  const title =
    activeSystem === "traffic"
      ? "ตั้งค่ากระแสคน"
      : activeSystem === "insights"
      ? "หลักการความสับสน"
      : "โซลูชันการนำทาง";

  return (
    <div className="glass fade-up pointer-events-auto flex w-[290px] flex-col rounded-2xl p-4">
      <div className={`flex items-center justify-between ${open ? "mb-3" : ""}`}>
        <h2 className="text-[13px] font-semibold tracking-tightish text-[#1c2530]">{title}</h2>
        <div className="flex items-center gap-3">
          {open && (
            <button
              onClick={() =>
                setConfig({ ...DEFAULT_CONFIG, solutions: { ...DEFAULT_CONFIG.solutions } })
              }
              className="text-[11px] font-medium text-[#5b6675] transition-colors hover:text-[#e0732f]"
            >
              ค่าเริ่มต้น
            </button>
          )}
          <CollapseButton open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {open && (
        <>
          <div className="flex max-h-[44vh] flex-col gap-3.5 overflow-y-auto pr-1">
            {activeSystem === "traffic" && <TrafficConfig />}
            {activeSystem === "insights" && <InsightsConfig />}
            {activeSystem === "solutions" && <SolutionsConfig />}
          </div>

          <div className="mt-4 flex gap-2 border-t border-[var(--line)] pt-3.5">
            <button
              onClick={toggle}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#e0732f] py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#cf6526] active:scale-[0.98]"
            >
              {running ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                  หยุด
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 5v14l12-7z" />
                  </svg>
                  เล่น
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/60 px-4 py-2.5 text-[12px] font-semibold text-[#3a4452] transition-all hover:bg-white active:scale-[0.98]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              รีเซ็ต
            </button>
          </div>
        </>
      )}
    </div>
  );
}
