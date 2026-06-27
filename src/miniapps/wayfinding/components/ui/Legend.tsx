"use client";

import { useSimStore } from "@/miniapps/wayfinding/lib/store";

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

function Item({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Dot color={color} />
      <span className="whitespace-nowrap text-[10.5px] font-medium text-[#5b6675]">{label}</span>
    </div>
  );
}

export function Legend() {
  const activeSystem = useSimStore((s) => s.activeSystem);

  return (
    <div className="glass fade-up pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl px-4 py-2.5">
      {activeSystem === "traffic" && (
        <>
          <Item color="#2f6df0" label="ผู้ป่วยนัด" />
          <Item color="#38bdf8" label="walk-in" />
          <Item color="#ec5b54" label="ฉุกเฉิน/หลง" />
          <Item color="#a78bfa" label="ญาติ" />
          <Item color="#f0a341" label="ผู้สูงอายุ/คิว" />
          <Item color="#22a06b" label="เจ้าหน้าที่" />
          <Item color="#34d399" label="พัก/กิน/ห้องน้ำ" />
        </>
      )}
      {activeSystem === "insights" && (
        <>
          <Item color="#7ea2e8" label="ปกติ (เครียดต่ำ)" />
          <Item color="#f0a341" label="เริ่มเครียด" />
          <Item color="#ec5b54" label="หลง/เครียดสูง" />
          <span className="text-[10.5px] font-medium text-[#5b6675]">· วงสี = จุดที่หลงบ่อย · จุดแดง = ร่องรอยคนหลง</span>
        </>
      )}
      {activeSystem === "solutions" && (
        <>
          <Item color="#5fbf8f" label="ถึงที่หมายลื่นไหล" />
          <Item color="#22d3ee" label="ใช้ดิจิทัล/LINE" />
          <Item color="#a78bfa" label="กำลังถามทาง" />
          <Item color="#facc15" label="จิตอาสา" />
          <Item color="#ec5b54" label="ยังหลง" />
          <span className="text-[10.5px] font-medium text-[#5b6675]">
            · 🟦 iBeacon · 🟩 LINE · 📋 mini-map
          </span>
        </>
      )}
    </div>
  );
}
