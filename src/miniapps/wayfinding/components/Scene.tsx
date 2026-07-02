"use client";

import "@/lib/threeClockCompat";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import {
  SCENE_LOADING_LABELS,
  SceneLoadingOverlay,
} from "@/components/scene/SceneLoadingOverlay";
import { SceneReadyMarker } from "@/components/scene/SceneReadyMarker";
import { useSceneReady } from "@/components/scene/useSceneReady";
import { SimDriver } from "./SimDriver";
import { Ground } from "./world/Ground";
import { Roads } from "./world/Roads";
import { Buildings } from "./world/Buildings";
import { Parking } from "./world/Parking";
import { Landmarks } from "./world/Landmarks";
import { Nodes } from "./world/Nodes";
import { People } from "./world/People";
import { NavAids } from "./world/NavAids";
import { ConfusionOverlay } from "./world/ConfusionOverlay";
import { WeatherSky } from "./world/Weather";

export function Scene() {
  const { ready, onGlCreated, onSceneReady } = useSceneReady();

  return (
    <div className="relative h-full w-full">
      <SceneLoadingOverlay
        label={SCENE_LOADING_LABELS.simulation}
        visible={!ready}
      />

      <Canvas
        shadows={{ type: THREE.VSMShadowMap }}
        dpr={[1, 2]}
        className="h-full w-full"
        onCreated={onGlCreated}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{ position: [120, 130, 165], fov: 36, near: 1, far: 1300 }}
      >
        <color attach="background" args={["#eef1f5"]} />
        <fog attach="fog" args={["#eef1f5", 260, 500]} />

        <PerspectiveCamera makeDefault position={[120, 130, 165]} fov={36} near={1} far={1300} />

        <WeatherSky />

        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.35} />
          <Ground />
          <Roads />
          <Parking />
          <Buildings />
          <Landmarks />
          <Nodes />
          <NavAids />
          <ConfusionOverlay />
          <People />
          <SceneReadyMarker onReady={onSceneReady} />
        </Suspense>

        <SimDriver />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={70}
          maxDistance={360}
          maxPolarAngle={Math.PI / 2.3}
          target={[2, 6, 6]}
          enablePan
        />
      </Canvas>
    </div>
  );
}
