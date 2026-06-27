"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { NID, NODES, nodePos3 } from "@/miniapps/wayfinding/lib/layout";
import { useSimStore } from "@/miniapps/wayfinding/lib/store";

/** เส้นสีบนพื้น ระหว่างสอง node (ชั้นเดียวกัน) */
function Stripe({ a, b, color }: { a: number; b: number; color: string }) {
  const pa = nodePos3(a);
  const pb = nodePos3(b);
  if (Math.abs(pa[1] - pb[1]) > 0.5) return null; // ข้ามชั้น (ลิฟต์) ไม่ทาสี
  const dx = pb[0] - pa[0];
  const dz = pb[2] - pa[2];
  const len = Math.hypot(dx, dz);
  const cx = (pa[0] + pb[0]) / 2;
  const cz = (pa[2] + pb[2]) / 2;
  const angle = Math.atan2(dx, dz);
  return (
    <mesh position={[cx, pa[1] + 0.55, cz]} rotation={[-Math.PI / 2, 0, -angle]}>
      <planeGeometry args={[0.7, len]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
    </mesh>
  );
}

function ColorPaths() {
  // เส้นสีหลักแยกตามปลายทาง
  const routes: { a: number; b: number; color: string }[] = [
    { a: NID.COURTYARD, b: NID.OPD_ENTRY, color: "#2f6df0" },
    { a: NID.OPD_ENTRY, b: NID.REGISTER, color: "#22a06b" },
    { a: NID.OPD_ENTRY, b: NID.LAB, color: "#ec5b54" },
    { a: NID.OPD_ENTRY, b: NID.CASHIER, color: "#f0a341" },
    { a: NID.OPD_ENTRY, b: NID.PHARMACY, color: "#a78bfa" },
    { a: NID.LIFT2, b: NID.OBGYN, color: "#a78bfa" },
    { a: NID.LIFT2, b: NID.PED, color: "#38bdf8" },
    { a: NID.LIFT3, b: NID.MED, color: "#2f6df0" },
    { a: NID.LIFT3, b: NID.EKG, color: "#ec5b54" },
    { a: NID.LIFT4, b: NID.EYE, color: "#22a06b" },
    { a: NID.LIFT4, b: NID.ENT, color: "#f0a341" },
    { a: NID.COURTYARD, b: NID.ER, color: "#ec5b54" },
  ];
  return (
    <group>
      {routes.map((r, i) => (
        <Stripe key={i} a={r.a} b={r.b} color={r.color} />
      ))}
    </group>
  );
}

function LandmarkPylons() {
  const hubs = [NID.COURTYARD, NID.OPD_ENTRY, NID.DROPOFF, NID.SEVEN, NID.INFO];
  return (
    <group>
      {hubs.map((id) => {
        const p = nodePos3(id);
        return (
          <group key={id} position={[p[0], p[1], p[2]]}>
            <mesh position={[0, 4, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.18, 8, 8]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[0, 8.4, 0]}>
              <sphereGeometry args={[0.7, 16, 16]} />
              <meshStandardMaterial color="#e0732f" emissive="#e0732f" emissiveIntensity={0.5} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function MiniMaps() {
  // ป้ายแผนที่จุดต่อจุดสั้นๆ ตั้งตามทางเดิน/จุดตัด พร้อม landmark
  const spots = [NID.GATE, NID.COURTYARD, NID.OPD_ENTRY, NID.LIFT2, NID.LIFT3];
  return (
    <group>
      {spots.map((id) => {
        const p = nodePos3(id);
        return (
          <group key={id} position={[p[0] - 2.6, p[1], p[2] + 1.5]}>
            {/* ขาตั้ง */}
            <mesh position={[0, 1, 0]} castShadow>
              <boxGeometry args={[0.2, 2, 0.2]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            {/* แผ่นแผนที่ */}
            <mesh position={[0, 2.3, 0]} rotation={[-0.35, 0, 0]} castShadow>
              <boxGeometry args={[1.7, 1.2, 0.08]} />
              <meshStandardMaterial color="#fefce8" />
            </mesh>
            {/* เส้นทาง + จุด landmark บนแผนที่ */}
            <mesh position={[0, 2.32, 0.06]} rotation={[-0.35, 0, 0]}>
              <planeGeometry args={[1.3, 0.12]} />
              <meshBasicMaterial color="#e0732f" toneMapped={false} />
            </mesh>
            <mesh position={[-0.5, 2.45, 0.06]} rotation={[-0.35, 0, 0]}>
              <circleGeometry args={[0.12, 12]} />
              <meshBasicMaterial color="#2f6df0" toneMapped={false} />
            </mesh>
            <mesh position={[0.5, 2.15, 0.06]} rotation={[-0.35, 0, 0]}>
              <circleGeometry args={[0.12, 12]} />
              <meshBasicMaterial color="#22a06b" toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Beacons() {
  // iBeacon pucks เรืองแสงตามพื้นที่ + ฟอง LINE ลอยเหนือ hub
  const ref = useRef<THREE.Group>(null);
  const beaconIds = [
    NID.GATE,
    NID.COURTYARD,
    NID.OPD_ENTRY,
    NID.REGISTER,
    NID.LAB,
    NID.PHARMACY,
    NID.LIFT1,
    NID.LIFT2,
    NID.LIFT3,
    NID.LIFT4,
    NID.ER,
    NID.IPD,
  ];
  const lineIds = [NID.COURTYARD, NID.OPD_ENTRY, NID.LIFT3];
  useFrame((state) => {
    if (ref.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4);
      ref.current.children.forEach((c) => {
        const halo = c.userData.halo as THREE.Mesh | undefined;
        if (halo) {
          const s = 1 + pulse * 1.4;
          halo.scale.set(s, s, 1);
          (halo.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - pulse);
        }
      });
    }
  });
  return (
    <group ref={ref}>
      {beaconIds.map((id) => {
        const p = nodePos3(id);
        return (
          <group
            key={id}
            position={[p[0], p[1] + 0.6, p[2]]}
            ref={(g) => {
              if (g) g.userData.halo = g.children[1];
            }}
          >
            <mesh>
              <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
              <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} toneMapped={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
              <ringGeometry args={[0.5, 1.4, 24]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {lineIds.map((id) => {
        const p = nodePos3(id);
        return (
          <Html key={`line${id}`} position={[p[0] + 3, p[1] + 5, p[2]]} center distanceFactor={64} zIndexRange={[14, 0]}>
            <div
              className="flex select-none items-center gap-1 whitespace-nowrap rounded-2xl px-2 py-1 text-[10px] font-bold text-white"
              style={{ background: "#06c755", boxShadow: "0 8px 18px -10px rgba(6,199,85,0.7)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.07.7.2.8.5.07.27.05.7.02.97l-.13.8c-.04.24-.19.93.81.51 1-.42 5.4-3.18 7.37-5.44C20.6 14.7 22 13 22 11c0-4.4-4.5-8-10-8Z" />
              </svg>
              LINE นำทาง
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function Volunteers() {
  const count = useSimStore((s) => s.config.volunteerCount);
  const spots = NODES.filter(
    (n) => n.kind === "hub" || n.kind === "junction" || n.kind === "vertical"
  );
  const placed = spots.slice(0, Math.min(count, spots.length));
  return (
    <group>
      {placed.map((n, i) => {
        const p = nodePos3(n.id);
        const off = (i % 2 === 0 ? 1 : -1) * 2.6;
        return (
          <group key={n.id} position={[p[0] + off, p[1], p[2] + 2]}>
            <mesh position={[0, 1.1, 0]} castShadow>
              <capsuleGeometry args={[0.28, 0.7, 4, 8]} />
              <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, 1.9, 0]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Kiosks() {
  const ids = [NID.COURTYARD, NID.OPD_ENTRY, NID.LIFT1, NID.LIFT2, NID.LIFT3, NID.LIFT4];
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3);
      ref.current.children.forEach((c) => {
        const screen = c.children[1] as THREE.Mesh;
        if (screen) {
          const m = screen.material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = 0.4 + pulse * 0.5;
        }
      });
    }
  });
  return (
    <group ref={ref}>
      {ids.map((id) => {
        const p = nodePos3(id);
        return (
          <group key={id} position={[p[0] + 2.4, p[1], p[2] - 1.5]}>
            <mesh position={[0, 1, 0]} castShadow>
              <boxGeometry args={[0.3, 2, 0.3]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[1.3, 1.6, 0.18]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.5} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function QueueArrows() {
  const ref = useRef<THREE.Group>(null);
  const ids = [NID.COURTYARD, NID.OPD_ENTRY];
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((c, i) => {
        c.position.y = nodePos3(ids[i])[1] + 6 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3;
      });
    }
  });
  return (
    <group ref={ref}>
      {ids.map((id) => {
        const p = nodePos3(id);
        return (
          <mesh key={id} position={[p[0], p[1] + 6, p[2]]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.7, 1.6, 4]} />
            <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

export function NavAids() {
  const activeSystem = useSimStore((s) => s.activeSystem);
  const solutions = useSimStore((s) => s.config.solutions);
  if (activeSystem !== "solutions") return null;
  const none = !Object.values(solutions).some(Boolean);
  return (
    <group>
      {solutions.color_path && <ColorPaths />}
      {solutions.landmark && <LandmarkPylons />}
      {solutions.mini_map && <MiniMaps />}
      {solutions.volunteer && <Volunteers />}
      {solutions.qr_kiosk && <Kiosks />}
      {solutions.ibeacon_line && <Beacons />}
      {solutions.queue_aware && <QueueArrows />}
      {none && (
        <Html position={[0, 18, 50]} center distanceFactor={80}>
          <div
            className="select-none whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-medium"
            style={{ background: "rgba(255,255,255,0.85)", color: "#5b6675" }}
          >
            Baseline — ยังไม่เปิดโซลูชันใด (มีแต่แผนผัง A→B)
          </div>
        </Html>
      )}
    </group>
  );
}
