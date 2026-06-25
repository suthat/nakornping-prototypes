"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { STOPS, STOP_SHELTERS } from "@/miniapps/shuttle/lib/layout";
import { useSimStore } from "@/miniapps/shuttle/lib/store";
import { waitColor } from "@/miniapps/shuttle/lib/colors";

function Canopy({ stopId }: { stopId: number }) {
  const { offset, rotation, indoor } = STOP_SHELTERS[stopId];
  const w = indoor ? 9 : 6.4;
  const d = indoor ? 5.5 : 4.2;
  const h = 3.1;
  const posts: [number, number][] = [
    [-w / 2 + 0.4, -d / 2 + 0.4],
    [w / 2 - 0.4, -d / 2 + 0.4],
    [-w / 2 + 0.4, d / 2 - 0.4],
    [w / 2 - 0.4, d / 2 - 0.4],
  ];
  return (
    <group position={[offset[0], 0, offset[1]]} rotation={[0, rotation, 0]}>
      {/* หลังคา */}
      <mesh position={[0, h, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.22, d]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, h + 0.16, 0]}>
        <boxGeometry args={[w * 0.82, 0.08, d * 0.82]} />
        <meshStandardMaterial color="#eef1f6" roughness={0.7} />
      </mesh>
      {/* เสา */}
      {posts.map(([px, pz], i) => (
        <mesh key={i} position={[px, h / 2, pz]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, h, 10]} />
          <meshStandardMaterial color="#cfd6e0" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Beacon({ stopId }: { stopId: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const color = useRef(new THREE.Color("#eef3ff"));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const stops = useSimStore.getState().stopStats;
    const s = stops[stopId];
    const wait = s ? s.oldestWait : 0;
    waitColor(wait, color.current);

    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + stopId);
    if (ringRef.current) {
      const scale = 1 + pulse * (0.6 + Math.min(wait / 120, 1.2));
      ringRef.current.scale.setScalar(scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - pulse) * 0.55;
      mat.color.copy(color.current);
    }
    if (matRef.current) {
      matRef.current.emissive.copy(color.current);
      matRef.current.emissiveIntensity = 0.6 + pulse * 0.8;
      matRef.current.color.copy(color.current);
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(color.current);
      mat.opacity = 0.18 + pulse * 0.12;
    }
  });

  return (
    <group>
      {/* วงแหวนกระพริบบนพื้น */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[2.2, 2.7, 48]} />
        <meshBasicMaterial transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* แสงเรืองบนพื้น */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshBasicMaterial transparent opacity={0.2} />
      </mesh>
      {/* จุดเรืองแสงด้านบนเสา */}
      <mesh position={[0, 4.4, 0]}>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshStandardMaterial ref={matRef} emissiveIntensity={1} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Stops() {
  const stopStats = useSimStore((s) => s.stopStats);
  const setSelected = useSimStore((s) => s.setSelectedStop);
  const selected = useSimStore((s) => s.selectedStop);

  return (
    <group>
      {STOPS.map((stop) => {
        const [x, z] = stop.position;
        const s = stopStats[stop.id];
        const queue = s?.queue ?? 0;
        const wait = s?.oldestWait ?? 0;
        const isSel = selected === stop.id;
        return (
          <group key={stop.id} position={[x, 0, z]}>
            {/* แท่นป้าย */}
            <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[2.1, 2.3, 0.24, 36]} />
              <meshStandardMaterial color="#ffffff" roughness={0.6} />
            </mesh>
            {/* เสา */}
            <mesh position={[0, 2.2, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 4.4, 12]} />
              <meshStandardMaterial color="#c6cdd8" roughness={0.5} metalness={0.3} />
            </mesh>

            <Beacon stopId={stop.id} />
            <Canopy stopId={stop.id} />

            {/* ป้ายข้อมูลลอย */}
            <Html
              position={[0, 6.6, 0]}
              center
              distanceFactor={62}
              zIndexRange={[20, 0]}
              style={{ pointerEvents: "auto" }}
            >
              <button
                onClick={() => setSelected(isSel ? null : stop.id)}
                className={`select-none whitespace-nowrap rounded-2xl px-3 py-1.5 text-center transition-all duration-200 ${
                  isSel ? "scale-105" : "hover:scale-105"
                }`}
                style={{
                  background: "rgba(255,255,255,0.82)",
                  backdropFilter: "blur(8px)",
                  border: isSel
                    ? "1.5px solid rgba(47,109,240,0.6)"
                    : "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 10px 24px -14px rgba(28,37,48,0.5)",
                  cursor: "pointer",
                }}
              >
                <div
                  className="text-[11px] font-semibold tracking-tightish"
                  style={{ color: "#1c2530" }}
                >
                  {stop.code} · {stop.name}
                </div>
                <div
                  className="mono mt-0.5 flex items-center justify-center gap-2 text-[10px]"
                  style={{ color: "#5b6675" }}
                >
                  <span>คิว {queue}</span>
                  <span style={{ color: wait > 90 ? "#ec5b54" : "#5b6675" }}>
                    รอ {Math.round(wait)}s
                  </span>
                </div>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
