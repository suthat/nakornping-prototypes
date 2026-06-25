"use client";

import { Line, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import {
  TB_CLINIC_ID,
  TB_SUBZONES,
  TbSubzoneKey,
  ZONES,
} from "@/miniapps/tb-airborne/lib/layout";
import { useSim } from "@/miniapps/tb-airborne/lib/SimProvider";
import { useSimStore } from "@/miniapps/tb-airborne/lib/store";

const SUBZONE_KEYS: TbSubzoneKey[] = ["active", "non_active", "family"];

const KIND_TO_SUBZONE: Record<string, TbSubzoneKey | null> = {
  active: "active",
  non_active: "non_active",
  family: "family",
  visitor: null,
};

const VISUAL = {
  active: { fill: 0.82, emissive: 0.38, rim: 0.95, pulse: true },
  non_active: { fill: 0.88, emissive: 0.42, rim: 1, pulse: true },
  family: { fill: 0.78, emissive: 0.32, rim: 0.9, pulse: false },
} as const;

function subzoneOutline(w: number, d: number, y: number): [number, number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [-hw, y, -hd],
    [hw, y, -hd],
    [hw, y, hd],
    [-hw, y, hd],
    [-hw, y, -hd],
  ];
}

function SubzoneFloor({
  zoneKey,
  pulse,
  roofY,
}: {
  zoneKey: TbSubzoneKey;
  pulse: React.RefObject<number>;
  roofY: number;
}) {
  const sub = TB_SUBZONES[zoneKey];
  const vis = VISUAL[zoneKey];
  const [w, d] = sub.size;
  const meshRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const accent = sub.accent;

  useFrame(() => {
    const t = pulse.current ?? 0;
    const mesh = meshRef.current;
    const rim = rimRef.current;
    if (!mesh || !rim) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const rmat = rim.material as THREE.MeshStandardMaterial;
    const flicker = vis.pulse ? 0.88 + Math.sin(t * (zoneKey === "non_active" ? 2.4 : 3.2)) * 0.12 : 1;
    mat.emissiveIntensity = vis.emissive * flicker;
    mat.opacity = vis.fill * flicker;
    rmat.emissiveIntensity = 0.55 * flicker;
  });

  const outline = subzoneOutline(w + 0.5, d + 0.5, 0.06);

  return (
    <group position={[sub.offset[0], roofY, sub.offset[1]]}>
      {/* พื้นโซน — สีทึบขึ้น */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={sub.color}
          emissive={sub.emissive}
          emissiveIntensity={vis.emissive}
          transparent
          opacity={vis.fill}
          roughness={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* ขอบยก — non-active ใช้ accent เข้ม */}
      <mesh ref={rimRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[w + 0.55, d + 0.55]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.55}
          transparent
          opacity={vis.rim}
          roughness={0.4}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={outline}
        color={accent}
        lineWidth={zoneKey === "non_active" ? 3.5 : 2.5}
        transparent
        opacity={0.95}
        depthWrite={false}
        toneMapped={false}
      />

      {/* เสาขอบมุม — สูงขึ้นให้มองเห็นจากมุมกล้อง */}
      {(
        [
          [-w / 2, -d / 2],
          [w / 2, -d / 2],
          [w / 2, d / 2],
          [-w / 2, d / 2],
        ] as [number, number][]
      ).map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.55, pz]}>
          <boxGeometry args={[0.55, 1.1, 0.55]} />
          <meshStandardMaterial
            color={accent}
            emissive={sub.emissive}
            emissiveIntensity={zoneKey === "non_active" ? 0.65 : 0.45}
            roughness={0.45}
          />
        </mesh>
      ))}

      {/* ป้ายยืน — โดยเฉพาะ non-active ให้เห็นชัด */}
      <group position={[0, 0.95, -d / 2 - 0.35]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[w * 0.72, 1.1, 0.12]} />
          <meshStandardMaterial
            color={accent}
            emissive={sub.emissive}
            emissiveIntensity={0.35}
            roughness={0.5}
          />
        </mesh>
        <Text
          position={[0, 0.55, 0.08]}
          fontSize={zoneKey === "non_active" ? 0.95 : 0.82}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor={accent}
        >
          {sub.labelTh}
        </Text>
      </group>
    </group>
  );
}

function ZoneLabel({
  zoneKey,
  count,
  labelY,
}: {
  zoneKey: TbSubzoneKey;
  count: number;
  labelY: number;
}) {
  const sub = TB_SUBZONES[zoneKey];
  const accent = sub.accent;
  const [bw, bh] = zoneKey === "non_active" ? [8.2, 2.4] : [7.4, 2.2];

  return (
    <group position={[sub.offset[0], labelY, sub.offset[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[bw, bh]} />
        <meshStandardMaterial
          color={sub.color}
          emissive={sub.emissive}
          emissiveIntensity={0.25}
          transparent
          opacity={0.92}
          roughness={0.7}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[bw + 0.35, bh + 0.35]} />
        <meshStandardMaterial color={accent} transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <Text
        fontSize={zoneKey === "non_active" ? 1.65 : 1.45}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor={accent}
        position={[0, 0.35, 0]}
      >
        {sub.labelTh}
      </Text>
      <Text
        position={[0, -0.55, 0]}
        fontSize={1.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#1c2530"
      >
        {count} คน
      </Text>
    </group>
  );
}

function PartitionWalls({ roofY }: { roofY: number }) {
  const wallH = 2.15;
  return (
    <group position={[0, roofY, 0]}>
      {/* กั้น active | non-active + family */}
      <mesh position={[-1.2, wallH / 2, -0.5]} castShadow>
        <boxGeometry args={[0.22, wallH, 17.5]} />
        <meshStandardMaterial
          color="#fecaca"
          emissive="#ec5b54"
          emissiveIntensity={0.22}
          transparent
          opacity={0.88}
          roughness={0.2}
          metalness={0.08}
        />
      </mesh>
      <Text
        position={[-1.2, wallH + 0.35, 0]}
        fontSize={0.85}
        color="#ec5b54"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#ffffff"
      >
        ACTIVE
      </Text>

      {/* กั้น non-active | family */}
      <mesh position={[5, wallH / 2 - 0.05, -1.35]} castShadow>
        <boxGeometry args={[10.5, wallH * 0.92, 0.22]} />
        <meshStandardMaterial
          color="#99f6e4"
          emissive="#14b8a6"
          emissiveIntensity={0.28}
          transparent
          opacity={0.9}
          roughness={0.2}
          metalness={0.06}
        />
      </mesh>
      <Text
        position={[5, wallH + 0.25, -1.35]}
        fontSize={0.8}
        color="#0f766e"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#ffffff"
      >
        NON-ACTIVE ↑ · ↓ FAMILY
      </Text>

      {/* ป้ายทาง active only */}
      <mesh position={[-7, 0.75, -8]} rotation={[0, 0.12, 0]}>
        <boxGeometry args={[5, 1.15, 0.14]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#ec5b54"
          emissiveIntensity={0.45}
        />
      </mesh>
      <Text
        position={[-7, 0.75, -7.78]}
        rotation={[0, 0.12, 0]}
        fontSize={0.82}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#991b1b"
      >
        ACTIVE ONLY
      </Text>
    </group>
  );
}

/** วงใต้เท้าคนในแต่ละ subzone — ช่วยมองเห็นตำแหน่ง non-active */
function SubzoneOccupantRings({
  roofY,
  counts,
  cx,
  cz,
}: {
  roofY: number;
  counts: Record<TbSubzoneKey, number>;
  cx: number;
  cz: number;
}) {
  const sim = useSim();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const MAX = 48;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const agents = sim
      .getAgentSnapshots()
      .filter((a) => a.zoneId === TB_CLINIC_ID && !a.inTransit);

    for (let i = 0; i < MAX; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const a = agents[i];
      if (!a) {
        mesh.visible = false;
        continue;
      }
      const key = KIND_TO_SUBZONE[a.kind];
      if (!key) {
        mesh.visible = false;
        continue;
      }
      const sub = TB_SUBZONES[key];
      const accent = sub.accent;
      mesh.visible = true;
      mesh.position.set(a.position[0] - cx, roofY + 0.12, a.position[1] - cz);
      const pulse = 1 + Math.sin(t * 4 + a.id) * 0.12;
      mesh.scale.setScalar(key === "non_active" ? pulse * 1.08 : pulse);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(accent);
      mat.opacity = key === "non_active" ? 0.55 : 0.38;
    }
  });

  const hasPeople = counts.active + counts.non_active + counts.family > 0;
  if (!hasPeople) return null;

  return (
    <group>
      {Array.from({ length: MAX }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.55, 0.95, 24]} />
          <meshBasicMaterial
            color="#14b8a6"
            transparent
            opacity={0.45}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function UnzonedOverlay({ roofY, labelY }: { roofY: number; labelY: number }) {
  const tb = ZONES[TB_CLINIC_ID];
  const [w, d] = tb.size;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, roofY, 0]}>
        <planeGeometry args={[w - 2, d - 2]} />
        <meshStandardMaterial
          color="#f0a341"
          emissive="#f0a341"
          emissiveIntensity={0.15}
          transparent
          opacity={0.45}
          roughness={0.85}
        />
      </mesh>
      <Text
        position={[0, labelY, 0]}
        fontSize={1.5}
        color="#f0a341"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#ffffff"
      >
        พื้นที่ร่วม — ไม่แบ่งพื้นที่
      </Text>
      <Text
        position={[0, labelY - 1.6, 0]}
        fontSize={0.95}
        color="#8893a3"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#ffffff"
      >
        active / non-active / ญาติ ปนกัน
      </Text>
    </group>
  );
}

export function TbClinicZones() {
  const zoning = useSimStore((s) => s.config.zoning);
  const sim = useSim();
  const pulse = useRef(0);
  const [counts, setCounts] = useState<Record<TbSubzoneKey, number>>({
    active: 0,
    non_active: 0,
    family: 0,
  });

  const tb = ZONES[TB_CLINIC_ID];
  const [cx, cz] = tb.position;
  const roofY = tb.height + 0.95;
  const labelY = tb.height + 3.15;

  useFrame((_, delta) => {
    pulse.current += delta;
    const next: Record<TbSubzoneKey, number> = {
      active: 0,
      non_active: 0,
      family: 0,
    };
    for (const a of sim.getAgentSnapshots()) {
      if (a.zoneId !== TB_CLINIC_ID || a.inTransit) continue;
      const key = KIND_TO_SUBZONE[a.kind];
      if (key) next[key]++;
    }
    setCounts((prev) =>
      prev.active === next.active &&
      prev.non_active === next.non_active &&
      prev.family === next.family
        ? prev
        : next
    );
  });

  return (
    <group position={[cx, 0, cz]}>
      {zoning === "zoned" ? (
        <>
          {SUBZONE_KEYS.map((key) => (
            <SubzoneFloor key={key} zoneKey={key} pulse={pulse} roofY={roofY} />
          ))}
          <PartitionWalls roofY={roofY} />
          {SUBZONE_KEYS.map((key) => (
            <ZoneLabel
              key={`lbl-${key}`}
              zoneKey={key}
              count={counts[key]}
              labelY={labelY}
            />
          ))}
          <SubzoneOccupantRings roofY={roofY} counts={counts} cx={cx} cz={cz} />
        </>
      ) : (
        <UnzonedOverlay roofY={roofY} labelY={labelY} />
      )}
    </group>
  );
}
