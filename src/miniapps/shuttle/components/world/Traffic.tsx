"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ROUTE_CURVE, ROUTE_LENGTH, STOP_DISTANCES } from "@/miniapps/shuttle/lib/layout";
import { useSimStore } from "@/miniapps/shuttle/lib/store";

const ZONE_HALF = 48;
const CAR_COUNT = 6;

function tAt(distance: number) {
  return (((distance % ROUTE_LENGTH) + ROUTE_LENGTH) % ROUTE_LENGTH) / ROUTE_LENGTH;
}

function buildZoneRibbon(width: number, y: number) {
  const center = STOP_DISTANCES[0];
  const segs = 80;
  const half = width / 2;
  const up = new THREE.Vector3(0, 1, 0);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const d = center - ZONE_HALF + 2 * ZONE_HALF * (i / segs);
    const t = tAt(d);
    const p = ROUTE_CURVE.getPointAt(t);
    const tan = ROUTE_CURVE.getTangentAt(t).setY(0).normalize();
    const normal = new THREE.Vector3().crossVectors(tan, up).normalize();
    const l = p.clone().addScaledVector(normal, half);
    const r = p.clone().addScaledVector(normal, -half);
    positions.push(l.x, y, l.z, r.x, y, r.z);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function Traffic() {
  const ribbon = useMemo(() => buildZoneRibbon(7.2, 0.075), []);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const carsRef = useRef<THREE.Group>(null);
  const level = useRef(0);

  // ตำแหน่งรถค้างตามแนวถนนในโซน เยื้องเข้าเลนซ้าย
  const cars = useMemo(() => {
    const center = STOP_DISTANCES[0];
    const up = new THREE.Vector3(0, 1, 0);
    const arr: { pos: [number, number, number]; rot: number }[] = [];
    for (let i = 0; i < CAR_COUNT; i++) {
      const d = center - ZONE_HALF * 0.7 + (ZONE_HALF * 1.4 * i) / (CAR_COUNT - 1);
      const t = tAt(d);
      const p = ROUTE_CURVE.getPointAt(t);
      const tan = ROUTE_CURVE.getTangentAt(t).setY(0).normalize();
      const normal = new THREE.Vector3().crossVectors(tan, up).normalize();
      const side = p.clone().addScaledVector(normal, 1.9);
      arr.push({
        pos: [side.x, 0.7, side.z],
        rot: Math.atan2(tan.x, tan.z),
      });
    }
    return arr;
  }, []);

  const green = useMemo(() => new THREE.Color("#5fbf8f"), []);
  const amber = useMemo(() => new THREE.Color("#f0a341"), []);
  const red = useMemo(() => new THREE.Color("#ec5b54"), []);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const target = useSimStore.getState().stats?.trafficLevel ?? 0;
    level.current += (target - level.current) * Math.min(1, delta * 2);
    const lv = level.current;

    if (lv < 0.5) col.copy(green).lerp(amber, lv / 0.5);
    else col.copy(amber).lerp(red, (lv - 0.5) / 0.5);

    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3);
    if (matRef.current) {
      matRef.current.color.copy(col);
      matRef.current.opacity = THREE.MathUtils.clamp(lv * 0.55, 0, 0.55) * (0.7 + pulse * 0.3);
    }
    if (carsRef.current) {
      const vis = THREE.MathUtils.clamp((lv - 0.25) * 1.6, 0, 1);
      carsRef.current.visible = vis > 0.02;
      carsRef.current.scale.setScalar(vis < 0.05 ? 0.0001 : 1);
      carsRef.current.children.forEach((c) => {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m) {
          m.transparent = true;
          m.opacity = vis;
        }
      });
    }
  });

  return (
    <group>
      <mesh geometry={ribbon}>
        <meshBasicMaterial
          ref={matRef}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group ref={carsRef}>
        {cars.map((c, i) => (
          <RoundedBox
            key={i}
            args={[1.7, 1.2, 3.4]}
            radius={0.3}
            smoothness={2}
            position={c.pos}
            rotation={[0, c.rot, 0]}
            castShadow
          >
            <meshStandardMaterial color="#eceff4" roughness={0.6} transparent opacity={0} />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}
