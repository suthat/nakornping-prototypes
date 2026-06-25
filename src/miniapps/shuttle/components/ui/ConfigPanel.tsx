"use client";

import { useState } from "react";
import { useSimStore } from "@/miniapps/shuttle/lib/store";
import { DEFAULT_CONFIG, SimConfig, WeatherKind } from "@/miniapps/shuttle/lib/types";
import { CollapseButton } from "./CollapseButton";

const WEATHER_OPTS: { key: WeatherKind; label: string; icon: React.ReactNode }[] = [
  {
    key: "clear",
    label: "แจ่มใส",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    key: "rain",
    label: "ฝนปรอย",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16a4.5 4.5 0 0 1 .5-9 6 6 0 0 1 11.4 1.5A3.5 3.5 0 0 1 18 16" />
        <path d="M9 19l-1 2M13 19l-1 2" />
      </svg>
    ),
  },
  {
    key: "storm",
    label: "ฝนหนัก",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 15a4.5 4.5 0 0 1 .5-9 6 6 0 0 1 11.4 1.5A3.5 3.5 0 0 1 18 15" />
        <path d="M8 19l-1.5 3M12 19l-1.5 3M16 19l-1.5 3" />
      </svg>
    ),
  },
];

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
      style={{ background: checked ? "#2f6df0" : "rgba(28,37,48,0.18)" }}
    >
      <span
        className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? "20px" : "2px" }}
      />
    </button>
  );
}

function DispatchPolicy() {
  const hold = useSimStore((s) => s.config.holdUntilFull);
  const maxHold = useSimStore((s) => s.config.maxHold);
  const setConfig = useSimStore((s) => s.setConfig);
  return (
    <div className="rounded-xl bg-[#1c2530]/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-medium text-[#3a4452]">
            รอผู้โดยสารเต็มคันก่อนออก
          </div>
          <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
            จอดรับจนเต็ม (ลดเที่ยววิ่ง แต่คนแรกๆ รอนานขึ้น)
          </div>
        </div>
        <Toggle checked={hold} onChange={(v) => setConfig({ holdUntilFull: v })} />
      </div>
      {hold && (
        <div className="mt-3 border-t border-[var(--line)] pt-3">
          <div className="flex items-baseline justify-between">
            <label className="text-[11.5px] font-medium text-[#3a4452]">
              รอได้นานสุดต่อป้าย
            </label>
            <span className="mono text-[12px] font-semibold text-[#1c2530]">
              {maxHold}
              <span className="ml-1 text-[10px] font-normal text-[#8893a3]">
                วินาที
              </span>
            </span>
          </div>
          <input
            type="range"
            className="mt-2"
            min={20}
            max={240}
            step={10}
            value={maxHold}
            onChange={(e) => setConfig({ maxHold: Number(e.target.value) })}
          />
          <div className="mt-1 text-[10px] text-[#8893a3]">
            ถ้าไม่เต็มภายในเวลานี้ รถจะออกเพื่อกันค้าง
          </div>
        </div>
      )}
    </div>
  );
}

function RushHourToggle() {
  const rush = useSimStore((s) => s.config.rushHour);
  const setConfig = useSimStore((s) => s.setConfig);
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[#1c2530]/[0.04] p-3">
      <div>
        <div className="text-[12px] font-medium text-[#3a4452]">
          ชั่วโมงเร่งด่วน (ตามเวลา)
        </div>
        <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
          จำลองเวลาในวัน — เช้าคนหลั่งไหลเข้า รพ. เย็นออกสู่ลานจอด
        </div>
      </div>
      <Toggle checked={rush} onChange={(v) => setConfig({ rushHour: v })} />
    </div>
  );
}

function TrafficToggle() {
  const traffic = useSimStore((s) => s.config.traffic);
  const setConfig = useSimStore((s) => s.setConfig);
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[#1c2530]/[0.04] p-3">
      <div>
        <div className="text-[12px] font-medium text-[#3a4452]">
          รถติดในพื้นที่ รพ.
        </div>
        <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
          ถนนหน้าอาคารหนาแน่น รถ shuttle ช้าลงในโซนนั้น (ยิ่งเร่งด่วน/ฝนยิ่งติด)
        </div>
      </div>
      <Toggle checked={traffic} onChange={(v) => setConfig({ traffic: v })} />
    </div>
  );
}

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
              className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10.5px] font-medium transition-all ${
                active
                  ? "bg-white text-[#2f6df0] shadow-sm"
                  : "text-[#7c879a] hover:text-[#3a4452]"
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FieldDef {
  key: keyof SimConfig;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: FieldDef[] = [
  { key: "numBuses", label: "จำนวนรถ shuttle", unit: "คัน", min: 1, max: 8, step: 1 },
  { key: "seatsPerBus", label: "ที่นั่งต่อคัน", unit: "ที่นั่ง", min: 4, max: 30, step: 1 },
  { key: "standingPerBus", label: "ที่ยืนต่อคัน", unit: "คน", min: 0, max: 20, step: 1 },
  { key: "busSpeed", label: "ความเร็วรถ", unit: "กม./ชม.", min: 12, max: 60, step: 2 },
  { key: "minDwell", label: "เวลาจอดรับ-ส่งต่อป้าย", unit: "วินาที", min: 2, max: 20, step: 1 },
  { key: "arrivalRate", label: "ผู้โดยสารมาใหม่", unit: "คน/นาที", min: 2, max: 90, step: 1 },
  { key: "simSpeed", label: "เร่งเวลา (เทียบเวลาจริง)", unit: "เท่า", min: 1, max: 20, step: 1 },
];

function Slider({ field }: { field: FieldDef }) {
  const value = useSimStore((s) => s.config[field.key]) as number;
  const setConfig = useSimStore((s) => s.setConfig);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[12px] font-medium text-[#3a4452]">
          {field.label}
        </label>
        <span className="mono text-[12px] font-semibold text-[#1c2530]">
          {value}
          <span className="ml-1 text-[10px] font-normal text-[#8893a3]">
            {field.unit}
          </span>
        </span>
      </div>
      <input
        type="range"
        className="mt-2"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(e) =>
          setConfig({ [field.key]: Number(e.target.value) } as Partial<SimConfig>)
        }
      />
    </div>
  );
}

export function ConfigPanel() {
  const running = useSimStore((s) => s.running);
  const toggle = useSimStore((s) => s.toggleRunning);
  const reset = useSimStore((s) => s.reset);
  const setConfig = useSimStore((s) => s.setConfig);

  const [open, setOpen] = useState(true);

  return (
    <div className="glass fade-up pointer-events-auto flex w-[280px] flex-col rounded-2xl p-4">
      <div className={`flex items-center justify-between ${open ? "mb-3" : ""}`}>
        <h2 className="text-[13px] font-semibold tracking-tightish text-[#1c2530]">
          ตั้งค่าการจำลอง
        </h2>
        <div className="flex items-center gap-3">
          {open && (
            <button
              onClick={() => setConfig({ ...DEFAULT_CONFIG })}
              className="text-[11px] font-medium text-[#5b6675] transition-colors hover:text-[#2f6df0]"
            >
              ค่าเริ่มต้น
            </button>
          )}
          <CollapseButton open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {!open ? null : (
      <>
      <div className="flex max-h-[42vh] flex-col gap-3.5 overflow-y-auto pr-1">
        <WeatherPicker />
        <RushHourToggle />
        <TrafficToggle />
        {FIELDS.map((f) => (
          <Slider key={f.key} field={f} />
        ))}
        <DispatchPolicy />
      </div>

      <div className="mt-4 flex gap-2 border-t border-[var(--line)] pt-3.5">
        <button
          onClick={toggle}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2f6df0] py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#2a62d8] active:scale-[0.98]"
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
