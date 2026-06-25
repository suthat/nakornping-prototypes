"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RECEPTION_ID, TB_CLINIC_ID } from "@/miniapps/tb-airborne/lib/layout";
import { healthColor, exposureColor, activityColor } from "@/miniapps/tb-airborne/lib/colors";
import { useSim } from "@/miniapps/tb-airborne/lib/SimProvider";

const MAX_AGENTS = 1500;

function crowdScale(count: number): number {
  if (count > 900) return 0.58;
  if (count > 650) return 0.68;
  if (count > 450) return 0.78;
  if (count > 300) return 0.88;
  return 1;
}

export function People() {
  const sim = useSim();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const bright = useMemo(() => new THREE.Color("#c084fc"), []);
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
    const seen = new Set<number>();
    const density = crowdScale(agents.length);

    for (let i = 0; i < MAX_AGENTS; i++) {
      if (i < agents.length) {
        const a = agents[i];
        seen.add(a.id);
        const moving = a.inTransit;
        const isVisitor = a.kind === "visitor";
        const bob = moving
          ? Math.abs(Math.sin(t * (isVisitor ? 9 : 7.5) + a.id)) * 0.14
          : Math.sin(t * 2.2 + a.id * 1.3) * 0.06;

        const target = new THREE.Vector3(a.position[0], 0, a.position[1]);
        let pos = smooth.current.get(a.id);
        if (!pos) {
          pos = target.clone();
          smooth.current.set(a.id, pos);
        }
        pos.lerp(target, moving ? 0.14 : 0.28);

        const y = moving ? 0.95 + bob : 0.75 + bob;
        dummy.position.set(pos.x, y, pos.z);
        dummy.rotation.y = moving
          ? Math.atan2(
              Math.sin(a.id * 2.1 + t * 0.35),
              Math.cos(a.id * 1.7 + t * 0.35)
            )
          : Math.sin(a.id) * 0.5;

        if (moving) {
          dummy.scale.setScalar(isVisitor ? 1.08 : a.kind === "active" ? 1.55 : 1.18);
        } else if (a.kind === "active") {
          dummy.scale.setScalar(1.2);
        } else if (a.zoneId === TB_CLINIC_ID && a.kind === "non_active") {
          dummy.scale.setScalar(1.08);
        } else if (isVisitor) {
          dummy.scale.setScalar(0.88);
        } else {
          dummy.scale.setScalar(1);
        }
        dummy.scale.multiplyScalar(density);

        if (a.screeningStage === "waiting_iden") {
          const pulse = 1.06 + Math.sin(t * 4 + a.id) * 0.08;
          dummy.scale.setScalar(pulse);
          color.set("#f59e0b");
        } else if (a.screeningStage === "iden_done") {
          dummy.scale.setScalar(1.12);
          color.set("#22a06b");
        } else if (a.screeningStage === "to_tb") {
          dummy.scale.setScalar(moving ? 1.38 : 1.2);
          color.set("#16a34a");
        } else if (a.activity === "leaving") {
          dummy.scale.setScalar(moving ? 1.02 : 0.82);
          activityColor("leaving", a.kind, color);
          color.lerp(new THREE.Color("#ffffff"), moving ? 0.35 : 0.5);
        } else if (a.activity === "opd" && a.zoneId === RECEPTION_ID) {
          dummy.scale.setScalar(isVisitor ? 0.95 : 1);
          activityColor("opd", a.kind, color);
        } else if (a.kind === "active" && !a.identified) {
          color.set("#f59e0b");
        } else if (a.kind === "active" && moving) {
          color.copy(bright);
        } else if (moving) {
          activityColor(a.activity, a.kind, color);
        } else if (a.activity !== "idle" && a.activity !== "transit") {
          activityColor(a.activity, a.kind, color);
        } else if (a.kind === "active") {
          healthColor("infected", "active", color);
        } else if (a.status === "exposed") {
          exposureColor(a.exposure, color);
        } else {
          healthColor(a.status, a.kind, color);
        }
        mesh.setColorAt(i, color);
      } else {
        dummy.position.set(0, -50, 0);
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
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_AGENTS]}
      castShadow
      frustumCulled={false}
    >
      <capsuleGeometry args={[0.26, 0.6, 4, 8]} />
      <meshStandardMaterial roughness={0.65} metalness={0.02} />
    </instancedMesh>
  );
}
