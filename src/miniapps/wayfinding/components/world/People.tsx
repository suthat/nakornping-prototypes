"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/miniapps/wayfinding/lib/SimProvider";
import { useSimStore } from "@/miniapps/wayfinding/lib/store";
import { activityColor, distressColor, kindColor } from "@/miniapps/wayfinding/lib/colors";

const MAX_AGENTS = 1500;

function crowdScale(count: number): number {
  if (count > 1000) return 0.62;
  if (count > 700) return 0.72;
  if (count > 450) return 0.84;
  return 1;
}

export function People() {
  const sim = useSim();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const cyan = useMemo(() => new THREE.Color("#22d3ee"), []);
  const purple = useMemo(() => new THREE.Color("#a78bfa"), []);
  const red = useMemo(() => new THREE.Color("#ec5b54"), []);
  const clean = useMemo(() => new THREE.Color("#5fbf8f"), []);
  const smooth = useRef(new Map<number, THREE.Vector3>());

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color("#ffffff");
    for (let i = 0; i < MAX_AGENTS; i++) mesh.setColorAt(i, c);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const agents = sim.getAgentSnapshots();
    const system = useSimStore.getState().activeSystem;
    const seen = new Set<number>();
    const density = crowdScale(agents.length);

    for (let i = 0; i < MAX_AGENTS; i++) {
      if (i < agents.length) {
        const a = agents[i];
        seen.add(a.id);
        const moving = a.inTransit;
        const bob = moving
          ? Math.abs(Math.sin(t * 8 + a.id)) * 0.14
          : Math.sin(t * 2.2 + a.id * 1.3) * 0.05;

        const target = new THREE.Vector3(a.position[0], a.height, a.position[1]);
        let pos = smooth.current.get(a.id);
        if (!pos) {
          pos = target.clone();
          smooth.current.set(a.id, pos);
        }
        pos.lerp(target, moving ? 0.16 : 0.3);

        dummy.position.set(pos.x, a.height + 0.75 + bob, pos.z);
        dummy.rotation.y = moving ? Math.sin(a.id * 2.1 + t * 0.4) : Math.sin(a.id) * 0.5;

        let sc = a.kind === "elder" ? 0.92 : a.kind === "staff" ? 1.04 : 1;
        if (a.activity === "lost") sc *= 1.12;
        dummy.scale.setScalar(sc * density);

        // สีตามมุมมองระบบ
        if (system === "insights") {
          if (a.activity === "lost") color.copy(red);
          else distressColor(a.distress, color);
        } else if (system === "solutions") {
          if (a.usingDigital) color.copy(cyan);
          else if (a.activity === "asking") color.copy(purple);
          else if (a.activity === "lost") color.copy(red);
          else if (a.hasBeenLost) distressColor(0.6, color);
          else color.copy(clean);
        } else {
          // traffic: สีตามกิจกรรม + เน้นประเภทเล็กน้อย
          if (a.activity === "transit" || a.activity === "idle") kindColor(a.kind, color);
          else activityColor(a.activity, color);
        }
        mesh.setColorAt(i, color);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    for (const id of smooth.current.keys()) {
      if (!seen.has(id)) smooth.current.delete(id);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_AGENTS]} castShadow frustumCulled={false}>
      <capsuleGeometry args={[0.26, 0.6, 4, 8]} />
      <meshStandardMaterial roughness={0.65} metalness={0.02} />
    </instancedMesh>
  );
}
