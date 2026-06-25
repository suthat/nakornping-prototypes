"use client";

import { RoundedBox } from "@react-three/drei";
import { PARKINGS } from "@/miniapps/shuttle/lib/layout";

export function Parking() {
  return (
    <group>
      {PARKINGS.map((p, i) => {
        const [x, z] = p.position;
        const [w, d] = p.size;
        const rot = p.rotation ?? 0;
        const cellW = w / p.cols;
        const cellD = d / p.rows;
        const cars: React.ReactNode[] = [];
        let idx = 0;
        for (let r = 0; r < p.rows; r++) {
          for (let c = 0; c < p.cols; c++) {
            // เว้นช่องว่างบางคันให้ดูเป็นธรรมชาติ
            if ((r * 7 + c * 3) % 5 === 0) {
              idx++;
              continue;
            }
            const px = -w / 2 + cellW * (c + 0.5);
            const pz = -d / 2 + cellD * (r + 0.5);
            cars.push(
              <RoundedBox
                key={idx}
                args={[cellW * 0.6, 1.4, cellD * 0.78]}
                radius={0.3}
                smoothness={2}
                position={[px, 0.75, pz]}
                castShadow
              >
                <meshStandardMaterial color="#eceff4" roughness={0.6} />
              </RoundedBox>
            );
            idx++;
          }
        }
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* พื้นลานจอด */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.03, 0]}
              receiveShadow
            >
              <planeGeometry args={[w + 3, d + 3]} />
              <meshStandardMaterial color="#dbe1ea" roughness={0.95} />
            </mesh>
            {cars}
          </group>
        );
      })}
    </group>
  );
}
