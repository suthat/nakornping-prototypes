/**
 * โลกจำลอง รพ.นครพิงค์ — เน้นคลินิก TB แยกจากอาคารหลัก
 * พิกัด: x = ตะวันออก-ตะวันตก, z = เหนือ-ใต้, y = ขึ้น (เมตร)
 */

export type ZoneKind =
  | "tb_clinic"
  | "reception"
  | "pharmacy"
  | "cashier"
  | "cafeteria"
  | "restroom"
  | "walkway"
  | "hospital";

export interface ZoneDef {
  id: number;
  name: string;
  code: string;
  position: [number, number];
  size: [number, number];
  height: number;
  radius?: number;
  /** การระบายอากาศ (ACH สัมพัทธ์) — ยิ่งสูง quanta ลดเร็ว */
  ventilation: number;
  /** ปริมาตรอากาศสัมพัทธ์ (ใช้คำนวณความเข้ม) */
  volume: number;
  kind: ZoneKind;
  color: string;
  /** ตัวคูณ exposure dose (ห้องน้ำ = จุดเสี่ยง aerosol สูง) */
  riskMultiplier?: number;
  /** ตัวคูณ crowding / คง quanta ในพื้นที่แคบ */
  crowdingMult?: number;
}

export interface BuildingDef {
  position: [number, number];
  size: [number, number];
  height: number;
  radius?: number;
  label?: string;
  accent?: string;
}

export interface PathEdge {
  from: number;
  to: number;
  /** ระยะทางเดิน (เมตร) */
  distance: number;
  /** เป็นเส้นทางกลางแจ้ง */
  outdoor: boolean;
}

/** โซนหลักในการจำลอง */
export const ZONES: ZoneDef[] = [
  {
    id: 0,
    name: "คลินิกวัณโรค (TB)",
    code: "TB",
    position: [-62, -18],
    size: [28, 22],
    height: 10,
    radius: 1.2,
    ventilation: 14,
    volume: 1.0,
    kind: "tb_clinic",
    color: "#059669",
  },
  {
    id: 1,
    name: "ตึกรับผู้ป่วย / OPD",
    code: "OPD",
    position: [0, 42],
    size: [34, 24],
    height: 26,
    radius: 1.4,
    ventilation: 8,
    volume: 2.2,
    kind: "reception",
    color: "#2f6df0",
  },
  {
    id: 2,
    name: "ห้องยา",
    code: "RX",
    position: [38, 18],
    size: [18, 16],
    height: 14,
    radius: 1,
    ventilation: 10,
    volume: 1.1,
    kind: "pharmacy",
    color: "#7c3aed",
  },
  {
    id: 3,
    name: "จุดชำระเงิน",
    code: "CASH",
    position: [22, 32],
    size: [14, 12],
    height: 12,
    radius: 0.8,
    ventilation: 9,
    volume: 0.8,
    kind: "cashier",
    color: "#f0a341",
  },
  {
    id: 4,
    name: "โรงอาหาร",
    code: "FOOD",
    position: [8, -58],
    size: [24, 18],
    height: 11,
    radius: 1,
    ventilation: 7,
    volume: 1.4,
    kind: "cafeteria",
    color: "#ec5b54",
    /** พื้นที่กินอาหาร — คนแน่น คุย/กิน → aerosol สูงขึ้น */
    riskMultiplier: 1.55,
    crowdingMult: 2.05,
  },
  {
    id: 5,
    name: "ห้องน้ำ OPD",
    code: "WC-OPD",
    position: [-14, 34],
    size: [8, 8],
    height: 8,
    radius: 0.6,
    ventilation: 5.5,
    volume: 0.32,
    kind: "restroom",
    color: "#38bdf8",
    riskMultiplier: 2.15,
    crowdingMult: 2.5,
  },
  {
    id: 6,
    name: "ทางเดินเชื่อม / ลาน",
    code: "PATH",
    position: [-10, 8],
    size: [90, 70],
    height: 0.4,
    radius: 0,
    ventilation: 35,
    volume: 4.5,
    kind: "walkway",
    color: "#8893a3",
  },
  {
    id: 7,
    name: "อาคารผู้ป่วยใน / IPD",
    code: "IPD",
    position: [-28, 28],
    size: [16, 18],
    height: 17,
    radius: 1.2,
    ventilation: 6,
    volume: 1.6,
    kind: "hospital",
    color: "#5b6675",
  },
  {
    id: 8,
    name: "ห้องน้ำ คลินิก TB",
    code: "WC-TB",
    position: [-62, -4],
    size: [7, 7],
    height: 7,
    radius: 0.5,
    ventilation: 5,
    volume: 0.28,
    kind: "restroom",
    color: "#38bdf8",
    riskMultiplier: 2.35,
    crowdingMult: 2.7,
  },
  {
    id: 9,
    name: "ห้องน้ำ ห้องยา",
    code: "WC-RX",
    position: [42, 18],
    size: [7, 7],
    height: 7,
    radius: 0.5,
    ventilation: 5.5,
    volume: 0.3,
    kind: "restroom",
    color: "#38bdf8",
    riskMultiplier: 2.1,
    crowdingMult: 2.4,
  },
  {
    id: 10,
    name: "ห้องน้ำ การเงิน",
    code: "WC-CASH",
    position: [28, 32],
    size: [7, 7],
    height: 7,
    radius: 0.5,
    ventilation: 5.5,
    volume: 0.3,
    kind: "restroom",
    color: "#38bdf8",
    riskMultiplier: 2.1,
    crowdingMult: 2.4,
  },
  {
    id: 11,
    name: "ห้องน้ำ โรงอาหาร",
    code: "WC-FOOD",
    position: [8, -48],
    size: [8, 7],
    height: 7,
    radius: 0.5,
    ventilation: 5,
    volume: 0.32,
    kind: "restroom",
    color: "#38bdf8",
    riskMultiplier: 2.25,
    crowdingMult: 2.6,
  },
  {
    id: 12,
    name: "ห้องน้ำ IPD",
    code: "WC-IPD",
    position: [-28, 38],
    size: [7, 7],
    height: 7,
    radius: 0.5,
    ventilation: 5,
    volume: 0.28,
    kind: "restroom",
    color: "#38bdf8",
    riskMultiplier: 2.2,
    crowdingMult: 2.5,
  },
];

/** เส้นทางเชื่อมโซน (กราฟ) */
export const PATHS: PathEdge[] = [
  { from: 0, to: 6, distance: 55, outdoor: true },
  { from: 6, to: 1, distance: 38, outdoor: true },
  { from: 6, to: 2, distance: 52, outdoor: true },
  { from: 6, to: 3, distance: 42, outdoor: true },
  { from: 6, to: 4, distance: 68, outdoor: true },
  { from: 1, to: 5, distance: 14, outdoor: false },
  { from: 6, to: 5, distance: 38, outdoor: true },
  { from: 5, to: 3, distance: 32, outdoor: false },
  { from: 1, to: 3, distance: 28, outdoor: false },
  { from: 1, to: 2, distance: 45, outdoor: false },
  { from: 3, to: 2, distance: 22, outdoor: false },
  { from: 6, to: 7, distance: 35, outdoor: true },
  { from: 0, to: 1, distance: 72, outdoor: true },
  { from: 0, to: 2, distance: 105, outdoor: true },
  // ห้องน้ำต่ออาคารเจ้าของ (ในอาคาร)
  { from: 0, to: 8, distance: 12, outdoor: false },
  { from: 2, to: 9, distance: 10, outdoor: false },
  { from: 3, to: 10, distance: 10, outdoor: false },
  { from: 4, to: 11, distance: 12, outdoor: false },
  { from: 7, to: 12, distance: 11, outdoor: false },
  // ห้องน้ำ ↔ ทางเดิน (เชื่อมข้ามตึก)
  { from: 6, to: 8, distance: 48, outdoor: true },
  { from: 6, to: 9, distance: 44, outdoor: true },
  { from: 6, to: 10, distance: 36, outdoor: true },
  { from: 6, to: 11, distance: 58, outdoor: true },
  { from: 6, to: 12, distance: 32, outdoor: true },
];

/** อาคารประกอบฉาก (รวมโซนหลัก) */
export const BUILDINGS: BuildingDef[] = [
  {
    position: [-62, -18],
    size: [28, 22],
    height: 10,
    radius: 1.2,
    label: "คลินิก TB",
    accent: "#059669",
  },
  { position: [0, 42], size: [34, 24], height: 26, radius: 1.4, label: "OPD" },
  { position: [-14, 34], size: [8, 8], height: 8, radius: 0.6, label: "WC", accent: "#38bdf8" },
  { position: [-62, -4], size: [7, 7], height: 7, radius: 0.5, label: "WC", accent: "#38bdf8" },
  { position: [42, 18], size: [7, 7], height: 7, radius: 0.5, label: "WC", accent: "#38bdf8" },
  { position: [28, 32], size: [7, 7], height: 7, radius: 0.5, label: "WC", accent: "#38bdf8" },
  { position: [8, -48], size: [8, 7], height: 7, radius: 0.5, label: "WC", accent: "#38bdf8" },
  { position: [-28, 38], size: [7, 7], height: 7, radius: 0.5, label: "WC", accent: "#38bdf8" },
  { position: [38, 18], size: [18, 16], height: 14, radius: 1, label: "ห้องยา" },
  { position: [22, 32], size: [14, 12], height: 12, radius: 0.8, label: "การเงิน" },
  { position: [8, -58], size: [24, 18], height: 11, radius: 1, label: "โรงอาหาร" },
  { position: [-28, 28], size: [16, 18], height: 17, radius: 1.2 },
  { position: [20, 0], size: [18, 16], height: 20, radius: 1.2 },
  { position: [2, -20], size: [22, 14], height: 13, radius: 1 },
];

export const WORLD_SIZE = 220;

export const TB_CLINIC_ID = 0;
export const RECEPTION_ID = 1;
export const PHARMACY_ID = 2;
export const CASHIER_ID = 3;
export const CAFETERIA_ID = 4;
export const RESTROOM_ID = 5;
export const WALKWAY_ID = 6;
export const IPD_ID = 7;
export const RESTROOM_TB_ID = 8;
export const RESTROOM_RX_ID = 9;
export const RESTROOM_CASH_ID = 10;
export const RESTROOM_FOOD_ID = 11;
export const RESTROOM_IPD_ID = 12;

/** ห้องน้ำทุกตึก */
export const RESTROOM_ZONE_IDS = [5, 8, 9, 10, 11, 12] as const;

/** อาคารหลัก → ห้องน้ำในตึก */
export const BUILDING_RESTROOM: Record<number, number> = {
  [TB_CLINIC_ID]: RESTROOM_TB_ID,
  [RECEPTION_ID]: RESTROOM_ID,
  [PHARMACY_ID]: RESTROOM_RX_ID,
  [CASHIER_ID]: RESTROOM_CASH_ID,
  [CAFETERIA_ID]: RESTROOM_FOOD_ID,
  [IPD_ID]: RESTROOM_IPD_ID,
};

export function isRestroomZone(zoneId: number): boolean {
  return ZONES[zoneId]?.kind === "restroom";
}

/** ห้องน้ำที่สัมพันธ์กับโzoนที่อยู่ (ไป WC ตึกเดียวกัน) */
export function restroomForZone(zoneId: number): number {
  if (isRestroomZone(zoneId)) return zoneId;
  if (BUILDING_RESTROOM[zoneId] != null) return BUILDING_RESTROOM[zoneId];
  if (zoneId === WALKWAY_ID) return RESTROOM_ID;
  let best = RESTROOM_ID;
  let bestDist = Infinity;
  const pos = zoneCenter(zoneId);
  for (const wcId of RESTROOM_ZONE_IDS) {
    const d = Math.hypot(
      pos[0] - ZONES[wcId].position[0],
      pos[1] - ZONES[wcId].position[1]
    );
    if (d < bestDist) {
      bestDist = d;
      best = wcId;
    }
  }
  return best;
}

/** ตึกเจ้าของของห้องน้ำ */
export function hostBuildingForRestroom(wcId: number): number | null {
  for (const [buildingId, rid] of Object.entries(BUILDING_RESTROOM)) {
    if (rid === wcId) return Number(buildingId);
  }
  return null;
}

/** ตำแหน่งย่อยในคลินิก TB เมื่อแบ่งโซน */
export const TB_SUBZONES = {
  active: {
    offset: [-7, -4] as [number, number],
    size: [10, 8] as [number, number],
    color: "#ec5b54",
    emissive: "#ec5b54",
    label: "Active",
    labelTh: "ผู้ป่วย Active",
    accent: "#dc2626",
  },
  non_active: {
    offset: [5, 2] as [number, number],
    size: [9, 7] as [number, number],
    color: "#14b8a6",
    emissive: "#5eead4",
    label: "Non-active",
    labelTh: "Non-active",
    /** สีขอบ/กำแพง — ให้ contrast กับตึก TB เขียว */
    accent: "#0f766e",
  },
  family: {
    offset: [5, -5] as [number, number],
    size: [9, 7] as [number, number],
    color: "#7ea2e8",
    emissive: "#5b8cf0",
    label: "Family",
    labelTh: "ญาติ/ผู้ติดตาม",
    accent: "#2563eb",
  },
} as const;

export type TbSubzoneKey = keyof typeof TB_SUBZONES;

/** หา path ระหว่างสองโซน (BFS สั้นสุด) */
export function findPath(from: number, to: number): number[] {
  if (from === to) return [from];
  const adj = new Map<number, number[]>();
  for (const p of PATHS) {
    if (!adj.has(p.from)) adj.set(p.from, []);
    if (!adj.has(p.to)) adj.set(p.to, []);
    adj.get(p.from)!.push(p.to);
    adj.get(p.to)!.push(p.from);
  }
  const queue: number[] = [from];
  const prev = new Map<number, number>();
  prev.set(from, -1);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const n of adj.get(cur) ?? []) {
      if (prev.has(n)) continue;
      prev.set(n, cur);
      queue.push(n);
    }
  }
  if (!prev.has(to)) return [from, to];
  const path: number[] = [];
  let c = to;
  while (c !== -1) {
    path.unshift(c);
    c = prev.get(c)!;
  }
  return path;
}

export function lerpPos(
  a: [number, number],
  b: [number, number],
  t: number
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function zoneCenter(id: number): [number, number] {
  return ZONES[id].position;
}

/** ระยะทางเดินระหว่างสองโซน (เมตร) */
export function segmentDistance(from: number, to: number): number {
  const edge = PATHS.find(
    (p) => (p.from === from && p.to === to) || (p.to === from && p.from === to)
  );
  if (edge) return edge.distance;
  const a = zoneCenter(from);
  const b = zoneCenter(to);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.15;
}

function segmentControl(fromId: number, toId: number): [number, number] {
  const a = zoneCenter(fromId);
  const b = zoneCenter(toId);
  const mid = lerpPos(a, b, 0.5);
  const edge = PATHS.find(
    (p) =>
      (p.from === fromId && p.to === toId) ||
      (p.to === fromId && p.from === toId)
  );
  if (edge?.outdoor) {
    const walk = zoneCenter(WALKWAY_ID);
    return lerpPos(mid, walk, 0.38);
  }
  return mid;
}

/** จุดบนเส้นทางเดินโค้ง ระหว่างสองโซน t=0..1 */
export function pointOnSegment(
  fromId: number,
  toId: number,
  t: number
): [number, number] {
  const a = zoneCenter(fromId);
  const b = zoneCenter(toId);
  const c = segmentControl(fromId, toId);
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
  ];
}

/** ease สำหรับ render — เริ่ม/หยุดนุ่ม */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** ความเร็วเดิน (m/s sim) — ช้าเพื่อมองเห็นการเดินทาง */
export const WALK_SPEED = {
  active: 0.95,
  family: 1.25,
  default: 1.45,
} as const;

/** ตัวคูณชะลอ progress บนเส้นทาง (<1 = ช้าลง) */
export const TRANSIT_PACE = 0.48;
