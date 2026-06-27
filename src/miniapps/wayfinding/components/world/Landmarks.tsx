"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { LANDMARKS } from "@/miniapps/wayfinding/lib/layout";

function Fountain({ x, z }: { x: number; z: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ring.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.06;
      ring.current.scale.set(s, 1, s);
    }
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.2, 3.6, 0.6, 28]} />
        <meshStandardMaterial color="#cdd6e2" roughness={0.7} />
      </mesh>
      <mesh ref={ring} position={[0, 0.65, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.3, 28]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 2, 12]} />
        <meshStandardMaterial color="#9fb2cf" />
      </mesh>
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 2.2, 8]} />
        <meshStandardMaterial color="#9c7a55" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <sphereGeometry args={[1.8, 14, 12]} />
        <meshStandardMaterial color="#74b48a" roughness={0.85} />
      </mesh>
    </group>
  );
}

function SevenSign({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.2, 4.6]} castShadow>
        <boxGeometry args={[4, 1.2, 0.3]} />
        <meshStandardMaterial color="#1a8a4a" emissive="#1a8a4a" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.4, 3.2, 4.78]}>
        <boxGeometry args={[1.2, 0.8, 0.1]} />
        <meshStandardMaterial color="#e0732f" emissive="#e0732f" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

export function Landmarks() {
  return (
    <group>
      {LANDMARKS.map((l, i) => {
        const [x, z] = l.position;
        if (l.kind === "fountain") return <Fountain key={i} x={x} z={z} />;
        if (l.kind === "seven") return <SevenSign key={i} x={x} z={z} />;
        return <Tree key={i} x={x} z={z} />;
      })}
    </group>
  );
}
