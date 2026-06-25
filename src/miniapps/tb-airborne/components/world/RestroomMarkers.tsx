"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { RESTROOM_ZONE_IDS, ZONES } from "@/miniapps/tb-airborne/lib/layout";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";

/** จุดเสี่ยงห้องน้ำทุกตึก — pulse ตาม occupancy + quanta risk */
export function RestroomMarkers() {
  const zoneStats = useSimStore((s) => s.zoneStats);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const pulse = useRef(0);

  useFrame((state) => {
    pulse.current = state.clock.elapsedTime;
    for (let i = 0; i < RESTROOM_ZONE_IDS.length; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const wcId = RESTROOM_ZONE_IDS[i];
      const snap = zoneStats[wcId];
      const occ = snap?.occupants ?? 0;
      const risk = snap?.riskIndex ?? 0;
      const active = occ > 0 || risk > 0.35;
      const t = pulse.current;
      const flicker = active ? 0.5 + Math.sin(t * 3.2 + wcId) * 0.28 : 0.1;
      const scale = 1 + (active ? risk * 0.45 : 0) + Math.sin(t * 2.5 + i) * 0.06;
      mesh.scale.setScalar(scale);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = flicker;
      mat.color.set(risk > 0.55 ? "#f0a341" : risk > 0.3 ? "#38bdf8" : "#7dd3fc");
    }
  });

  return (
    <group>
      {RESTROOM_ZONE_IDS.map((wcId, i) => {
        const z = ZONES[wcId];
        const [x, zz] = z.position;
        const snap = zoneStats[wcId];
        const occ = snap?.occupants ?? 0;
        return (
          <group key={wcId}>
            <mesh
              ref={(el) => {
                refs.current[i] = el;
              }}
              position={[x, z.height + 2.2, zz]}
            >
              <sphereGeometry args={[1.15, 16, 16]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.12}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <Text
              position={[x, z.height + 3.6, zz]}
              fontSize={0.85}
              color="#0ea5e9"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.04}
              outlineColor="#ffffff"
            >
              {z.code}
              {occ > 0 ? ` · ${occ}` : ""}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
