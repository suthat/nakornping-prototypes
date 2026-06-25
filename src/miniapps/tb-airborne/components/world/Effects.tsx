"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ZONES, WALKWAY_ID } from "@/miniapps/tb-airborne/lib/layout";
import { useSim } from "@/miniapps/tb-airborne/lib/SimProvider";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";
import { WEATHER } from "@/miniapps/tb-airborne/lib/types";

const MAX_PARTICLES = 800;
const AREA = 140;
const MAX_DROPS = 1100;
const RAIN_HEIGHT = 95;

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  zone: number;
}

/** อนุภาค quanta ลอยในอากาศ — แสดงการแพร่กระจาย */
export function AirParticles() {
  const sim = useSim();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo<Particle[]>(() => {
    return new Array(MAX_PARTICLES).fill(0).map(() => ({
      x: 0,
      y: -100,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      zone: 0,
    }));
  }, []);
  const spawnIdx = useRef(0);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const zones = sim.getZoneSnapshots();
    const quanta = sim.getZoneQuanta();

    // spawn จากโซนที่มี quanta สูง
    for (let zi = 0; zi < ZONES.length; zi++) {
      const q = quanta[zi];
      const norm = zones[zi]?.quantaConc ?? 0;
      if (norm < 0.08) continue;
      const spawnCount = Math.floor(norm * 3 * dt * 60);
      for (let s = 0; s < spawnCount; s++) {
        const p = particles[spawnIdx.current % MAX_PARTICLES];
        spawnIdx.current++;
        const [cx, cz] = ZONES[zi].position;
        const spread = Math.max(ZONES[zi].size[0], ZONES[zi].size[1]) * 0.35;
        p.x = cx + (Math.random() - 0.5) * spread;
        p.y = ZONES[zi].height + 1 + Math.random() * 4;
        p.z = cz + (Math.random() - 0.5) * spread;
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = 0.3 + Math.random() * 0.8;
        p.vz = (Math.random() - 0.5) * 2;
        p.life = 1.5 + Math.random() * 2;
        p.zone = zi;
      }
    }

    const cx = camera.position.x * 0.3;
    const cz = camera.position.z * 0.3;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        // drift ไปทาง walkway เมื่อ outdoor
        if (ZONES[p.zone].kind !== "walkway") {
          const w = ZONES[WALKWAY_ID].position;
          p.x += (w[0] - p.x) * 0.002;
          p.z += (w[1] - p.z) * 0.002;
        }
        const alpha = Math.min(1, p.life);
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(0.35 + alpha * 0.5);
        dummy.updateMatrix();
      } else {
        dummy.position.set(cx, -200, cz);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
      }
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
      <sphereGeometry args={[0.35, 6, 6]} />
      <meshBasicMaterial
        color="#9333ea"
        transparent
        opacity={0.45}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/** เม็ดฝนตก — ติดตามกล้องเพื่อครอบคลุมพื้นที่จำลอง */
function Rain({ rainRef }: { rainRef: React.RefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(() => {
    return new Array(MAX_DROPS).fill(0).map(() => ({
      x: (Math.random() - 0.5) * AREA * 2,
      y: Math.random() * RAIN_HEIGHT,
      z: (Math.random() - 0.5) * AREA * 2,
      v: 55 + Math.random() * 40,
      len: 1.6 + Math.random() * 1.8,
    }));
  }, []);
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
          d.y = RAIN_HEIGHT;
          d.x = cx + (Math.random() - 0.5) * AREA * 2;
          d.z = cz + (Math.random() - 0.5) * AREA * 2;
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(1, d.len, 1);
        dummy.updateMatrix();
      } else {
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
      }
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_DROPS]} frustumCulled={false}>
      <boxGeometry args={[0.05, 1, 0.05]} />
      <meshBasicMaterial
        color="#9fb2cf"
        transparent
        opacity={0.6}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/** ฝนตามสภาพอากาศ */
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

    if (sun.current) sun.current.intensity = THREE.MathUtils.lerp(1.65, 0.5, r);
    if (fill.current) fill.current.intensity = THREE.MathUtils.lerp(0.3, 0.6, r);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.85, 0.7, r);
    if (amb.current) amb.current.intensity = THREE.MathUtils.lerp(0.35, 0.55, r);

    tmp.copy(clearBg).lerp(stormBg, r);
    if (scene.background instanceof THREE.Color) scene.background.copy(tmp);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(tmp);
      scene.fog.near = THREE.MathUtils.lerp(240, 90, r);
      scene.fog.far = THREE.MathUtils.lerp(460, 330, r);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#dfe5ee", 0.85]} />
      <ambientLight ref={amb} intensity={0.35} />
      <directionalLight
        ref={sun}
        position={[80, 130, 60]}
        intensity={1.65}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-blurSamples={16}
        shadow-bias={-0.0004}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-camera-near={1}
        shadow-camera-far={400}
      />
      <directionalLight ref={fill} position={[-90, 60, -40]} intensity={0.3} color="#cdd6e6" />
      <Rain rainRef={rainRef} />
    </>
  );
}
