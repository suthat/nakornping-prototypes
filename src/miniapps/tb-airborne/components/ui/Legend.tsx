"use client";

import { useSimStore } from "@/miniapps/tb-airborne/lib/store";
import { TB_SUBZONES } from "@/miniapps/tb-airborne/lib/layout";

export function Legend() {
  const zoning = useSimStore((s) => s.config.zoning);

  return (
    <div className="glass fade-up pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl px-4 py-2.5">
      <span className="text-[11px] font-medium text-[#5b6675]">สถานะ</span>
      {[
        { color: "#9333ea", label: "Active (ทราบแล้ว)" },
        { color: "#f59e0b", label: "รอ IDEN / Active ซ่อน" },
        { color: "#16a34a", label: "OPD → TB" },
        { color: "#14b8a6", label: "Non-active (TB)" },
        { color: "#22a06b", label: "ปลอดภัย (ทั่วไป)" },
        { color: "#f0a341", label: "สัมผัส (exposed)" },
        { color: "#ec5b54", label: "ติดเชื้อ" },
      ].map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-[10.5px] text-[#5b6675]"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
      {zoning === "zoned" && (
        <div className="flex items-center gap-3 border-l border-(--line) pl-3">
          <span className="text-[10.5px] font-medium text-[#5b6675]">
            โซน TB
          </span>
          {(
            Object.entries(TB_SUBZONES) as [
              keyof typeof TB_SUBZONES,
              (typeof TB_SUBZONES)["active"],
            ][]
          ).map(([key, sub]) => (
            <span
              key={key}
              className="flex items-center gap-1 text-[10px] text-[#5b6675]"
            >
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: sub.color }}
              />
              {sub.label}
            </span>
          ))}
        </div>
      )}
      <div className="hidden items-center gap-3 border-l border-(--line) pl-3 md:flex">
        <span className="text-[10.5px] font-medium text-[#5b6675]">
          กิจกรรม
        </span>
        {[
          { color: "#f0a341", label: "กินข้าว" },
          { color: "#38bdf8", label: "ห้องน้ำ (จุดเสี่ยง)" },
          { color: "#2f6df0", label: "เดินทาง" },
        ].map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1 text-[10px] text-[#5b6675]"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="hidden items-center gap-3 border-l border-(--line) pl-3 sm:flex">
        <span className="text-[10.5px] text-[#5b6675]">ความเสี่ยง quanta</span>
        <div
          className="h-2.5 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #22a06b 0%, #f0a341 50%, #ec5b54 100%)",
          }}
        />
        <span className="flex items-center gap-1.5 text-[10.5px] text-[#5b6675]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#9333ea] opacity-60" />
          อนุภาคลอย (quanta)
        </span>
      </div>
    </div>
  );
}
