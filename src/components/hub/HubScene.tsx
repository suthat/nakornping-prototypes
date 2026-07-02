"use client";

import "@/lib/threeClockCompat";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import {
  MINI_APPS,
  hubPlatformSize,
  layoutMiniApps,
} from "@/lib/miniapps";
import {
  SCENE_LOADING_LABELS,
  SceneLoadingOverlay,
} from "@/components/scene/SceneLoadingOverlay";
import { SceneReadyMarker } from "@/components/scene/SceneReadyMarker";
import { useSceneReady } from "@/components/scene/useSceneReady";
import { MiniAppTile } from "./MiniAppTile";

/** มุมมองเริ่มต้น — ถอยห่างพอให้แผ่นทั้ง 3 มี margin รอบ viewport */
const HUB_CAMERA = {
  position: [0, 4.4, 15.2] as const,
  fov: 34,
  target: [0, 1.05, 0] as const,
  minDistance: 12.5,
  maxDistance: 19,
};

function HubPlatform({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      <RoundedBox
        args={[width, 0.32, depth]}
        radius={0.18}
        smoothness={4}
        position={[0, -0.16, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#e4eaf2" metalness={0.06} roughness={0.78} />
      </RoundedBox>

      <Grid
        args={[width - 1, depth - 1]}
        cellSize={0.55}
        cellThickness={0.45}
        cellColor="#c5ceda"
        sectionSize={2.2}
        sectionThickness={0.9}
        sectionColor="#b0bccf"
        fadeDistance={14}
        fadeStrength={1.2}
        infiniteGrid={false}
        position={[0, 0.01, 0]}
      />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.35}
        scale={width + 2}
        blur={2.2}
        far={6}
        color="#1c2530"
      />
    </group>
  );
}

function HubLights() {
  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 6, -4]} intensity={0.35} color="#dbeafe" />
    </>
  );
}

function HubContent() {
  const tiles = useMemo(() => layoutMiniApps(MINI_APPS), []);
  const platform = useMemo(
    () => hubPlatformSize(MINI_APPS.length),
    []
  );

  return (
    <>
      <HubLights />
      <HubPlatform width={platform.width} depth={platform.depth} />

      {tiles.map(({ app, position }) => (
        <MiniAppTile key={app.id} app={app} position={position} />
      ))}
    </>
  );
}

export function HubScene() {
  const { ready, onGlCreated, onSceneReady } = useSceneReady();

  return (
    <div className="relative h-full w-full">
      <SceneLoadingOverlay
        label={SCENE_LOADING_LABELS.hub}
        visible={!ready}
      />

      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        className="h-full w-full"
        onCreated={onGlCreated}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{
          position: [...HUB_CAMERA.position],
          fov: HUB_CAMERA.fov,
          near: 0.1,
          far: 100,
        }}
      >
        <color attach="background" args={["#eef1f5"]} />
        <fog attach="fog" args={["#eef1f5", 20, 38]} />

        <PerspectiveCamera
          makeDefault
          position={[...HUB_CAMERA.position]}
          fov={HUB_CAMERA.fov}
        />

        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.35} />
          <HubContent />
          <SceneReadyMarker onReady={onSceneReady} />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.07}
          minDistance={HUB_CAMERA.minDistance}
          maxDistance={HUB_CAMERA.maxDistance}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.35}
          target={[...HUB_CAMERA.target]}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
