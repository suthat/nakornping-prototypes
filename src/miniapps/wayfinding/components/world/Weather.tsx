"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimStore } from "@/miniapps/wayfinding/lib/store";
import { WEATHER } from "@/miniapps/wayfinding/lib/types";

const MAX_DROPS = 1100;
const AREA = 160;
const HEIGHT = 100;

function Rain({ rainRef }: { rainRef: React.RefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(
    () =>
      new Array(MAX_DROPS).fill(0).map(() => ({
        x: (Math.random() - 0.5) * AREA * 2,
        y: Math.random() * HEIGHT,
        z: (Math.random() - 0.5) * AREA * 2,
        v: 55 + Math.random() * 40,
        len: 1.6 + Math.random() * 1.8,
      })),
    []
  );
  const { camera } = useThree();

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rain = rainRef.current ?? 0;
    const active = Math.floor(rain * MAX_DROPS);
    const cx = camera.position.x * 0.4;
    const cz = camera.position.z * 0.4;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < MAX_DROPS; i++) {
      const d = drops[i];
      if (i < active) {
        d.y -= d.v * dt;
        d.x -= d.v * dt * 0.12;
        if (d.y < 0) {
          d.y = HEIGHT;
          d.x = cx + (Math.random() - 0.5) * AREA * 2;
          d.z = cz + (Math.random() - 0.5) * AREA * 2;
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(1, d.len, 1);
      } else {
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_DROPS]} frustumCulled={false}>
      <boxGeometry args={[0.05, 1, 0.05]} />
      <meshBasicMaterial color="#9fb2cf" transparent opacity={0.6} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}

export function WeatherSky() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const rainRef = useRef(0);
  const { scene } = useThree();

  const clearBg = useMemo(() => new THREE.Color("#eef1f5"), []);
  const stormBg = useMemo(() => new THREE.Color("#cdd4de"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const weather = useSimStore.getState().config.weather;
    const target = (WEATHER[weather] ?? WEATHER.clear).rainLevel;
    rainRef.current += (target - rainRef.current) * Math.min(1, delta * 1.6);
    const r = rainRef.current;
    if (sun.current) sun.current.intensity = THREE.MathUtils.lerp(1.7, 0.5, r);
    if (fill.current) fill.current.intensity = THREE.MathUtils.lerp(0.3, 0.6, r);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.85, 0.7, r);
    if (amb.current) amb.current.intensity = THREE.MathUtils.lerp(0.35, 0.55, r);
    tmp.copy(clearBg).lerp(stormBg, r);
    if (scene.background instanceof THREE.Color) scene.background.copy(tmp);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(tmp);
      scene.fog.near = THREE.MathUtils.lerp(260, 100, r);
      scene.fog.far = THREE.MathUtils.lerp(500, 340, r);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#dfe5ee", 0.85]} />
      <ambientLight ref={amb} intensity={0.35} />
      <directionalLight
        ref={sun}
        position={[90, 140, 70]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-blurSamples={16}
        shadow-bias={-0.0004}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
        shadow-camera-near={1}
        shadow-camera-far={440}
      />
      <directionalLight ref={fill} position={[-100, 70, -50]} intensity={0.3} color="#cdd6e6" />
      <Rain rainRef={rainRef} />
    </>
  );
}
