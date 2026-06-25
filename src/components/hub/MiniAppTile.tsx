"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MiniAppEntry } from "@/lib/miniapps";

export function MiniAppTile({
  app,
  position,
}: {
  app: MiniAppEntry;
  position: [number, number, number];
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const lift = hovered ? 0.08 : 0;
  const glow = hovered ? 0.28 : 0.08;

  return (
    <group position={[position[0], position[1] + lift, position[2]]}>
      {/* ฐาน */}
      <RoundedBox
        args={[2.75, 0.2, 2.75]}
        radius={0.1}
        smoothness={4}
        position={[0, 0.1, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#eef2f7" metalness={0.08} roughness={0.75} />
      </RoundedBox>

      {/* แผงหลัก */}
      <RoundedBox
        args={[2.15, 2.55, 0.14]}
        radius={0.1}
        smoothness={4}
        position={[0, 1.48, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          router.push(app.href);
        }}
      >
        <meshStandardMaterial
          color={app.color}
          emissive={app.color}
          emissiveIntensity={glow}
          metalness={0.18}
          roughness={0.38}
        />
      </RoundedBox>

      {/* แถบ accent ด้านบน */}
      <mesh position={[0, 2.78, 0.08]} castShadow>
        <boxGeometry args={[1.6, 0.08, 0.06]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={hovered ? 0.35 : 0.12}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* ไอคอน */}
      <group position={[0, 1.55, 0.12]}>
        {app.icon === "shuttle" && <ShuttleIcon />}
        {app.icon === "tb-airborne" && <AirborneIcon />}
      </group>

      {/* ป้ายชื่อ — อยู่ใต้ฐาน ไม่ทับแผ่นข้างเคียง */}
      <Html
        center
        position={[0, -0.72, 0]}
        distanceFactor={9}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          className="w-[190px] rounded-2xl px-4 py-3 text-center transition-all duration-300"
          style={{
            background: hovered
              ? "rgba(255,255,255,0.92)"
              : "rgba(255,255,255,0.78)",
            border: `1px solid ${hovered ? app.color + "44" : "rgba(255,255,255,0.9)"}`,
            boxShadow: hovered
              ? `0 16px 36px -14px ${app.color}66, 0 4px 12px -6px rgba(28,37,48,0.15)`
              : "0 10px 24px -16px rgba(28,37,48,0.35)",
            backdropFilter: "blur(14px)",
            transform: hovered ? "translateY(-2px)" : "none",
          }}
        >
          <div
            className="mx-auto mb-2 h-1 w-8 rounded-full"
            style={{ background: app.color }}
          />
          <div className="text-[14px] font-semibold tracking-tightish text-[#1c2530]">
            {app.title}
          </div>
          <div className="mt-1 text-[11px] leading-snug text-[#5b6675]">
            {app.description}
          </div>
          <div
            className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10.5px] font-semibold transition-opacity"
            style={{
              background: `${app.color}18`,
              color: app.color,
              opacity: hovered ? 1 : 0.75,
            }}
          >
            เข้าจำลอง
            <span aria-hidden>→</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

function ShuttleIcon() {
  return (
    <group scale={0.44}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[2.1, 0.5, 0.85]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[1.95, 0.32, 0.78]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.15}
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, -0.05, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
    </group>
  );
}

function AirborneIcon() {
  return (
    <group scale={0.42}>
      {/* โรงอาคารคลินิก */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[1.6, 1.1, 1]} />
        <meshStandardMaterial color="#f0fdf4" metalness={0.05} roughness={0.4} />
      </mesh>
      {/* อนุภาคลอย — แพร่เชื้อทางอากาศ */}
      {[
        [-0.55, 0.95, 0.2],
        [0.15, 1.15, -0.15],
        [0.65, 0.85, 0.25],
        [-0.2, 1.05, -0.35],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.12 + (i % 2) * 0.04, 12, 12]} />
          <meshStandardMaterial
            color="#6ee7b7"
            emissive="#34d399"
            emissiveIntensity={0.45}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* เส้นลม */}
      <mesh position={[0.5, 0.75, 0.35]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.35, 0.025, 8, 24, Math.PI * 0.7]} />
        <meshStandardMaterial color="#a7f3d0" emissive="#6ee7b7" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}
