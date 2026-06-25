import * as THREE from "three";

/**
 * โลกจำลองของ รพ.นครพิงค์ — มุมมอง bird's eye view
 * ระบบพิกัด: x = ตะวันออก-ตะวันตก, z = เหนือ-ใต้, y = ขึ้นบน (เมตร)
 */

export interface StopDef {
  id: number;
  name: string;
  /** ชื่อย่อแสดงบนหมุด */
  code: string;
  position: [number, number]; // [x, z]
  /** น้ำหนักความต้องการ — จุดที่คนเข้า/ออกเยอะ (รพ. = สูง) */
  demandWeight: number;
  kind: "hospital" | "parking" | "waypoint";
}

export interface BuildingDef {
  position: [number, number]; // center [x, z]
  size: [number, number]; // [width(x), depth(z)]
  height: number;
  /** ความโค้งขอบ */
  radius?: number;
  label?: string;
}

export interface ParkingDef {
  position: [number, number];
  size: [number, number];
  rows: number;
  cols: number;
  rotation?: number;
}

/** ป้ายจอด (เรียงตามลำดับเส้นทางวนลูป — ต้องเรียงตามทิศการวิ่ง) */
export const STOPS: StopDef[] = [
  {
    id: 0,
    name: "อาคารผู้ป่วยนอก (OPD)",
    code: "รพ.",
    position: [0, 46],
    demandWeight: 3.4,
    kind: "hospital",
  },
  {
    id: 1,
    name: "อาคารผู้ป่วยใน (IPD)",
    code: "IPD",
    position: [-34, 38],
    demandWeight: 0.8,
    kind: "waypoint",
  },
  {
    id: 2,
    name: "ลานจอด P1 — ฝั่งตะวันตก",
    code: "P1",
    position: [-64, 8],
    demandWeight: 1.6,
    kind: "parking",
  },
  {
    id: 3,
    name: "ศูนย์ไตเทียม",
    code: "HD",
    position: [-58, -28],
    demandWeight: 0.6,
    kind: "waypoint",
  },
  {
    id: 4,
    name: "จุดพักโซนเหนือ",
    code: "N",
    position: [-30, -52],
    demandWeight: 0.7,
    kind: "waypoint",
  },
  {
    id: 5,
    name: "จุดจอดย่อย โรงอาหาร",
    code: "ย1",
    position: [10, -62],
    demandWeight: 0.6,
    kind: "waypoint",
  },
  {
    id: 6,
    name: "ลานจอด P2 — โซนเหนือ",
    code: "P2",
    position: [42, -54],
    demandWeight: 1.5,
    kind: "parking",
  },
  {
    id: 7,
    name: "จุดจอดย่อย คลังพัสดุ",
    code: "ย2",
    position: [70, -34],
    demandWeight: 0.5,
    kind: "waypoint",
  },
  {
    id: 8,
    name: "ลานจอด P3 — ฝั่งตะวันออก",
    code: "P3",
    position: [74, 6],
    demandWeight: 1.4,
    kind: "parking",
  },
  {
    id: 9,
    name: "คลินิกนอกเวลา",
    code: "ARI",
    position: [54, 36],
    demandWeight: 0.7,
    kind: "waypoint",
  },
];

/**
 * เส้นทางวนลูป (closed loop) ผ่านป้ายทุกจุด พร้อม waypoint แทรกให้โค้งสวย
 * ใช้ Catmull-Rom เพื่อให้รถวิ่ง smooth
 */
const ROUTE_POINTS: [number, number][] = [
  [0, 46], // S0 รพ.
  [-34, 38],
  [-64, 8], // S1 P1
  [-58, -28],
  [-30, -52], // S2 เหนือ
  [10, -62],
  [42, -54], // S3 P2
  [70, -34],
  [74, 6], // S4 P3
  [54, 36],
  [0, 46], // กลับ S0
];

export const ROUTE_CURVE = new THREE.CatmullRomCurve3(
  ROUTE_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  true,
  "catmullrom",
  0.5
);

export const ROUTE_LENGTH = ROUTE_CURVE.getLength();

/**
 * หาตำแหน่ง t (0..1) บนเส้นโค้งที่ใกล้ป้ายแต่ละจุดที่สุด
 * คืนค่าเป็นระยะทาง (เมตร) จากจุดเริ่มต้นลูป
 */
function distanceAtPoint(target: THREE.Vector3, samples = 1500): number {
  let bestT = 0;
  let bestDist = Infinity;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = ROUTE_CURVE.getPointAt(t);
    const d = p.distanceToSquared(target);
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  return bestT * ROUTE_LENGTH;
}

/** ระยะทางสะสม (เมตร) ของแต่ละป้ายบนลูป เรียงตามทิศการวิ่ง */
export const STOP_DISTANCES: number[] = STOPS.map((s) =>
  distanceAtPoint(new THREE.Vector3(s.position[0], 0, s.position[1]))
);

/** กลุ่มอาคาร รพ. ตรงกลาง (minimal box) */
export const BUILDINGS: BuildingDef[] = [
  { position: [0, 8], size: [34, 22], height: 26, radius: 1.4, label: "อาคารหลัก" },
  { position: [-22, 2], size: [16, 18], height: 17, radius: 1.2 },
  { position: [20, 0], size: [18, 16], height: 20, radius: 1.2 },
  { position: [2, -20], size: [22, 14], height: 13, radius: 1 },
  { position: [-16, 24], size: [12, 10], height: 9, radius: 0.8 },
  { position: [24, 22], size: [12, 12], height: 11, radius: 0.8 },
  { position: [-40, 30], size: [10, 10], height: 7, radius: 0.8 },
];

export const PARKINGS: ParkingDef[] = [
  { position: [-78, 10], size: [26, 34], rows: 4, cols: 3, rotation: 0.18 },
  { position: [50, -68], size: [34, 22], rows: 3, cols: 5, rotation: -0.1 },
  { position: [90, 8], size: [24, 32], rows: 4, cols: 3, rotation: -0.05 },
];

export const WORLD_SIZE = 240;

export interface StopShelter {
  /** จุดที่คนไปกระจุกตอนฝนตก (local offset จากป้าย) */
  offset: [number, number];
  /** ทิศหันของหลังคา (เรเดียน) */
  rotation: number;
  /** หลบเข้าแนบตึก (กระจุกแน่น ไกลขึ้น) */
  indoor: boolean;
}

function nearestBuilding(sx: number, sz: number): BuildingDef {
  let best = BUILDINGS[0];
  let bestD = Infinity;
  for (const b of BUILDINGS) {
    const dx = b.position[0] - sx;
    const dz = b.position[1] - sz;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

/** จุดหลบฝนของแต่ละป้าย — รพ.ให้คนเข้าแนบตัวอาคาร, ที่อื่นมีหลังคาที่ป้าย */
export const STOP_SHELTERS: StopShelter[] = STOPS.map((s) => {
  const [sx, sz] = s.position;
  const b = nearestBuilding(sx, sz);
  const dx = b.position[0] - sx;
  const dz = b.position[1] - sz;
  const dist = Math.hypot(dx, dz) || 1;
  const dirX = dx / dist;
  const dirZ = dz / dist;
  const rotation = Math.atan2(dirX, dirZ);
  if (s.kind === "hospital") {
    // ขยับฝูงชนไปแนบหน้าอาคารที่ใกล้ที่สุด
    const edge = Math.max(b.size[0], b.size[1]) / 2 + 4;
    const reach = Math.max(8, dist - edge);
    return { offset: [dirX * reach, dirZ * reach], rotation, indoor: true };
  }
  // ป้ายทั่วไป: หลังคาที่ตัวป้าย เยื้องเล็กน้อยเข้าหาอาคาร
  return { offset: [dirX * 2.2, dirZ * 2.2], rotation, indoor: false };
});
