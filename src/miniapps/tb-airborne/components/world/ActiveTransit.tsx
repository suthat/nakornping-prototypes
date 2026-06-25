"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CAFETERIA_ID, pointOnSegment, zoneCenter } from "@/miniapps/tb-airborne/lib/layout";
import { useSim } from "@/miniapps/tb-airborne/lib/SimProvider";
import type { LifeActivity, PersonKind, ScreeningStage } from "@/miniapps/tb-airborne/lib/types";

const MAX_LINES = 48;
const SEGMENTS = 22;

function trailColor(
  kind: PersonKind,
  activity: LifeActivity,
  screeningStage: ScreeningStage
): string {
  if (screeningStage === "to_tb") return "#22a06b";
  if (screeningStage === "waiting_iden") return "#f59e0b";
  if (screeningStage === "iden_done") return "#16a34a";
  if (kind === "active") return "#9333ea";
  if (activity === "eating") return "#f0a341";
  if (activity === "restroom") return "#38bdf8";
  if (kind === "visitor") return "#64748b";
  return "#2f6df0";
}

/** เส้นทางเรืองแสงตามคนที่กำลังเดินข้ามโzoน */
export function ActiveTransit() {
  const sim = useSim();
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Line[]>([]);
  const pulse = useRef(0);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const lines: THREE.Line[] = [];
    for (let i = 0; i < MAX_LINES; i++) {
      const positions = new Float32Array((SEGMENTS + 1) * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: "#2f6df0",
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          toneMapped: false,
        })
      );
      line.visible = false;
      group.add(line);
      lines.push(line);
    }
    linesRef.current = lines;
    return () => {
      for (const line of lines) {
        group.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
      linesRef.current = [];
    };
  }, []);

  useFrame((_, delta) => {
    pulse.current += delta;
    const t = pulse.current;
    const agents = sim.getAgentSnapshots().filter((a) => a.inTransit);

    for (let i = 0; i < MAX_LINES; i++) {
      const line = linesRef.current[i];
      if (!line) continue;
      const agent = agents[i];
      if (!agent || agent.toZone == null) {
        line.visible = false;
        continue;
      }

      line.visible = true;
      const positions = (line.geometry.attributes.position as THREE.BufferAttribute)
        .array as Float32Array;

      for (let s = 0; s <= SEGMENTS; s++) {
        const segT = s / SEGMENTS;
        const [x, z] = pointOnSegment(agent.fromZone, agent.toZone, segT);
        const idx = s * 3;
        positions[idx] = x;
        positions[idx + 1] = 0.55 + Math.sin(segT * Math.PI) * 0.35;
        positions[idx + 2] = z;
      }
      line.geometry.attributes.position.needsUpdate = true;

      const mat = line.material as THREE.LineBasicMaterial;
      mat.color.set(trailColor(agent.kind, agent.activity, agent.screeningStage));
      const flicker = 0.75 + Math.sin(t * 3.5 + agent.id) * 0.25;
      mat.opacity =
        agent.screeningStage === "to_tb"
          ? 0.55 + flicker * 0.4
          : agent.kind === "active"
            ? 0.45 + flicker * 0.45
            : 0.28 + flicker * 0.32;
    }
  });

  return <group ref={groupRef} />;
}

/** วงแหวนใต้เท้าคนที่กำลังเดิน */
export function ActiveFootprints() {
  const sim = useSim();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const MAX = 24;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const agents = sim.getAgentSnapshots().filter((a) => a.inTransit);

    for (let i = 0; i < MAX; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const a = agents[i];
      if (!a) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set(a.position[0], 0.18, a.position[1]);
      const pulse = 1 + Math.sin(t * 4.5 + a.id) * 0.2;
      mesh.scale.setScalar(a.kind === "active" ? pulse * 1.15 : pulse * 0.92);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(trailColor(a.kind, a.activity, a.screeningStage));
      mat.opacity = 0.28 + Math.sin(t * 5 + a.id * 0.7) * 0.18;
    }
  });

  return (
    <group>
      {Array.from({ length: MAX }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.85, 1.25, 32]} />
          <meshBasicMaterial
            color="#2f6df0"
            transparent
            opacity={0.4}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** จุดกระพริบบนโroงอาหาร เมื่อมีคนใช้งาน */
export function ActivityMarkers() {
  const sim = useSim();
  const foodRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const stats = sim.getStats();
    const food = foodRef.current;
    if (!food) return;

    const [fx, fz] = zoneCenter(CAFETERIA_ID);
    const foodPulse = stats.atCafeteria > 0 ? 0.55 + Math.sin(t * 3) * 0.25 : 0.08;

    food.position.set(fx, 12.5, fz);
    food.scale.setScalar(1 + foodPulse * 0.35);
    (food.material as THREE.MeshBasicMaterial).opacity = foodPulse;
  });

  return (
    <mesh ref={foodRef}>
      <sphereGeometry args={[1.8, 16, 16]} />
      <meshBasicMaterial color="#f0a341" transparent opacity={0.1} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
