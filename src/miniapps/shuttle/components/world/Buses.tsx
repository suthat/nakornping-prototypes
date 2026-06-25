"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ROUTE_CURVE, ROUTE_LENGTH } from "@/miniapps/shuttle/lib/layout";
import { useSim } from "@/miniapps/shuttle/lib/SimProvider";
import { useSimStore } from "@/miniapps/shuttle/lib/store";
import { loadColor } from "@/miniapps/shuttle/lib/colors";

function Bus({ id }: { id: number }) {
  const sim = useSim();
  const groupRef = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Mesh>(null);
  const fillMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const bus = sim.buses[id];
    const g = groupRef.current;
    if (!bus || !g) return;
    const t = ((bus.distance % ROUTE_LENGTH) + ROUTE_LENGTH) % ROUTE_LENGTH;
    const u = t / ROUTE_LENGTH;
    ROUTE_CURVE.getPointAt(u, pos);
    ROUTE_CURVE.getTangentAt(u, tan).setY(0).normalize();

    const dwelling = bus.state === "dwelling";
    const bob = dwelling ? 0 : Math.sin(state.clock.elapsedTime * 6 + id) * 0.04;
    g.position.set(pos.x, 1.15 + bob, pos.z);
    g.rotation.y = Math.atan2(tan.x, tan.z);

    const cap = sim.capacity;
    const ratio = cap > 0 ? bus.onboard.length / cap : 0;
    const load = sim.config.seatsPerBus > 0 ? bus.onboard.length / sim.config.seatsPerBus : 0;
    loadColor(load, tmpColor);

    if (fillRef.current) {
      const w = Math.max(0.001, ratio) * 2.6;
      fillRef.current.scale.x = w;
      fillRef.current.position.x = -1.3 + w / 2;
    }
    if (fillMat.current) {
      fillMat.current.color.copy(tmpColor);
      fillMat.current.emissive.copy(tmpColor);
      fillMat.current.emissiveIntensity = 0.45;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4);
      mat.opacity = dwelling ? 0.22 + pulse * 0.18 : 0.0;
      const sc = dwelling ? 1 + pulse * 0.5 : 1;
      glowRef.current.scale.setScalar(sc);
    }
    if (labelRef.current) {
      labelRef.current.textContent = `${bus.onboard.length}/${cap}`;
    }
  });

  return (
    <group ref={groupRef}>
      {/* แสงเรืองใต้รถตอนจอดรับ */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
        <circleGeometry args={[3.2, 40]} />
        <meshBasicMaterial color="#f0a341" transparent opacity={0} />
      </mesh>

      {/* ตัวรถ */}
      <RoundedBox args={[2.6, 2.0, 5.6]} radius={0.55} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color="#fbfcfe" roughness={0.45} metalness={0.1} />
      </RoundedBox>
      {/* แถบกระจกรอบคัน */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[2.64, 0.7, 4.4]} />
        <meshStandardMaterial color="#b9c6da" roughness={0.25} metalness={0.5} />
      </mesh>
      {/* กระจกหน้า */}
      <mesh position={[0, 0.35, 2.5]}>
        <boxGeometry args={[2.2, 0.85, 0.7]} />
        <meshStandardMaterial color="#9fb1cc" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* แถบสีหลังคา */}
      <mesh position={[0, 1.06, 0]}>
        <boxGeometry args={[1.7, 0.12, 4.2]} />
        <meshStandardMaterial color="#2f6df0" roughness={0.5} emissive="#2f6df0" emissiveIntensity={0.25} />
      </mesh>

      {/* ล้อ */}
      {[
        [-1.2, -0.85, 1.7],
        [1.2, -0.85, 1.7],
        [-1.2, -0.85, -1.7],
        [1.2, -0.85, -1.7],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 16]} />
          <meshStandardMaterial color="#3a4250" roughness={0.7} />
        </mesh>
      ))}

      {/* แถบผู้โดยสารเหนือรถ */}
      <group position={[0, 2.0, 0]}>
        <mesh>
          <boxGeometry args={[2.8, 0.34, 0.16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh ref={fillRef} position={[0, 0, 0.02]}>
          <boxGeometry args={[1, 0.22, 0.12]} />
          <meshStandardMaterial ref={fillMat} color="#f0a341" />
        </mesh>
      </group>

      <Html position={[0, 2.7, 0]} center distanceFactor={70} zIndexRange={[10, 0]}>
        <div
          ref={labelRef}
          className="mono select-none rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: "rgba(255,255,255,0.85)",
            color: "#1c2530",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 6px 16px -10px rgba(28,37,48,0.6)",
            whiteSpace: "nowrap",
          }}
        >
          0/0
        </div>
      </Html>
    </group>
  );
}

export function Buses() {
  const numBuses = useSimStore((s) => s.config.numBuses);
  const ids = Array.from({ length: numBuses }, (_, i) => i);
  return (
    <group>
      {ids.map((id) => (
        <Bus key={id} id={id} />
      ))}
    </group>
  );
}
