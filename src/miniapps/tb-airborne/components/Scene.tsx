"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { SimDriver } from "./SimDriver";
import { Ground } from "./world/Ground";
import { Buildings } from "./world/Buildings";
import { ZoneMarkers, PathLines } from "./world/Zones";
import { TbClinicZones } from "./world/TbClinicZones";
import { OpdZoneOverlay } from "./world/OpdZoneOverlay";
import { People } from "./world/People";
import { RiskAuras } from "./world/RiskAuras";
import { AirParticles, WeatherSky } from "./world/Effects";
import { ActiveFootprints, ActiveTransit, ActivityMarkers } from "./world/ActiveTransit";
import { RestroomMarkers } from "./world/RestroomMarkers";

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
      camera={{ position: [95, 110, 130], fov: 36, near: 1, far: 1200 }}
    >
      <color attach="background" args={["#eef1f5"]} />
      <fog attach="fog" args={["#eef1f5", 220, 440]} />

      <PerspectiveCamera makeDefault position={[95, 110, 130]} fov={36} near={1} far={1200} />

      <WeatherSky />

      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.35} />
        <Ground />
        <PathLines />
        <ZoneMarkers />
        <Buildings />
        <TbClinicZones />
        <OpdZoneOverlay />
        <RiskAuras />
        <ActiveTransit />
        <ActiveFootprints />
        <RestroomMarkers />
        <ActivityMarkers />
        <AirParticles />
        <People />
      </Suspense>

      <SimDriver />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={55}
        maxDistance={300}
        maxPolarAngle={Math.PI / 2.35}
        target={[-15, 0, 5]}
        enablePan
      />
    </Canvas>
  );
}
