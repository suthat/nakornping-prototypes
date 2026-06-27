"use client";

import { NODES } from "@/miniapps/wayfinding/lib/layout";
import { useSimStore } from "@/miniapps/wayfinding/lib/store";
import {
  LOST_CAUSES,
  LOST_CAUSE_COLOR,
  LOST_CAUSE_LABEL,
} from "@/miniapps/wayfinding/lib/types";

function Metric({
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
    <div className="rounded-xl bg-[#1c2530]/[0.04] px-3 py-2.5">
      <div className="text-[10px] font-medium leading-tight text-[#8893a3]">{label}</div>
      <div
        className="mono mt-0.5 text-[17px] font-semibold leading-none"
        style={{ color: accent ?? "#1c2530" }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[9.5px] leading-tight text-[#8893a3]">{sub}</div>}
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] font-medium text-[#3a4452]">{label}</span>
        <span className="mono text-[11px] font-semibold text-[#1c2530]">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#1c2530]/[0.08]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SelectedNodeCard() {
  const selected = useSimStore((s) => s.selectedNode);
  const stats = useSimStore((s) => s.stats);
  const setSelected = useSimStore((s) => s.setSelectedNode);
  if (selected == null || !stats) return null;
  const node = NODES[selected];
  return (
    <div className="rounded-xl border border-[#e0732f]/30 bg-[#e0732f]/[0.06] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold text-[#1c2530]">{node.name}</div>
          <div className="mono mt-0.5 text-[9.5px] text-[#8893a3]">
            {node.floor > 0 ? `ชั้น ${node.floor + 1}` : "ชั้นพื้น"} ·{" "}
            {node.decision ? "จุดตัดสินใจ" : "จุดบริการ/สถานที่"}
          </div>
        </div>
        <button
          onClick={() => setSelected(null)}
          className="text-[11px] text-[#8893a3] hover:text-[#e0732f]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function StatsPanel() {
  const stats = useSimStore((s) => s.stats);
  const activeSystem = useSimStore((s) => s.activeSystem);

  return (
    <div className="glass fade-up pointer-events-auto flex h-full min-h-0 flex-col rounded-2xl p-4">
      <h2 className="mb-3 shrink-0 text-[13px] font-semibold tracking-tightish text-[#1c2530]">
        {activeSystem === "traffic"
          ? "สถิติกระแสคน"
          : activeSystem === "insights"
          ? "สถิติการหลงทาง"
          : "เทียบประสิทธิผลโซลูชัน"}
      </h2>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        <SelectedNodeCard />

        {!stats ? (
          <div className="text-[12px] text-[#8893a3]">กำลังเริ่มจำลอง…</div>
        ) : activeSystem === "traffic" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="คนในพื้นที่" value={`${stats.totalAgents}`} />
              <Metric label="กำลังเดิน" value={`${stats.inTransit}`} accent="#2f6df0" />
              <Metric label="ต่อคิว/รับบริการ" value={`${stats.inQueue}`} accent="#f0a341" />
              <Metric label="หลงทางตอนนี้" value={`${stats.lostNow}`} accent="#ec5b54" />
            </div>
            <div className="mt-1 text-[10px] font-semibold text-[#8893a3]">ความต้องการชีวิต</div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="ห้องน้ำ" value={`${stats.atRestroom}`} />
              <Metric label="โรงอาหาร" value={`${stats.atFood}`} />
              <Metric label="7-11" value={`${stats.atShop}`} />
              <Metric label="หาที่จอด" value={`${stats.atParking}`} />
              <Metric label="นั่งพัก" value={`${stats.resting}`} />
              <Metric label="เข้า/ออก สะสม" value={`${stats.arrived}/${stats.departed}`} />
            </div>
          </>
        ) : activeSystem === "insights" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="กำลังหลง (ตอนนี้)" value={`${stats.lostNow} คน`} accent="#ec5b54" />
              <Metric
                label="เดินทางลื่นไหล (ตอนนี้)"
                value={`${Math.round(stats.liveFlow * 100)}%`}
                accent={stats.liveFlow > 0.7 ? "#22a06b" : "#f0a341"}
              />
              <Metric label="ความเครียดเฉลี่ย (ตอนนี้)" value={`${Math.round(stats.avgDistress * 100)}%`} accent="#e0732f" />
              <Metric label="อ้อมเฉลี่ย (คนหลง)" value={`${Math.round(stats.avgDetour)} ม.`} />
            </div>

            {(() => {
              const total = LOST_CAUSES.reduce((s, c) => s + stats.causeCounts[c], 0);
              return (
                <div className="mt-1 flex flex-col gap-2 rounded-xl bg-[#1c2530]/[0.04] p-3">
                  <div className="text-[10.5px] font-semibold text-[#3a4452]">
                    หลงเพราะอะไร ({total} ครั้ง)
                  </div>
                  {LOST_CAUSES.map((c) => {
                    const v = total > 0 ? stats.causeCounts[c] / total : 0;
                    const pct = Math.round(v * 100);
                    return (
                      <div key={c}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] font-medium text-[#5b6675]">
                            {LOST_CAUSE_LABEL[c]}
                          </span>
                          <span className="mono text-[10px] font-semibold text-[#1c2530]">
                            {pct}%
                          </span>
                        </div>
                        <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1c2530]/[0.08]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: LOST_CAUSE_COLOR[c] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="rounded-xl bg-[#1c2530]/[0.04] p-3">
              <div className="mb-1.5 text-[10.5px] font-semibold text-[#3a4452]">
                จุดที่คนหลงบ่อยที่สุด
              </div>
              {stats.hotspots.length === 0 ? (
                <div className="text-[10px] text-[#8893a3]">— ยังไม่มีข้อมูล</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {stats.hotspots.map((h, i) => {
                    const node = NODES[h.nodeId];
                    const max = stats.hotspots[0].count || 1;
                    return (
                      <div key={h.nodeId} className="flex items-center gap-2">
                        <span className="mono w-3 shrink-0 text-[10px] font-bold text-[#ec5b54]">
                          {i + 1}
                        </span>
                        <span className="w-[120px] shrink-0 truncate text-[10px] font-medium text-[#3a4452]">
                          {node?.name ?? "—"}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1c2530]/[0.08]">
                          <div
                            className="h-full rounded-full bg-[#ec5b54]"
                            style={{ width: `${(h.count / max) * 100}%` }}
                          />
                        </div>
                        <span className="mono w-6 shrink-0 text-right text-[10px] text-[#8893a3]">
                          {h.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="ถึงจุดไม่หลง (สะสม)"
                value={`${Math.round(stats.firstTrySuccess * 100)}%`}
                accent={stats.firstTrySuccess > 0.6 ? "#22a06b" : "#f0a341"}
              />
              <Metric label="เลี้ยวผิด (สะสม)" value={`${stats.lostEventsTotal}`} accent="#ec5b54" />
              <Metric label="ถามทาง/ยอมแพ้ (สะสม)" value={`${stats.askedTotal}/${stats.giveUpTotal}`} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="โซลูชันที่เปิด" value={`${stats.activeSolutions}/7`} accent="#e0732f" />
              <Metric label="กำลังหลง (ตอนนี้)" value={`${stats.lostNow} คน`} accent="#ec5b54" />
              <Metric label="จิตอาสากำลังช่วย" value={`${stats.volunteersActive}`} accent="#facc15" />
              <Metric label="ผู้ใช้ QR/Kiosk" value={`${stats.digitalUsers}`} accent="#22d3ee" />
              <Metric label="รับนำทางผ่าน LINE" value={`${stats.lineUsers}`} accent="#06c755" />
              <Metric
                label="เดินทางลื่นไหล (ตอนนี้)"
                value={`${Math.round(stats.liveFlow * 100)}%`}
                accent="#22a06b"
              />
            </div>
            <div className="mt-1 flex flex-col gap-2.5 rounded-xl bg-[#1c2530]/[0.04] p-3">
              <Bar label="ประสิทธิผล (ตอนนี้)" value={stats.effectiveness} color="#22a06b" />
              <Bar label="ระดับการลงทุนรวม" value={stats.costIndex} color="#ec5b54" />
              <Bar label="ถึงจุดไม่หลง (สะสม)" value={stats.firstTrySuccess} color="#2f6df0" />
            </div>
            <div className="rounded-xl bg-[#1c2530]/[0.04] p-3 text-[9.5px] leading-snug text-[#8893a3]">
              เป้าหมาย: ดันประสิทธิผลขึ้นโดยใช้ระดับการลงทุนต่ำ — โซลูชันลงทุนต่ำ
              (เส้นสี/แผนที่จุดต่อจุด/จิตอาสา) มักให้ผลคุ้มกว่าของลงทุนสูง (Kiosk/iBeacon)
              ในบริบท รพ.นครพิงค์
            </div>
          </>
        )}
      </div>
    </div>
  );
}
