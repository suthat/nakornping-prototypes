"use client";

import { useMemo } from "react";
import { EDGES, NID, NODES } from "@/miniapps/wayfinding/lib/layout";

interface Seg {
  cx: number;
  cz: number;
  len: number;
  angle: number;
  width: number;
}

const SPINE = new Set([
  `${NID.GATE}-${NID.DROPOFF}`,
  `${NID.DROPOFF}-${NID.COURTYARD}`,
  `${NID.COURTYARD}-${NID.OPD_ENTRY}`,
]);

function key(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function Roads() {
  const segs = useMemo<Seg[]>(() => {
    const out: Seg[] = [];
    for (const e of EDGES) {
      if (!e.outdoor || e.vertical) continue;
      const a = NODES[e.a];
      const b = NODES[e.b];
      if (a.floor !== 0 || b.floor !== 0) continue;
      const dx = b.pos[0] - a.pos[0];
      const dz = b.pos[1] - a.pos[1];
      const len = Math.hypot(dx, dz);
      out.push({
        cx: (a.pos[0] + b.pos[0]) / 2,
        cz: (a.pos[1] + b.pos[1]) / 2,
        len: len + 4,
        angle: Math.atan2(dx, dz),
        width: SPINE.has(key(e.a, e.b)) ? 9 : 4.4,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {segs.map((s, i) => (
        <mesh
          key={i}
          position={[s.cx, 0.04, s.cz]}
          rotation={[-Math.PI / 2, 0, -s.angle]}
          receiveShadow
        >
          <planeGeometry args={[s.width, s.len]} />
          <meshStandardMaterial color="#d8dee8" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}
