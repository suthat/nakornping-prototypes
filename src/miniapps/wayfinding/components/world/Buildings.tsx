"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useState } from "react";
import {
  BUILDINGS,
  CONSTRUCTION,
  FLOOR_GAP,
  OPD,
  OPD_DIRECTORY,
  SimpleBuilding,
} from "@/miniapps/wayfinding/lib/layout";

function FloorPlate({
  y,
  w,
  d,
  label,
  accent,
}: {
  y: number;
  w: number;
  d: number;
  label: string;
  accent: string;
}) {
  return (
    <group position={[0, y, 0]}>
      {/* แผ่นพื้นชั้น */}
      <RoundedBox args={[w, 0.5, d]} radius={0.4} smoothness={3} receiveShadow castShadow>
        <meshStandardMaterial color="#fbfcfe" roughness={0.7} metalness={0.04} />
      </RoundedBox>
      {/* แถบขอบสีบอกชั้น */}
      <mesh position={[0, 0.3, d / 2 - 0.2]}>
        <boxGeometry args={[w, 0.18, 0.3]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      <Html position={[-w / 2 - 1, 0.4, d / 2 - 2]} center distanceFactor={70} zIndexRange={[6, 0]}>
        <div
          className="mono select-none whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-semibold"
          style={{ background: "rgba(255,255,255,0.82)", color: accent }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function OpdTower() {
  const [cx, cz] = OPD.center;
  const [w, d] = OPD.size;
  const [open, setOpen] = useState(false);
  const floorAccents = ["#2f6df0", "#a78bfa", "#e0732f", "#38bdf8"];
  const officeBase = OPD.serviceFloors * FLOOR_GAP;
  const officeHeight = OPD.officeFloors * 3.4;

  return (
    <group position={[cx, 0, cz]}>
      {/* ฐานอาคาร */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[w + 4, 0.24, d + 4]} />
        <meshStandardMaterial color="#dfe4ec" roughness={0.95} />
      </mesh>

      {/* แผ่นชั้นบริการ F1-F4 (exploded) */}
      {OPD_DIRECTORY.slice(0, OPD.serviceFloors).map((f, i) => (
        <FloorPlate
          key={f.floor}
          y={0.3 + i * FLOOR_GAP}
          w={w}
          d={d}
          label={`ชั้น ${f.floor}`}
          accent={floorAccents[i] ?? "#2f6df0"}
        />
      ))}

      {/* แกนลิฟต์/บันได กลางอาคาร */}
      <mesh position={[0, officeBase / 2, -3]} castShadow>
        <cylinderGeometry args={[2.2, 2.2, officeBase + 1, 18]} />
        <meshStandardMaterial color="#c6cdd8" roughness={0.5} metalness={0.3} transparent opacity={0.7} />
      </mesh>

      {/* หอสำนักงานชั้น 5-7 */}
      <RoundedBox
        args={[w * 0.9, officeHeight, d * 0.9]}
        radius={1.2}
        smoothness={4}
        position={[0, officeBase + officeHeight / 2 + 0.4, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#fbfcfe" roughness={0.72} metalness={0.05} />
      </RoundedBox>
      <mesh position={[0, officeBase + officeHeight + 0.7, 0]} castShadow>
        <boxGeometry args={[w * 0.7, 0.5, d * 0.7]} />
        <meshStandardMaterial color="#eef1f6" roughness={0.8} />
      </mesh>

      {/* ป้ายอาคาร + ปุ่มดู directory */}
      <Html
        position={[0, officeBase + officeHeight + 4, 0]}
        center
        distanceFactor={64}
        zIndexRange={[30, 0]}
        style={{ pointerEvents: "auto" }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="select-none whitespace-nowrap rounded-2xl px-3 py-1.5 text-center transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.86)",
            backdropFilter: "blur(8px)",
            border: open ? "1.5px solid rgba(224,115,47,0.6)" : "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 10px 24px -14px rgba(28,37,48,0.5)",
            cursor: "pointer",
          }}
        >
          <div className="text-[12px] font-semibold tracking-tightish text-[#1c2530]">
            อาคารผู้ป่วยนอก 7 ชั้น (อาคาร 3)
          </div>
          <div className="mono mt-0.5 text-[9.5px] text-[#8893a3]">
            แตะเพื่อดูผังชั้น · หน้าสุดของ รพ.
          </div>
        </button>
      </Html>

      {open && (
        <Html position={[w / 2 + 12, officeBase, 0]} center distanceFactor={62} zIndexRange={[31, 0]} style={{ pointerEvents: "auto" }}>
          <div
            className="w-[230px] rounded-2xl p-3 text-left"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 16px 36px -18px rgba(28,37,48,0.55)",
            }}
          >
            <div className="mb-1.5 text-[11px] font-semibold text-[#1c2530]">
              ผังอาคาร 7 ชั้น
            </div>
            <div className="flex flex-col gap-1">
              {OPD_DIRECTORY.map((f) => (
                <div key={f.floor} className="flex gap-2 text-[10px] leading-snug">
                  <span className="mono shrink-0 font-semibold text-[#e0732f]">{f.label}</span>
                  <span className="text-[#5b6675]">{f.rooms}</span>
                </div>
              ))}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function SimpleBuildingMesh({ b }: { b: SimpleBuilding }) {
  const [x, z] = b.position;
  const [w, d] = b.size;
  const r = b.radius ?? 1;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[w + 2.4, 0.24, d + 2.4]} />
        <meshStandardMaterial color="#dfe4ec" roughness={0.95} />
      </mesh>
      <RoundedBox
        args={[w, b.height, d]}
        radius={r}
        smoothness={4}
        position={[0, b.height / 2 + 0.24, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={b.color} roughness={0.74} metalness={0.04} />
      </RoundedBox>
      {b.accent && (
        <mesh position={[0, b.height + 0.5, 0]}>
          <boxGeometry args={[w * 0.7, 0.3, d * 0.7]} />
          <meshStandardMaterial color={b.accent} emissive={b.accent} emissiveIntensity={0.25} />
        </mesh>
      )}
      <Html position={[0, b.height + 2.4, 0]} center distanceFactor={66} zIndexRange={[12, 0]}>
        <div
          className="select-none whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            background: "rgba(255,255,255,0.82)",
            color: b.accent ?? "#1c2530",
            boxShadow: "0 8px 18px -12px rgba(28,37,48,0.5)",
          }}
        >
          {b.label}
        </div>
      </Html>
    </group>
  );
}

function ConstructionSite() {
  const [x, z] = CONSTRUCTION.position;
  const [w, d] = CONSTRUCTION.size;
  return (
    <group position={[x, 0, z]}>
      {/* พื้นไซต์ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#cdb89a" roughness={1} />
      </mesh>
      {/* รั้วไซต์ (เสาเป็นระยะ) */}
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 13;
        const px = -w / 2 + t * w;
        return (
          <mesh key={`f${i}`} position={[px, 1, d / 2]} castShadow>
            <boxGeometry args={[0.3, 2, 0.3]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        );
      })}
      {/* เสาเข็ม/ฐานราก */}
      {[
        [-10, -6],
        [-2, 2],
        [8, -4],
        [12, 6],
        [-8, 8],
      ].map(([px, pz], i) => (
        <mesh key={`p${i}`} position={[px, 3, pz]} castShadow>
          <boxGeometry args={[2.2, 6, 2.2]} />
          <meshStandardMaterial color="#9aa3b2" roughness={0.9} />
        </mesh>
      ))}
      {/* เครน */}
      <group position={[6, 0, -2]}>
        <mesh position={[0, 14, 0]} castShadow>
          <boxGeometry args={[0.9, 28, 0.9]} />
          <meshStandardMaterial color="#f5c542" />
        </mesh>
        <mesh position={[6, 27, 0]} castShadow>
          <boxGeometry args={[22, 0.7, 0.7]} />
          <meshStandardMaterial color="#f5c542" />
        </mesh>
        <mesh position={[14, 22, 0]}>
          <boxGeometry args={[0.2, 9, 0.2]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>
      <Html position={[0, 9, 0]} center distanceFactor={70} zIndexRange={[10, 0]}>
        <div
          className="select-none whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-semibold"
          style={{
            background: "rgba(245,197,66,0.92)",
            color: "#5b3d00",
            boxShadow: "0 8px 18px -12px rgba(28,37,48,0.5)",
          }}
        >
          อาคาร 10 ชั้นหลังใหม่ · กำลังก่อสร้าง 2569-2572
        </div>
      </Html>
    </group>
  );
}

export function Buildings() {
  return (
    <group>
      <OpdTower />
      {BUILDINGS.map((b, i) => (
        <SimpleBuildingMesh key={i} b={b} />
      ))}
      <ConstructionSite />
    </group>
  );
}
