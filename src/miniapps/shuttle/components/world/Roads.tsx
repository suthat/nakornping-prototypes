"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { ROUTE_CURVE } from "@/miniapps/shuttle/lib/layout";

function buildRibbon(width: number, segments: number, y: number) {
  const half = width / 2;
  const positions: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = ROUTE_CURVE.getPointAt(t);
    const tan = ROUTE_CURVE.getTangentAt(t).setY(0).normalize();
    const normal = new THREE.Vector3().crossVectors(tan, up).normalize();
    const left = p.clone().addScaledVector(normal, half);
    const right = p.clone().addScaledVector(normal, -half);
    positions.push(left.x, y, left.z, right.x, y, right.z);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function Roads() {
  const segments = 400;
  const asphalt = useMemo(() => buildRibbon(7, segments, 0.04), []);
  const centerline = useMemo(() => buildRibbon(0.35, segments, 0.06), []);
  const border = useMemo(() => buildRibbon(7.8, segments, 0.03), []);

  return (
    <group>
      <mesh geometry={border} receiveShadow>
        <meshStandardMaterial color="#c2cbd8" roughness={0.95} />
      </mesh>
      <mesh geometry={asphalt} receiveShadow>
        <meshStandardMaterial color="#d8dee8" roughness={0.9} />
      </mesh>
      <mesh geometry={centerline}>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.5}
          emissive="#ffffff"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}
