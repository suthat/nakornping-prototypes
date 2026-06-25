"use client";

import { RoundedBox } from "@react-three/drei";
import { BUILDINGS } from "@/miniapps/shuttle/lib/layout";

export function Buildings() {
  return (
    <group>
      {BUILDINGS.map((b, i) => {
        const [x, z] = b.position;
        const [w, d] = b.size;
        const r = b.radius ?? 1;
        return (
          <group key={i} position={[x, 0, z]}>
            {/* ฐานอาคารโทนเทาอ่อน */}
            <mesh position={[0, 0.15, 0]} receiveShadow>
              <boxGeometry args={[w + 2.4, 0.3, d + 2.4]} />
              <meshStandardMaterial color="#dfe4ec" roughness={0.95} />
            </mesh>

            {/* ตัวอาคาร minimal สีขาว */}
            <RoundedBox
              args={[w, b.height, d]}
              radius={r}
              smoothness={4}
              position={[0, b.height / 2 + 0.3, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color="#fbfcfe"
                roughness={0.72}
                metalness={0.04}
              />
            </RoundedBox>

            {/* แถบหลังคาบางๆ ให้มีมิติ */}
            <RoundedBox
              args={[w * 0.82, 0.6, d * 0.82]}
              radius={0.3}
              smoothness={3}
              position={[0, b.height + 0.6, 0]}
              castShadow
            >
              <meshStandardMaterial color="#eef1f6" roughness={0.8} />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}
