"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { NODES, nodePos3 } from "@/miniapps/wayfinding/lib/layout";
import { useSimStore } from "@/miniapps/wayfinding/lib/store";

function DecisionMarker({ id }: { id: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const p = nodePos3(id);
  useFrame((state) => {
    if (ref.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2 + id);
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + pulse * 0.22;
      ref.current.scale.setScalar(1 + pulse * 0.3);
    }
  });
  return (
    <mesh ref={ref} position={[p[0], p[1] + 0.12, p[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.6, 2.2, 32]} />
      <meshBasicMaterial color="#e0732f" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Nodes() {
  const setSelected = useSimStore((s) => s.setSelectedNode);
  const selected = useSimStore((s) => s.selectedNode);

  return (
    <group>
      {NODES.filter((n) => n.decision).map((n) => (
        <DecisionMarker key={`d${n.id}`} id={n.id} />
      ))}

      {NODES.filter((n) => n.dest && n.kind !== "gate").map((n) => {
        const p = nodePos3(n.id);
        const isSel = selected === n.id;
        return (
          <Html
            key={`l${n.id}`}
            position={[p[0], p[1] + 2.2, p[2]]}
            center
            distanceFactor={70}
            zIndexRange={[15, 0]}
            style={{ pointerEvents: "auto" }}
          >
            <button
              onClick={() => setSelected(isSel ? null : n.id)}
              className="select-none whitespace-nowrap rounded-lg px-1.5 py-0.5 text-[9.5px] font-semibold transition-all hover:scale-110"
              style={{
                background: isSel ? "rgba(224,115,47,0.92)" : "rgba(255,255,255,0.78)",
                color: isSel ? "#fff" : "#3a4452",
                border: isSel ? "1px solid #e0732f" : "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 6px 14px -10px rgba(28,37,48,0.5)",
                cursor: "pointer",
              }}
            >
              {n.code}
            </button>
          </Html>
        );
      })}
    </group>
  );
}
