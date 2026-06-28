"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  acceptLicense,
  hasAcceptedLicense,
  LICENSE_ATTRIBUTION_EXAMPLE,
  LICENSE_SECTIONS,
} from "@/lib/license";

export function LicenseGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAccepted(hasAcceptedLicense());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-[13px] font-medium text-[#5b6675]">กำลังโหลด…</p>
      </div>
    );
  }

  if (accepted) {
    return children;
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(900px 600px at 50% 0%, rgba(47,109,240,0.08) 0%, transparent 60%), linear-gradient(160deg, #f3f5f9 0%, #e7ebf1 100%)",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-title"
        className="glass fade-up relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl px-5 py-5 sm:px-7 sm:py-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8893a3]">
          NKP Simulation
        </p>
        <h1
          id="license-title"
          className="mt-1 text-[20px] font-semibold tracking-tightish text-[#1c2530] sm:text-[22px]"
        >
          ลิขสิทธิ์และเงื่อนไขการใช้งาน
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#5b6675]">
          กรุณาอ่านและยอมรับก่อนเข้าใช้งานศูนย์รวมการจำลอง 3 มิติของโรงพยาบาลนครพิงค์
        </p>

        <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto rounded-2xl border border-white/70 bg-white/45 px-4 py-4 sm:px-5">
          {LICENSE_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[13px] font-semibold text-[#1c2530]">
                {section.title}
              </h2>
              <ul className="mt-2 space-y-2">
                {section.body.map((line) => (
                  <li
                    key={line}
                    className="text-[12.5px] leading-relaxed text-[#5b6675]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="mt-5">
            <h2 className="text-[13px] font-semibold text-[#1c2530]">
              ตัวอย่างการระบุที่มา
            </h2>
            <p className="mt-2 rounded-xl border border-[#2f6df0]/15 bg-[#2f6df0]/5 px-3 py-2.5 text-[11.5px] leading-relaxed text-[#3d4d61]">
              “{LICENSE_ATTRIBUTION_EXAMPLE}”
            </p>
          </section>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c5ceda] text-[#2f6df0] focus:ring-[#2f6df0]/30"
          />
          <span className="text-[12.5px] leading-relaxed text-[#3d4d61]">
            ข้าพเจ้าได้อ่านและเข้าใจลิขสิทธิ์ เงื่อนไขการใช้งาน
            และข้อจำกัดความรับผิดแล้ว และยอมรับที่จะปฏิบัติตาม
          </span>
        </label>

        <button
          type="button"
          disabled={!checked}
          onClick={() => {
            acceptLicense();
            setAccepted(true);
          }}
          className="mt-4 w-full rounded-2xl px-4 py-3 text-[14px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-45 enabled:cursor-pointer enabled:bg-[#2f6df0] enabled:text-white enabled:shadow-[0_10px_24px_-12px_rgba(47,109,240,0.65)] enabled:hover:bg-[#255fe0]"
        >
          เข้าใจและยอมรับ — เข้าใช้งาน
        </button>
      </div>
    </div>
  );
}
