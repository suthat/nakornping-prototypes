"use client";

import { useState } from "react";
import { CollapseButton } from "@/miniapps/shuttle/components/ui/CollapseButton";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";
import {
  DEFAULT_CONFIG,
  SimConfig,
  ScenarioKind,
  ZoningMode,
  WeatherKind,
} from "@/miniapps/tb-airborne/lib/types";

const SCENARIOS: { key: ScenarioKind; label: string; desc: string }[] = [
  {
    key: "active_move",
    label: "Active + Movement",
    desc: "active ที่ทราบแล้ว → ห้องยา/การเงิน/โรงอาหาร",
  },
  {
    key: "active_no_move",
    label: "Active + No move",
    desc: "active ที่ทราบแล้ว อยู่คลินิก TB เท่านั้น",
  },
  {
    key: "fast_track",
    label: "Fast track",
    desc: "ส่ง TB โดยตรง ไม่เคลื่อนที่หลังเข้าคลินิก",
  },
];

const WEATHER_OPTS: { key: WeatherKind; label: string }[] = [
  { key: "clear", label: "แจ่มใส" },
  { key: "rain", label: "ฝนปรอย" },
  { key: "storm", label: "ฝนหนัก" },
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
      style={{ background: checked ? "#059669" : "rgba(28,37,48,0.18)" }}
    >
      <span
        className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? "20px" : "2px" }}
      />
    </button>
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

const CROWD_FIELDS: FieldDef[] = [
  {
    key: "maxCrowd",
    label: "คนในฉากสูงสุด",
    unit: "คน",
    min: 100,
    max: 1500,
    step: 20,
  },
  {
    key: "numActive",
    label: "ผู้ป่วย Active (ทราบแล้ว)",
    unit: "คน",
    min: 1,
    max: 30,
    step: 1,
  },
  {
    key: "numNonActive",
    label: "ผู้ป่วย Non-active",
    unit: "คน",
    min: 4,
    max: 150,
    step: 2,
  },
  {
    key: "numFamily",
    label: "ญาติ/ผู้ติดตาม",
    unit: "คน",
    min: 0,
    max: 80,
    step: 2,
  },
  {
    key: "visitorRate",
    label: "ผู้มาเยือนทั่วไป",
    unit: "คน/ชม.",
    min: 10,
    max: 350,
    step: 5,
  },
  {
    key: "opdGeneralRate",
    label: "ผู้ป่วย OPD ทั่วไป",
    unit: "คน/ชม.",
    min: 0,
    max: 450,
    step: 10,
  },
  {
    key: "quantaRate",
    label: "Quanta rate (q)",
    unit: "q/ชม.",
    min: 0.5,
    max: 10,
    step: 0.5,
  },
  {
    key: "simSpeed",
    label: "เร่งเวลา",
    unit: "เท่า",
    min: 1,
    max: 20,
    step: 1,
  },
];

const OPD_FIELDS: FieldDef[] = [
  {
    key: "opdArrivalRate",
    label: "OPD คัดกรอง TB",
    unit: "คน/ชม.",
    min: 5,
    max: 150,
    step: 5,
  },
  {
    key: "unknownActiveRatio",
    label: "สัดส่วน active ซ่อน",
    unit: "",
    min: 0.02,
    max: 0.3,
    step: 0.01,
  },
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
          {field.key === "unknownActiveRatio"
            ? `${(value * 100).toFixed(0)}%`
            : value}
          {field.unit && (
            <span className="ml-1 text-[10px] font-normal text-[#8893a3]">
              {field.unit}
            </span>
          )}
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
          setConfig({
            [field.key]: Number(e.target.value),
          } as Partial<SimConfig>)
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
  const scenario = useSimStore((s) => s.config.scenario);
  const zoning = useSimStore((s) => s.config.zoning);
  const weather = useSimStore((s) => s.config.weather);
  const timeOfDay = useSimStore((s) => s.config.timeOfDay);
  const lunchMovement = useSimStore((s) => s.config.lunchMovement);
  const opdScreening = useSimStore((s) => s.config.opdScreening);
  const ambientCrowd = useSimStore((s) => s.config.ambientCrowd);

  const [open, setOpen] = useState(true);

  return (
    <div className="glass fade-up pointer-events-auto flex w-[300px] flex-col rounded-2xl p-4">
      <div
        className={`flex items-center justify-between ${open ? "mb-3" : ""}`}
      >
        <h2 className="text-[13px] font-semibold tracking-tightish text-[#1c2530]">
          ตั้งค่าการจำลอง
        </h2>
        <div className="flex items-center gap-3">
          {open && (
            <button
              onClick={() => setConfig({ ...DEFAULT_CONFIG })}
              className="text-[11px] font-medium text-[#5b6675] transition-colors hover:text-[#059669]"
            >
              ค่าเริ่มต้น
            </button>
          )}
          <CollapseButton open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {!open ? null : (
        <>
          <div className="flex max-h-[46vh] flex-col gap-3.5 overflow-y-auto pr-1">
            {/* Scenario */}
            <div>
              <label className="text-[12px] font-medium text-[#3a4452]">
                นโยบายผู้ป่วย Active (ทราบแล้ว)
              </label>
              <div className="mt-2 flex flex-col gap-1.5">
                {SCENARIOS.map((s) => {
                  const active = scenario === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setConfig({ scenario: s.key })}
                      className={`rounded-xl px-3 py-2 text-left transition-all ${
                        active
                          ? "bg-[#059669]/10 ring-1 ring-[#059669]/30"
                          : "bg-[#1c2530]/4 hover:bg-[#1c2530]/[0.07]"
                      }`}
                    >
                      <div
                        className={`text-[11.5px] font-semibold ${active ? "text-[#059669]" : "text-[#3a4452]"}`}
                      >
                        {s.label}
                      </div>
                      <div className="text-[10px] text-[#8893a3]">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OPD screening toggle */}
            <div className="rounded-xl border border-[#2f6df0]/20 bg-[#2f6df0]/4 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-medium text-[#3a4452]">
                    OPD → IDEN → TB
                  </div>
                  <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
                    เจือปน active ที่ยังไม่รู้ตัวใน OPD ก่อนส่ง TB
                    (ผสมกับนโยบายด้านบนได้)
                  </div>
                </div>
                <Toggle
                  checked={opdScreening}
                  onChange={(v) => setConfig({ opdScreening: v })}
                />
              </div>
              {opdScreening && (
                <div className="mt-3 flex flex-col gap-3 border-t border-(--line) pt-3">
                  {OPD_FIELDS.map((f) => (
                    <Slider key={f.key} field={f} />
                  ))}
                </div>
              )}
            </div>

            {/* Zoning */}
            <div>
              <label className="text-[12px] font-medium text-[#3a4452]">
                การแบ่งพื้นที่คลินิก TB
              </label>
              <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-[#1c2530]/5 p-1">
                {(
                  [
                    { key: "zoned" as ZoningMode, label: "แบ่งโซน" },
                    { key: "none" as ZoningMode, label: "ไม่แบ่ง" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setConfig({ zoning: o.key })}
                    className={`rounded-lg py-2 text-[10.5px] font-medium transition-all ${
                      zoning === o.key
                        ? "bg-white text-[#059669] shadow-sm"
                        : "text-[#7c879a] hover:text-[#3a4452]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div>
              <label className="text-[12px] font-medium text-[#3a4452]">
                สภาพอากาศ
              </label>
              <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-xl bg-[#1c2530]/5 p-1">
                {WEATHER_OPTS.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setConfig({ weather: o.key })}
                    className={`rounded-lg py-2 text-[10.5px] font-medium transition-all ${
                      weather === o.key
                        ? "bg-white text-[#059669] shadow-sm"
                        : "text-[#7c879a] hover:text-[#3a4452]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl bg-[#1c2530]/4 p-3">
              <div>
                <div className="text-[12px] font-medium text-[#3a4452]">
                  ช่วงเวลาในวัน
                </div>
                <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
                  เช้าคนแน่น · เที่ยงออกกินข้าว
                </div>
              </div>
              <Toggle
                checked={timeOfDay}
                onChange={(v) => setConfig({ timeOfDay: v })}
              />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl bg-[#1c2530]/4 p-3">
              <div>
                <div className="text-[12px] font-medium text-[#3a4452]">
                  เดินทางไปโรงอาหาร
                </div>
                <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
                  active · ญาติ · คนทั่วไป → โรงอาหาร ~12:15 น.
                </div>
              </div>
              <Toggle
                checked={lunchMovement}
                onChange={(v) => setConfig({ lunchMovement: v })}
              />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl bg-[#1c2530]/4 p-3">
              <div>
                <div className="text-[12px] font-medium text-[#3a4452]">
                  คนเดินทั่ว รพ.
                </div>
                <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
                  spawn สะสม + เดินไปมาระหว่างอาคารตลอดเวลา
                </div>
              </div>
              <Toggle
                checked={ambientCrowd}
                onChange={(v) => setConfig({ ambientCrowd: v })}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#3a4452]">
                ความหนาแน่นประชากร
              </label>
              <div className="mt-0.5 text-[10px] leading-snug text-[#8893a3]">
                ปรับจำนวนคนในฉาก · รพ.นครพิงค์ peak ~600–900 คน
              </div>
            </div>

            {CROWD_FIELDS.map((f) => (
              <Slider key={f.key} field={f} />
            ))}
          </div>

          <div className="mt-4 flex gap-2 border-t border-(--line) pt-3.5">
            <button
              onClick={toggle}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#059669] py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-[#047857] active:scale-[0.98]"
            >
              {running ? "หยุด" : "เล่น"}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-(--line) bg-white/60 px-4 py-2.5 text-[12px] font-semibold text-[#3a4452] transition-all hover:bg-white active:scale-[0.98]"
            >
              รีเซ็ต
            </button>
          </div>
        </>
      )}
    </div>
  );
}
