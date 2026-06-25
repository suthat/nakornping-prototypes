"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { SimDriver } from "./SimDriver";
import { Ground } from "./world/Ground";
import { Buildings } from "./world/Buildings";
import { Roads } from "./world/Roads";
import { Parking } from "./world/Parking";
import { Stops } from "./world/Stops";
import { People } from "./world/People";
import { Buses } from "./world/Buses";
import { WeatherSky } from "./world/Weather";
import { Traffic } from "./world/Traffic";

export function Scene() {
  return (
    <Canvas
      shadows={{ type: THREE.VSMShadowMap }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [110, 120, 150], fov: 36, near: 1, far: 1200 }}
    >
      <color attach="background" args={["#eef1f5"]} />
      <fog attach="fog" args={["#eef1f5", 240, 460]} />

      <PerspectiveCamera makeDefault position={[110, 120, 150]} fov={36} near={1} far={1200} />

      {/* แสง + หมอก + ฝน ตามสภาพอากาศ */}
      <WeatherSky />

      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.35} />
        <Ground />
        <Roads />
        <Traffic />
        <Parking />
        <Buildings />
        <Stops />
        <People />
        <Buses />
      </Suspense>

      <SimDriver />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={60}
        maxDistance={320}
        maxPolarAngle={Math.PI / 2.35}
        target={[5, 0, -6]}
        enablePan
      />
    </Canvas>
  );
}
