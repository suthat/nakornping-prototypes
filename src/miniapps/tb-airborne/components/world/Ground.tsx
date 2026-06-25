"use client";

import { Grid } from "@react-three/drei";
import { WORLD_SIZE } from "@/miniapps/tb-airborne/lib/layout";

export function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} />
        <meshStandardMaterial color="#e9edf3" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#f4f6fa" roughness={0.9} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[WORLD_SIZE, WORLD_SIZE]}
        cellSize={6}
        cellThickness={0.6}
        cellColor="#d4dae3"
        sectionSize={30}
        sectionThickness={1}
        sectionColor="#bcc6d4"
        fadeDistance={240}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid={false}
      />
    </group>
  );
}
