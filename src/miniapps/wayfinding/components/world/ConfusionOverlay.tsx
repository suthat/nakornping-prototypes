"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { NODES, nodePos3 } from "@/miniapps/wayfinding/lib/layout";
import { useSim } from "@/miniapps/wayfinding/lib/SimProvider";
import { useSimStore } from "@/miniapps/wayfinding/lib/store";
import { heatColor } from "@/miniapps/wayfinding/lib/colors";

const HEAT_REF = 5;
const MAX_DOTS = 900;

function HeatDiscs() {
  const sim = useSim();
  const decisionNodes = useMemo(() => NODES.filter((n) => n.decision), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const insights = useSimStore.getState().activeSystem === "insights";
    decisionNodes.forEach((n, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.visible = insights;
      if (!insights) return;
      const h = Math.min(sim.nodeHeat[n.id] / HEAT_REF, 1);
      const mat = m.material as THREE.MeshBasicMaterial;
      heatColor(h, col);
      mat.color.copy(col);
      mat.opacity = 0.12 + h * 0.45;
      const s = 1 + h * 2.4;
      m.scale.set(s, s, 1);
    });
  });

  return (
    <group>
      {decisionNodes.map((n, i) => {
        const p = nodePos3(n.id);
        return (
          <mesh
            key={n.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={[p[0], p[1] + 0.1, p[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[2.2, 32]} />
            <meshBasicMaterial color="#ec5b54" transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function TrailDots() {
  const sim = useSim();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const hot = useMemo(() => new THREE.Color("#ec5b54"), []);
  const cool = useMemo(() => new THREE.Color("#f0a341"), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const insights = useSimStore.getState().activeSystem === "insights";
    mesh.visible = insights;
    let idx = 0;
    if (insights) {
      const trails = sim.getLostTrails();
      for (const tr of trails) {
        const n = tr.points.length;
        for (let k = 0; k < n && idx < MAX_DOTS; k++) {
          const p = tr.points[k];
          dummy.position.set(p[0], p[1], p[2]);
          const s = 0.18 + (k / Math.max(1, n)) * 0.22;
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
          color.copy(cool).lerp(hot, k / Math.max(1, n));
          mesh.setColorAt(idx, color);
          idx++;
        }
      }
    }
    for (let i = idx; i < MAX_DOTS; i++) {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_DOTS]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.85} toneMapped={false} />
    </instancedMesh>
  );
}

export function ConfusionOverlay() {
  return (
    <group>
      <HeatDiscs />
      <TrailDots />
    </group>
  );
}
