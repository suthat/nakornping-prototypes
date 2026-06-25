"use client";

import { Line, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { RECEPTION_ID, TB_CLINIC_ID, ZONES } from "@/miniapps/tb-airborne/lib/layout";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";

/** แสดงความหนาแน่น OPD + คิว IDEN + เส้นทาง OPD→TB */
export function OpdZoneOverlay() {
  const opdScreening = useSimStore((s) => s.config.opdScreening);
  const stats = useSimStore((s) => s.stats);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);

  const opd = ZONES[RECEPTION_ID];
  const tb = ZONES[TB_CLINIC_ID];
  const [ox, oz] = opd.position;
  const roofY = opd.height + 0.85;

  useFrame((state) => {
    if (!opdScreening) return;
    const t = state.clock.elapsedTime;
    const atOpd = stats?.atOpd ?? 0;
    const waiting = stats?.waitingAtOpd ?? 0;
    const toTb = stats?.opdToTbTransit ?? 0;

    const glow = glowRef.current;
    if (glow) {
      const pulse = 0.35 + Math.min(atOpd / 90, 1) * 0.45;
      const flicker = pulse + Math.sin(t * 2.8) * 0.12;
      (glow.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker;
      (glow.material as THREE.MeshStandardMaterial).opacity =
        0.28 + Math.min(atOpd / 72, 1) * 0.42;
      glow.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04);
    }

    const ring = ringRef.current;
    if (ring) {
      ring.visible = waiting > 0;
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 4 + waiting) * 0.2;
      ring.scale.setScalar(1 + Math.sin(t * 3.5) * 0.08);
    }

    const lineMat = lineMatRef.current;
    if (lineMat && toTb > 0) {
      lineMat.opacity = 0.4 + Math.sin(t * 5) * 0.25;
    }
  });

  if (!opdScreening) return null;

  const atOpd = stats?.atOpd ?? 0;
  const waiting = stats?.waitingAtOpd ?? 0;
  const idenDone = stats?.idenReadyAtOpd ?? 0;
  const toTb = stats?.opdToTbTransit ?? 0;

  const tbRoute: [number, number, number][] = [
    [ox, 14, oz],
    [(ox + tb.position[0]) / 2, 22, (oz + tb.position[1]) / 2],
    [tb.position[0], 12, tb.position[1]],
  ];

  return (
    <group>
      <mesh ref={glowRef} position={[ox, roofY, oz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[opd.size[0] + 2, opd.size[1] + 2]} />
        <meshStandardMaterial
          color="#2f6df0"
          emissive="#2f6df0"
          emissiveIntensity={0.5}
          transparent
          opacity={0.45}
          roughness={0.8}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={ringRef} position={[ox, roofY + 0.15, oz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[opd.size[0] * 0.32, opd.size[0] * 0.38, 48]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.45}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[ox, roofY + 2.2, oz]}
        fontSize={1.55}
        color="#2f6df0"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#ffffff"
      >
        OPD · {atOpd} คน
      </Text>
      <Text
        position={[ox, roofY + 0.6, oz]}
        fontSize={1.05}
        color={waiting > 0 ? "#f59e0b" : "#5b6675"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#ffffff"
      >
        รอ IDEN {waiting}
        {idenDone > 0 ? ` · ส่ง TB ${idenDone + toTb}` : toTb > 0 ? ` · ไป TB ${toTb}` : ""}
      </Text>

      <Line
        points={tbRoute}
        color="#22a06b"
        transparent
        opacity={0.55}
        lineWidth={2}
        visible={toTb > 0}
      >
        <lineBasicMaterial
          ref={lineMatRef}
          color="#22a06b"
          transparent
          opacity={0.55}
          depthWrite={false}
          toneMapped={false}
        />
      </Line>
    </group>
  );
}
