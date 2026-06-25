"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { riskColor } from "@/miniapps/tb-airborne/lib/colors";
import { ZONES } from "@/miniapps/tb-airborne/lib/layout";
import { useSim } from "@/miniapps/tb-airborne/lib/SimProvider";

/** ฝาครอบความเสี่ยง quanta ต่อโซน — pulse ตามความเข้ม */
export function RiskAuras() {
  const sim = useSim();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const zones = sim.getZoneSnapshots();

    for (let i = 0; i < ZONES.length; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const z = ZONES[i];
        if (z.kind === "walkway") {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      const snap = zones[i];
      const level = snap?.riskIndex ?? 0;
      const isWc = z.kind === "restroom";
      const pulse = 0.85 + Math.sin(t * (isWc ? 3.8 : 2.5) + i * 0.7) * 0.15;
      const scale = (isWc ? 0.72 : 1) + level * (isWc ? 0.45 : 0.25) * pulse;
      mesh.scale.set(scale, 1, scale);
      riskColor(level, color);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.copy(color);
      mat.emissive.copy(color).multiplyScalar(level * 0.35 * pulse);
      mat.opacity = (isWc ? 0.22 : 0.12) + Math.min(level, 1) * (isWc ? 0.38 : 0.28) * pulse;
    }
  });

  return (
    <group>
      {ZONES.map((z, i) => {
        if (z.kind === "walkway") return null;
        const [x, zz] = z.position;
        const [w, d] = z.size;
        return (
          <mesh
            key={z.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={[x, z.height + 1.2, zz]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[Math.max(w, d) * (z.kind === "restroom" ? 0.55 : 0.42), 48]} />
            <meshStandardMaterial
              color="#22a06b"
              transparent
              opacity={0.15}
              emissive="#22a06b"
              emissiveIntensity={0.1}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
