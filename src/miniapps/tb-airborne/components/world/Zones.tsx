"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PATHS, ZONES } from "@/miniapps/tb-airborne/lib/layout";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";

export function ZoneMarkers() {
  const selected = useSimStore((s) => s.selectedZone);
  const zoneStats = useSimStore((s) => s.zoneStats);

  const riskByZone = useMemo(() => {
    const m = new Map<number, number>();
    for (const z of zoneStats) m.set(z.id, z.riskIndex);
    return m;
  }, [zoneStats]);

  return (
    <group>
      {ZONES.filter((z) => z.kind !== "walkway").map((z) => {
        const [x, zz] = z.position;
        const [w, d] = z.size;
        const risk = riskByZone.get(z.id) ?? 0;
        const sel = selected === z.id;
        const opacity = 0.08 + Math.min(risk, 1) * 0.35;
        return (
          <group key={z.id} position={[x, 0.05, zz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[w + 1, d + 1]} />
              <meshStandardMaterial
                color={z.color}
                transparent
                opacity={opacity}
                roughness={0.9}
              />
            </mesh>
            {sel && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[Math.max(w, d) * 0.45, Math.max(w, d) * 0.52, 48]} />
                <meshBasicMaterial color="#059669" transparent opacity={0.7} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}

    </group>
  );
}

/** เส้นทางเชื่อมโซน */
export function PathLines() {
  const points = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    for (const p of PATHS) {
      const a = ZONES[p.from].position;
      const b = ZONES[p.to].position;
      const mid: [number, number] = [
        (a[0] + b[0]) / 2 + (Math.random() - 0.5) * 8,
        (a[1] + b[1]) / 2 + (Math.random() - 0.5) * 8,
      ];
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(a[0], 0.3, a[1]),
        new THREE.Vector3(mid[0], 0.3, mid[1]),
        new THREE.Vector3(b[0], 0.3, b[1])
      );
      lines.push(curve.getPoints(24));
    }
    return lines;
  }, []);

  return (
    <group>
      {points.map((pts, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#bcc6d4" transparent opacity={0.55} />
        </line>
      ))}
    </group>
  );
}
