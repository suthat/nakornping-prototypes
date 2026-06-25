"use client";

export function Legend() {
  return (
    <div className="glass fade-up pointer-events-auto flex items-center gap-4 rounded-2xl px-4 py-2.5">
      <span className="text-[11px] font-medium text-[#5b6675]">เวลารอ</span>
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-28 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #eef3ff 0%, #5b8cf0 18%, #f0a341 55%, #ec5b54 100%)",
          }}
        />
        <div className="mono flex w-28 justify-between text-[9px] text-[#8893a3]">
          <span>0</span>
          <span>90วิ</span>
          <span>3น.+</span>
        </div>
      </div>
      <div className="ml-1 hidden items-center gap-3 border-l border-[var(--line)] pl-3 text-[10.5px] text-[#5b6675] sm:flex">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2f6df0]" />
          แถบหลังคา = รถ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f0a341]" />
          แถบ = ผู้โดยสารบนรถ
        </span>
      </div>
    </div>
  );
}
