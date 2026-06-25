"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { STOPS, STOP_SHELTERS } from "@/miniapps/shuttle/lib/layout";
import { useSim } from "@/miniapps/shuttle/lib/SimProvider";
import { useSimStore } from "@/miniapps/shuttle/lib/store";
import { waitColor } from "@/miniapps/shuttle/lib/colors";
import { WEATHER } from "@/miniapps/shuttle/lib/types";

const PER_STOP = 54;
const OPEN_COLS = 9;
const OPEN_SP = 0.92;
const SHELTER_COLS = 6;
const SHELTER_SP = 0.6;
const TOTAL = STOPS.length * PER_STOP;

type Slot = [number, number];

export function People() {
  const sim = useSim();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const rainSmooth = useRef(0);

  // ผังเปิด (กระจายหน้าป้าย) — เหมือนกันทุกป้าย
  const openSlots = useMemo<Slot[]>(() => {
    const arr: Slot[] = [];
    for (let i = 0; i < PER_STOP; i++) {
      const c = i % OPEN_COLS;
      const r = Math.floor(i / OPEN_COLS);
      arr.push([(c - (OPEN_COLS - 1) / 2) * OPEN_SP, 3.0 + r * OPEN_SP]);
    }
    return arr;
  }, []);

  // ผังหลบฝน (กระจุกแน่นที่จุด shelter) — ต่อป้าย
  const shelterSlots = useMemo<Slot[][]>(() => {
    return STOPS.map((_, si) => {
      const { offset, rotation } = STOP_SHELTERS[si];
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const arr: Slot[] = [];
      for (let i = 0; i < PER_STOP; i++) {
        const c = i % SHELTER_COLS;
        const r = Math.floor(i / SHELTER_COLS);
        const lx = (c - (SHELTER_COLS - 1) / 2) * SHELTER_SP;
        const lz = (r - 1.5) * SHELTER_SP;
        const wx = lx * cos + lz * sin;
        const wz = -lx * sin + lz * cos;
        arr.push([offset[0] + wx, offset[1] + wz]);
      }
      return arr;
    });
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color("#ffffff");
    for (let i = 0; i < TOTAL; i++) mesh.setColorAt(i, c);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;

    const weather = useSimStore.getState().config.weather;
    const target = (WEATHER[weather] ?? WEATHER.clear).rainLevel;
    rainSmooth.current +=
      (target - rainSmooth.current) * Math.min(1, delta * 1.6);
    const rain = rainSmooth.current;

    let inst = 0;
    for (let si = 0; si < STOPS.length; si++) {
      const [sx, sz] = STOPS[si].position;
      const queue = sim.queues[si];
      const visible = Math.min(queue.length, PER_STOP);
      const sSlots = shelterSlots[si];
      for (let k = 0; k < PER_STOP; k++) {
        if (k < visible) {
          const o = openSlots[k];
          const s = sSlots[k];
          const lx = o[0] + (s[0] - o[0]) * rain;
          const lz = o[1] + (s[1] - o[1]) * rain;
          const bob = Math.sin(t * 2 + inst * 1.7) * 0.05 * (1 - rain * 0.7);
          dummy.position.set(sx + lx, 0.7 + bob, sz + lz);
          dummy.rotation.y = Math.sin(inst) * 0.4;
          dummy.scale.setScalar(1);
          const p = queue[k];
          const wait = sim.simTime - p.arrivalTime;
          waitColor(wait, color);
          mesh.setColorAt(inst, color);
        } else {
          dummy.position.set(0, -50, 0);
          dummy.scale.setScalar(0.0001);
        }
        dummy.updateMatrix();
        mesh.setMatrixAt(inst, dummy.matrix);
        inst++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, TOTAL]}
      castShadow
      frustumCulled={false}
    >
      <capsuleGeometry args={[0.26, 0.62, 4, 10]} />
      <meshStandardMaterial roughness={0.65} metalness={0.02} />
    </instancedMesh>
  );
}
